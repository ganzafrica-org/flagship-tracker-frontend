import { formatApiErrorMessage } from "~/lib/api-errors";

export type SpreadsheetRow = Record<string, string>;

const SPREADSHEET_EXTENSIONS = new Set([
  "xlsx",
  "xls",
  "xlsm",
  "xlsb",
  "xltx",
  "xltm",
  "xlt",
  "xml",
  "csv",
  "tsv",
  "ods",
]);

export const SPREADSHEET_ACCEPT = [
  ".xlsx",
  ".xls",
  ".xlsm",
  ".xlsb",
  ".xltx",
  ".xltm",
  ".xlt",
  ".xml",
  ".csv",
  ".tsv",
  ".ods",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "application/vnd.ms-excel.template.macroEnabled.12",
  "text/csv",
  "text/tab-separated-values",
  "application/vnd.oasis.opendocument.spreadsheet",
].join(",");

export function spreadsheetExtension(fileName: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

export function isSpreadsheetFile(fileName: string): boolean {
  return SPREADSHEET_EXTENSIONS.has(spreadsheetExtension(fileName));
}

export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).trim();
}

export async function parseSpreadsheet(file: File): Promise<SpreadsheetRow[]> {
  if (!isSpreadsheetFile(file.name)) {
    throw new Error(
      "Use an Excel file (.xlsx, .xls, .xlsm, .xlsb, .xltx, .xltm, .xlt), CSV, TSV, or ODS spreadsheet.",
    );
  }

  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: "",
    raw: true,
  });

  return raw
    .map((row) => {
      const out: SpreadsheetRow = {};
      for (const [key, value] of Object.entries(row)) {
        const header = normalizeHeader(String(key));
        if (!header || out[header]) continue;
        const text = cellToString(value);
        if (text) out[header] = text;
      }
      return out;
    })
    .filter((row) => Object.values(row).some(Boolean));
}

export function pickCell(row: SpreadsheetRow, aliases: string[]): string {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value) return value;
  }
  return "";
}

export function matchOption(raw: string, options: { label: string; value: string }[]): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const needle = normalizeHeader(trimmed);
  const found = options.find(
    (option) => normalizeHeader(option.value) === needle || normalizeHeader(option.label) === needle,
  );
  return found?.value ?? "";
}

/** Reads yyyy-mm-dd, dd/mm/yyyy, and Excel serial dates into an ISO date. */
export function toIsoDate(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dayFirst = /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/.exec(value);
  if (dayFirst) {
    const day = dayFirst[1].padStart(2, "0");
    const month = dayFirst[2].padStart(2, "0");
    return `${dayFirst[3]}-${month}-${day}`;
  }

  if (/^\d{4,5}(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    const utc = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    if (!Number.isNaN(utc.getTime())) return utc.toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface SpreadsheetImportOutcome {
  mode: "form" | "bulk";
  created: number;
  errors: string[];
}

function hasImportedValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (value && typeof value === "object") return Object.values(value).some(hasImportedValue);
  return false;
}

export async function importMappedRows<T>(args: {
  rows: SpreadsheetRow[];
  mapRow: (row: SpreadsheetRow) => T;
  isUsable: (value: T) => boolean;
  missingMessage: string;
  onSingle?: (value: T) => void;
  /** Create every usable row, including a sheet with only one row. */
  alwaysCreate?: boolean;
  create: (value: T) => Promise<void>;
}): Promise<SpreadsheetImportOutcome> {
  if (!args.alwaysCreate && args.rows.length === 1) {
    const value = args.mapRow(args.rows[0]);
    if (!hasImportedValue(value)) {
      return {
        mode: "form",
        created: 0,
        errors: ["No columns matched this form. Use the field names as the spreadsheet header row."],
      };
    }
    args.onSingle?.(value);
    return {
      mode: "form",
      created: 0,
      errors: args.isUsable(value) ? [] : [args.missingMessage],
    };
  }

  const errors: string[] = [];
  const usable: { value: T; rowNumber: number }[] = [];
  args.rows.forEach((row, index) => {
    const value = args.mapRow(row);
    const rowNumber = index + 2;
    if (args.isUsable(value)) usable.push({ value, rowNumber });
    else errors.push(`Row ${rowNumber}: ${args.missingMessage}`);
  });

  let created = 0;
  for (const item of usable) {
    try {
      await args.create(item.value);
      created += 1;
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Request failed";
      errors.push(`Row ${item.rowNumber}: ${formatApiErrorMessage(raw)}`);
    }
  }

  return { mode: "bulk", created, errors };
}
