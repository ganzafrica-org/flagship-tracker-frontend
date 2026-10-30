import type { CreateFlagshipRequest, FlagshipStatus } from "~/lib/queries/flagships";
import type { ImportLookups } from "./lookups";
import { MAX_FLAGSHIPS_PER_IMPORT, SHEET_COLUMNS, SHEET_NAMES, type SheetId } from "./schema";
import type {
  ImportInvestmentPayload,
  ImportKpiPayload,
  ImportLocationPayload,
  ImportRequestItem,
} from "./types";
import type { ImportIssue, ParsedWorkbook } from "~/lib/import/types";
import { canonicalProvince } from "~/lib/rwanda-locations";
import { cellText, findSheet, openWorkbook, readSheet, RowReader, type SheetRow } from "~/lib/import/workbook";

/** One flagship read from the workbook, with everything that belongs to it. */
interface ParsedFlagship {
  /** Row on the Basic Details sheet. */
  row: number;
  code: string;
  name: string;
  basic: CreateFlagshipRequest | null;
  investments: ImportInvestmentPayload[];
  kpis: ImportKpiPayload[];
  locations: ImportLocationPayload[];
  /** Problems found reading the file (same rules as the form). */
  errors: ImportIssue[];
}

function reader(sheet: SheetId, sr: SheetRow, issues: ImportIssue[]): RowReader {
  return new RowReader(SHEET_NAMES[sheet], SHEET_COLUMNS[sheet], sr.row, sr.cells, issues);
}

// ─── Per-sheet parsing ────────────────────────────────────────────────────────

