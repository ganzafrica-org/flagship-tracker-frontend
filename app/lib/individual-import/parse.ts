import type { CreateIndividualRequest } from "~/lib/queries/individuals";
import type { ImportIssue, ParsedEntity, ParsedWorkbook } from "~/lib/import/types";
import { cellText, findSheet, openWorkbook, readSheet, RowReader, type SheetRow } from "~/lib/import/workbook";
import { listCells, listDistricts, listProvinces, listSectors, listVillages, matchName } from "~/lib/rwanda-hierarchy";
import type { IndividualImportLookups } from "./lookups";
import {
  DISABILITY_OPTIONS,
  INDIVIDUALS_SHEET,
  INDIVIDUAL_COLUMNS,
  MAX_INDIVIDUALS_PER_IMPORT,
  YOUTH_STATUS_OPTIONS,
} from "./schema";
import type { IndividualImportItem } from "./types";

const underscored = (t: string) => t.toLowerCase().replace(/[\s-]+/g, "_");
const yesNo = (t: string) => {
  const l = t.toLowerCase();
  return { yes: "true", y: "true", no: "false", n: "false" }[l] ?? l;
};

/** Province → district → sector → cell → village must exist in Rwanda's administrative hierarchy, as the form's selector enforces. */
function readLocation(r: RowReader): Pick<CreateIndividualRequest, "province" | "district" | "sector" | "cell" | "village"> | null {
  const provinceText = r.text("province", 50);
  const districtText = r.text("district", 50);
  const sectorText = r.text("sector", 50);
  const cellInput = r.text("cell", 50);
  const villageInput = r.text("village", 50);

  const provinces = listProvinces();
  const province = provinceText ? matchName(provinces, provinceText) : undefined;
  if (provinceText && !province) r.fail("province", `"${provinceText}" is not a province. Allowed: ${provinces.join(", ")}`);

  let district: string | undefined;
  if (districtText && province) {
    const districts = listDistricts(province);
    district = matchName(districts, districtText);
    if (!district) r.fail("district", `"${districtText}" is not a district of ${province}. Allowed: ${districts.join(", ")}`);
  }

  let sector: string | undefined;
  if (sectorText && province && district) {
    const sectors = listSectors(province, district);
    sector = matchName(sectors, sectorText);
    if (!sector) r.fail("sector", `"${sectorText}" is not a sector of ${district}. See the Lists sheet.`);
  }

  let cell = "";
  if (cellInput && province && district && sector) {
    const cells = listCells(province, district, sector);
    const match = matchName(cells, cellInput);
    if (match) cell = match;
    else r.fail("cell", `"${cellInput}" is not a cell of ${sector}`);
  }

  let village = "";
  if (villageInput) {
    if (!cellInput) {
      r.fail("village", "Enter the Cell as well: the village must belong to a cell");
    } else if (province && district && sector && cell) {
      const match = matchName(listVillages(province, district, sector, cell), villageInput);
      if (match) village = match;
      else r.fail("village", `"${villageInput}" is not a village of ${cell}`);
    }
  }

  if (!province || !district || !sector) return null;
  return { province, district, sector, cell, village };
}

