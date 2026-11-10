import type { ImportIssue, ParsedEntity, ParsedWorkbook } from "~/lib/import/types";
import { findSheet, openWorkbook, readSheet, RowReader, type SheetRow } from "~/lib/import/workbook";
import type { LookupOption } from "~/lib/import/schema";
import type { CooperativeRequest } from "~/lib/queries/cooperatives";
import { listDistricts, listProvinces, listSectors, matchName } from "~/lib/rwanda-hierarchy";
import { COOPERATIVE_COLUMNS, cooperativeSheetName, MAX_COOPERATIVES_PER_IMPORT } from "./schema";
import type { CooperativeImportItem, CooperativeImportLookups } from "./types";
import { isSameCooperative } from "./match";

export const ALREADY_EXISTS = "Already exists";
export const ALREADY_DRAFTED = "Already saved as draft";

const underscored = (t: string) => t.toLowerCase().trim().replace(/[\s-]+/g, "_");
const key = (t: string | null | undefined) => (t ?? "").trim().toLowerCase();

/** Option matched by stored value or label (no issue recorded); used before full validation. */
function resolve(options: LookupOption[], text: string, normalize: (t: string) => string): string | undefined {
  if (!text) return undefined;
  const wanted = normalize(text);
  return options.find((o) => normalize(o.value) === wanted || normalize(o.label) === wanted)?.value;
}

/**
 * Province → district → sector as the form's location picker allows (all optional, but each needs
 * the level above it). Cell and village are not saved by the form, so they are not in the sheet.
 */
function readLocation(r: RowReader): Pick<CooperativeRequest, "province" | "district" | "sector"> {
  const provinceText = r.text("province", 50);
  const districtText = r.text("district", 50);
  const sectorText = r.text("sector", 50);

  const provinces = listProvinces();
  const province = provinceText ? matchName(provinces, provinceText) : undefined;
  if (provinceText && !province) r.fail("province", `"${provinceText}" is not a province. Allowed: ${provinces.join(", ")}`);

  let district: string | undefined;
  if (districtText) {
    if (!provinceText) r.fail("district", "Enter the Province as well: the district must belong to a province");
    else if (province) {
      const districts = listDistricts(province);
      district = matchName(districts, districtText);
      if (!district) r.fail("district", `"${districtText}" is not a district of ${province}. Allowed: ${districts.join(", ")}`);
    }
  }

  let sector: string | undefined;
  if (sectorText) {
    if (!districtText) r.fail("sector", "Enter the District as well: the sector must belong to a district");
    else if (province && district) {
      sector = matchName(listSectors(province, district), sectorText);
      if (!sector) r.fail("sector", `"${sectorText}" is not a sector of ${district}. See the Lists sheet.`);
    }
  }

  return {
    ...(province ? { province } : {}),
    ...(district ? { district } : {}),
    ...(sector ? { sector } : {}),
  };
}