function parseBasic(sr: SheetRow, lookups: ImportLookups): ParsedFlagship {
  const issues: ImportIssue[] = [];
  const r = reader("basic", sr, issues);

  const name = r.text("flagshipName", 200);
  const codeText = r.text("flagshipCode", 20);
  const cluster = r.option("flagshipCluster", lookups.clusters);
  const status = r.option("status", lookups.statuses);

  // The form only offers value chains of the chosen cluster.
  let primaryValueChain: string | undefined;
  const vcText = r.peek("primaryValueChain");
  if (vcText) {
    const inCluster = cluster ? lookups.valueChains.filter((v) => v.cluster === cluster) : lookups.valueChains;
    primaryValueChain = r.option("primaryValueChain", inCluster.map((v) => ({ value: v.valueChain, label: v.valueChain })));
  }

  const description = r.text("description", 10_000);
  const funder = r.option("funders", lookups.funders);
  const startDate = r.date("startDate");
  const endDate = r.date("endDate");
  if (startDate && endDate && endDate < startDate) r.fail("endDate", "End Date must be on or after Start Date");
  const implementingAgency = r.option("implementingAgency", lookups.agencies);
  const managementModel = r.text("managementModel", 100);
  const targetYouthCount = r.int("targetYouthCount", { min: 1 });
  const budgetTotalRwf = r.int("budgetTotalRwf", { min: 1 });

  const code = (codeText ?? "").toUpperCase();
  let basic: CreateFlagshipRequest | null = null;
  if (issues.length === 0 && name && code && cluster && status) {
    basic = {
      flagshipName: name,
      flagshipCode: code,
      flagshipCluster: cluster,
      status: status as FlagshipStatus,
      ...(description ? { description } : {}),
      ...(primaryValueChain ? { primaryValueChain } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(implementingAgency ? { implementingAgency } : {}),
      ...(managementModel ? { managementModel } : {}),
      ...(targetYouthCount !== undefined ? { targetYouthCount } : {}),
      ...(budgetTotalRwf !== undefined ? { budgetTotalRwf } : {}),
      ...(funder ? { funders: funder } : {}),
    };
  }
  return {
    row: sr.row,
    code,
    name: name ?? "",
    basic,
    investments: [],
    kpis: [],
    locations: [],
    errors: issues,
  };
}

function parseInvestment(sr: SheetRow, lookups: ImportLookups, issues: ImportIssue[]): ImportInvestmentPayload | null {
  const before = issues.length;
  const r = reader("investment", sr, issues);
  const amount = r.decimal("amount", { exclusiveMin: 0 });
  const currency = r.option("currency", lookups.currencies);
  const sourceType = r.option("sourceType", lookups.sourceTypes);
  const funderName = r.option("funderName", lookups.funders);
  const investmentDate = r.date("investmentDate");
  const year = r.int("year", { min: 2000, max: 2100 });
  const disbursementType = r.option("disbursementType", lookups.disbursementTypes);
  const notes = r.text("notes", 5000);
  if (investmentDate && year !== undefined && Number(investmentDate.slice(0, 4)) !== year) {
    r.fail("year", `Year must match the year of Investment Date (${investmentDate.slice(0, 4)})`);
  }
  if (issues.length > before || amount === undefined || !currency || !sourceType || !funderName || year === undefined) return null;
  return {
    row: sr.row,
    amount,
    currency,
    sourceType,
    funderName,
    ...(investmentDate ? { investmentDate } : {}),
    year,
    ...(disbursementType ? { disbursementType } : {}),
    ...(notes ? { notes } : {}),
  };
}

function parseKpi(sr: SheetRow, code: string, lookups: ImportLookups, issues: ImportIssue[]): ImportKpiPayload | null {
  const before = issues.length;
  const r = reader("kpis", sr, issues);

  const forCode = lookups.kpiDefinitions.filter((d) => d.flagshipCode === code);
  const indicatorName = r.option(
    "indicatorName",
    forCode.map((d) => ({ value: d.indicatorName, label: d.indicatorName })),
  );
  // An empty list means there are no approved KPIs for this code at all.
  if (forCode.length === 0 && r.peek("indicatorName")) {
    // option() already reported "none available"; make the cause explicit.
    issues[issues.length - 1].message = `No approved KPI indicators exist for flagship code ${code}`;
  }
  const baselineValue = r.decimal("baselineValue", { min: 0 });
  const targetValue = r.decimal("targetValue", { min: 0 });
  const actualValue = r.decimal("actualValue", { min: 0 });
  const point = r.option("measurementPoint", lookups.measurementPoints);
  const year = r.int("year", { min: 2000, max: 2100 });
  const reportingPeriod = r.option("reportingPeriod", lookups.reportingPeriods);
  if (issues.length > before || !indicatorName || point === undefined || year === undefined || !reportingPeriod) return null;
  return {
    row: sr.row,
    indicatorName,
    ...(baselineValue !== undefined ? { baselineValue } : {}),
    ...(targetValue !== undefined ? { targetValue } : {}),
    ...(actualValue !== undefined ? { actualValue } : {}),
    measurementPoint: Number(point),
    year,
    reportingPeriod,
  };
}

function parseLocation(sr: SheetRow, lookups: ImportLookups, issues: ImportIssue[]): ImportLocationPayload | null {
  const before = issues.length;
  const r = reader("location", sr, issues);
  const provinceText = r.text("province", 50);
  const district = r.text("district", 50);
  const sector = r.text("sector", 50);
  let province: string | undefined;
  if (provinceText) {
    const canonical = canonicalProvince(provinceText);
    const match = lookups.provinces.find((p) => p.toLowerCase() === (canonical ?? "").toLowerCase());
    if (match) province = match;
    else r.fail("province", `"${provinceText}" is not an allowed value. Allowed: ${lookups.provinces.join(", ")}`);
  }
  if (issues.length > before || !province || !district) return null;
  return { row: sr.row, province, district, ...(sector ? { sector } : {}) };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function parseImportFile(file: File, lookups: ImportLookups): Promise<ParsedWorkbook<ImportRequestItem>> {
  const fileProblems: string[] = [];
  const empty = (): ParsedWorkbook<ImportRequestItem> => ({ entities: [], orphanIssues: [], fileProblems });

  const opened = await openWorkbook(file);
  if ("problem" in opened) {
    fileProblems.push(opened.problem);
    return empty();
  }
  const wb = opened.workbook;

  const basicSheet = findSheet(wb, SHEET_NAMES.basic);
  if (!basicSheet) {
    fileProblems.push(`The "${SHEET_NAMES.basic}" sheet is missing. Download the template and fill it in.`);
    return empty();
  }

  const flagships: ParsedFlagship[] = [];
  const byCode = new Map<string, ParsedFlagship>();
  for (const sr of readSheet(basicSheet, SHEET_NAMES.basic, SHEET_COLUMNS.basic, fileProblems)) {
    const parsed = parseBasic(sr, lookups);
    if (parsed.code) {
      const first = byCode.get(parsed.code);
      if (first) {
        parsed.errors.push({
          sheet: SHEET_NAMES.basic,
          row: sr.row,
          field: "Flagship Code",
          message: `Flagship Code ${parsed.code} is repeated in this file (first on row ${first.row})`,
        });
        parsed.basic = null;
      } else {
        byCode.set(parsed.code, parsed);
      }
    }
    flagships.push(parsed);
  }

  if (flagships.length > MAX_FLAGSHIPS_PER_IMPORT) {
    fileProblems.push(`At most ${MAX_FLAGSHIPS_PER_IMPORT} flagships can be imported at once (this file has ${flagships.length}).`);
  }

  const orphanIssues: ImportIssue[] = [];
  const children: [SheetId, (sr: SheetRow, f: ParsedFlagship) => void][] = [
    ["investment", (sr, f) => {
      const p = parseInvestment(sr, lookups, f.errors);
      if (p) f.investments.push(p);
    }],
    ["kpis", (sr, f) => {
      const p = parseKpi(sr, f.code, lookups, f.errors);
      if (p) f.kpis.push(p);
    }],
    ["location", (sr, f) => {
      const p = parseLocation(sr, lookups, f.errors);
      if (p) f.locations.push(p);
    }],
  ];

  for (const [sheetId, handle] of children) {
    const ws = findSheet(wb, SHEET_NAMES[sheetId]);
    if (!ws) continue;
    for (const sr of readSheet(ws, SHEET_NAMES[sheetId], SHEET_COLUMNS[sheetId], fileProblems)) {
      const code = cellText(sr.cells.flagshipCode).toUpperCase();
      const field = SHEET_COLUMNS[sheetId][0].header;
      if (!code) {
        orphanIssues.push({ sheet: SHEET_NAMES[sheetId], row: sr.row, field, message: "Required" });
        continue;
      }
      const owner = byCode.get(code);
      if (!owner) {
        orphanIssues.push({ sheet: SHEET_NAMES[sheetId], row: sr.row, field, message: `No flagship with code ${code} on the ${SHEET_NAMES.basic} sheet` });
        continue;
      }
      handle(sr, owner);
    }
  }

  // A flagship is only sent if every row that belongs to it is clean.
  for (const f of flagships) if (f.errors.length > 0) f.basic = null;

  return {
    entities: flagships.map((f) => ({
      row: f.row,
      title: `${f.code || "(no code)"} — ${f.name || "(no name)"}`,
      subtitle: `Row ${f.row} · ${f.investments.length} investments · ${f.kpis.length} KPIs · ${f.locations.length} locations`,
      payload: f.basic
        ? { row: f.row, basic: f.basic, investments: f.investments, kpis: f.kpis, locations: f.locations }
        : null,
      errors: f.errors,
    })),
    orphanIssues,
    fileProblems: [...new Set(fileProblems)],
  };
}