function parseRow(sr: SheetRow, lookups: IndividualImportLookups): ParsedEntity<IndividualImportItem> {
  const issues: ImportIssue[] = [];
  const r = new RowReader(INDIVIDUALS_SHEET, INDIVIDUAL_COLUMNS, sr.row, sr.cells, issues);

  // Same rules as the Add Individual form (and the API): required fields, lengths and allowed values.
  const nationalId = r.text("nationalId", 20);
  const phoneNumber = r.text("phoneNumber", 15);
  const firstName = r.text("firstName", 100);
  const lastName = r.text("lastName", 100);
  const sex = r.option("sex", lookups.sex);
  const dateOfBirth = r.date("dateOfBirth");
  if (dateOfBirth && dateOfBirth > new Date().toISOString().slice(0, 10)) r.fail("dateOfBirth", "Date of Birth cannot be in the future");
  const youthStatus = r.option("youthStatus", YOUTH_STATUS_OPTIONS, underscored);
  const youthCategory = r.option("youthCategory", lookups.youthCategory, underscored);
  const educationLevel = r.option("educationLevel", lookups.educationLevel, underscored);
  const disability = r.option("disabilityStatus", DISABILITY_OPTIONS, yesNo);
  const registrationSource = r.option("registrationSource", lookups.registrationSource);
  const location = readLocation(r);
  const latitude = r.decimal("latitude", { min: -2.84, max: -1.05, digits: false });
  const longitude = r.decimal("longitude", { min: 28.86, max: 30.9, digits: false });

  const name = [firstName, lastName].filter(Boolean).join(" ") || "(no name)";
  let payload: IndividualImportItem | null = null;
  if (issues.length === 0 && phoneNumber && firstName && lastName && sex && youthStatus && registrationSource && location) {
    payload = {
      row: sr.row,
      individual: {
        ...(nationalId ? { nationalId } : {}),
        phoneNumber,
        firstName,
        lastName,
        sex,
        ...(dateOfBirth ? { dateOfBirth } : {}),
        youthStatus,
        ...(youthCategory ? { youthCategory } : {}),
        ...(educationLevel ? { educationLevel } : {}),
        ...(disability !== undefined ? { disabilityStatus: disability === "true" } : {}),
        registrationSource,
        ...location,
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
      },
    };
  }

  return {
    row: sr.row,
    title: name,
    subtitle: `Row ${sr.row}${nationalId ? ` · National ID ${nationalId}` : ""}${phoneNumber ? ` · ${phoneNumber}` : ""}`,
    payload,
    errors: issues,
    warnings: [],
  };
}

/** Flags a National ID that repeats an earlier row of the same file (the server checks the database, and warns about shared phone numbers). */
function flagDuplicateNationalIds(entities: ParsedEntity<IndividualImportItem>[], sheetRows: SheetRow[]) {
  const seen = new Map<string, number>();
  const byRow = new Map(sheetRows.map((s) => [s.row, s]));

  for (const entity of entities) {
    const nid = cellText(byRow.get(entity.row)!.cells.nationalId).toUpperCase();
    if (!nid) continue;
    const first = seen.get(nid);
    if (first === undefined) {
      seen.set(nid, entity.row);
      continue;
    }
    entity.errors.push({
      sheet: INDIVIDUALS_SHEET,
      row: entity.row,
      field: "National ID",
      message: `National ID ${nid} is repeated in this file (first on row ${first})`,
    });
    entity.payload = null;
  }
}

export async function parseIndividualFile(file: File, lookups: IndividualImportLookups): Promise<ParsedWorkbook<IndividualImportItem>> {
  const fileProblems: string[] = [];
  const empty = (): ParsedWorkbook<IndividualImportItem> => ({ entities: [], orphanIssues: [], fileProblems });

  const opened = await openWorkbook(file);
  if ("problem" in opened) {
    fileProblems.push(opened.problem);
    return empty();
  }
  const sheet = findSheet(opened.workbook, INDIVIDUALS_SHEET);
  if (!sheet) {
    fileProblems.push(`The "${INDIVIDUALS_SHEET}" sheet is missing. Download the template and fill it in.`);
    return empty();
  }

  const sheetRows = readSheet(sheet, INDIVIDUALS_SHEET, INDIVIDUAL_COLUMNS, fileProblems);
  if (sheetRows.length > MAX_INDIVIDUALS_PER_IMPORT) {
    fileProblems.push(`At most ${MAX_INDIVIDUALS_PER_IMPORT} individuals can be imported at once (this file has ${sheetRows.length}).`);
  }
  const entities = sheetRows.map((sr) => parseRow(sr, lookups));
  flagDuplicateNationalIds(entities, sheetRows);

  return { entities, orphanIssues: [], fileProblems: [...new Set(fileProblems)] };
}