function parseRow(sr: SheetRow, sheet: string, lookups: CooperativeImportLookups): ParsedEntity<CooperativeImportItem> {
  const issues: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const r = new RowReader(sheet, COOPERATIVE_COLUMNS, sr.row, sr.cells, issues);

  const nameText = r.peek("cooperativeName");
  const title = nameText || "(no name)";
  const subtitle = `Row ${sr.row}${r.peek("district") ? ` · ${r.peek("district")}` : ""}`;

  // A row that is an existing record (e.g. from the pre-filled template) is left alone: same name,
  // group type and district (case-insensitive). It is not validated or sent, so edits to it are ignored.
  const identity = { cooperativeName: nameText, groupType: resolve(lookups.groupTypes, r.peek("groupType"), underscored), district: r.peek("district") };
  if ((lookups.existing ?? []).some((c) => isSameCooperative(c, identity))) {
    return { row: sr.row, title, subtitle, payload: null, errors: [], warnings: [], skipped: ALREADY_EXISTS };
  }
  // Uploaded before without a connection: it is waiting on the Draft tab already.
  if ((lookups.drafts ?? []).some((d) => isSameCooperative(d, identity))) {
    return { row: sr.row, title, subtitle, payload: null, errors: [], warnings: [], skipped: ALREADY_DRAFTED };
  }

  // Same rules as the Add Cooperative form, plus the API's limits (CreateCooperativeRequest).
  const cooperativeName = r.text("cooperativeName", 200);
  const cooperativeCode = r.text("cooperativeCode", 30);
  const groupType = r.option("groupType", lookups.groupTypes, underscored);
  const registrationStatus = r.option("registrationStatus", lookups.registrationStatuses, underscored);
  const primaryValueChain = r.text("primaryValueChain", 100);
  const cluster = r.text("cluster", 100);
  const totalMembers = r.int("totalMembers", { min: 0 });
  const femaleMembers = r.int("femaleMembers", { min: 0 });
  const youthMembers = r.int("youthMembers", { min: 0 });
  const location = readLocation(r);
  const flagship = r.option("flagship", lookups.flagships, (t) => t.toLowerCase().replace(/\s+/g, " ").trim());
  const engagementType = r.option("engagementType", lookups.engagementTypes, underscored);
  const startDate = r.date("engagementStartDate");
  const endDate = r.date("engagementEndDate");

  // The API refuses a second cooperative with the same name in the same district (any group type).
  if (cooperativeName && location.district) {
    const clash = (lookups.existing ?? []).find(
      (c) => key(c.cooperativeName) === key(cooperativeName) && key(c.district) === key(location.district),
    );
    if (clash) {
      const other = lookups.groupTypes.find((g) => g.value === clash.groupType)?.label ?? clash.groupType;
      r.fail("cooperativeName", `A record named "${clash.cooperativeName}" already exists in ${clash.district} (as ${other})`);
    }
  }

  if (lookups.existing === null) {
    warnings.push({ sheet, row: sr.row, field: "", message: "Offline: could not check whether this record already exists. It is checked again before it is submitted." });
  }

  // The form only saves engagement details together with a flagship; without one they are dropped.
  if (!r.peek("flagship") && (r.peek("engagementType") || r.peek("engagementStartDate") || r.peek("engagementEndDate"))) {
    warnings.push({ sheet, row: sr.row, field: "Flagship", message: "No Flagship given, so Engagement Type and the dates are not saved" });
  }

  let payload: CooperativeImportItem | null = null;
  if (issues.length === 0 && cooperativeName && groupType) {
    payload = {
      row: sr.row,
      cooperative: {
        cooperativeName,
        ...(cooperativeCode ? { cooperativeCode } : {}),
        groupType,
        ...(registrationStatus ? { registrationStatus } : {}),
        ...(primaryValueChain ? { primaryValueChain } : {}),
        ...(cluster ? { cluster } : {}),
        ...(totalMembers !== undefined ? { totalMembers } : {}),
        ...(femaleMembers !== undefined ? { femaleMembers } : {}),
        ...(youthMembers !== undefined ? { youthMembers } : {}),
        ...location,
        ...(flagship
          ? {
              flagships: [
                {
                  flagshipId: Number(flagship),
                  ...(engagementType ? { engagementType } : {}),
                  ...(startDate ? { startDate } : {}),
                  ...(endDate ? { endDate } : {}),
                },
              ],
            }
          : {}),
      },
    };
  }

  return { row: sr.row, title, subtitle, payload, errors: issues, warnings };
}

/** Flags a row that repeats an earlier new row's name in the same district (blank district: same group type). */
function flagDuplicates(entities: ParsedEntity<CooperativeImportItem>[], sheet: string) {
  const seen = new Map<string, number>();
  for (const entity of entities) {
    const c = entity.payload?.cooperative;
    if (!c) continue;
    const k = c.district ? `${key(c.cooperativeName)}|${key(c.district)}` : `${key(c.cooperativeName)}||${c.groupType}`;
    const first = seen.get(k);
    if (first === undefined) {
      seen.set(k, entity.row);
      continue;
    }
    entity.errors.push({
      sheet,
      row: entity.row,
      field: "Cooperative Name",
      message: `"${c.cooperativeName}" is repeated in this file${c.district ? ` for ${c.district}` : ""} (first on row ${first})`,
    });
    entity.payload = null;
  }
}

export async function parseCooperativeFile(
  file: File,
  type: string,
  lookups: CooperativeImportLookups,
): Promise<ParsedWorkbook<CooperativeImportItem>> {
  const sheetName = cooperativeSheetName(type);
  const fileProblems: string[] = [];
  const empty = (): ParsedWorkbook<CooperativeImportItem> => ({ entities: [], orphanIssues: [], fileProblems });

  const opened = await openWorkbook(file);
  if ("problem" in opened) {
    fileProblems.push(opened.problem);
    return empty();
  }
  const sheet = findSheet(opened.workbook, sheetName);
  if (!sheet) {
    fileProblems.push(`The "${sheetName}" sheet is missing. Download the template from this page and fill it in.`);
    return empty();
  }

  const entities = readSheet(sheet, sheetName, COOPERATIVE_COLUMNS, fileProblems).map((sr) => parseRow(sr, sheetName, lookups));
  flagDuplicates(entities, sheetName);

  // Existing records from the pre-filled template are not imported, so they do not count toward the limit.
  const newRows = entities.filter((e) => !e.skipped).length;
  if (newRows > MAX_COOPERATIVES_PER_IMPORT) {
    fileProblems.push(`At most ${MAX_COOPERATIVES_PER_IMPORT} new records can be imported at once (this file has ${newRows}).`);
  }

  return { entities, orphanIssues: [], fileProblems: [...new Set(fileProblems)] };
}
