import type { CellValue, Worksheet } from "exceljs";

import { MAX_FILE_BYTES, type ImportColumn, type LookupOption } from "./schema";
import type { ImportIssue } from "./types";

export type Cells = Record<string, CellValue>;
export interface SheetRow {
  row: number;
  cells: Cells;
}

// ─── Reading cells ────────────────────────────────────────────────────────────

export function isEmpty(v: CellValue | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  return false;
}

/** Plain text of any cell value (rich text, formulas and hyperlinks included). */
export function cellText(v: CellValue | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("").trim();
    if ("result" in v) return cellText(v.result as CellValue);
    if ("text" in v) return cellText(v.text as CellValue);
    if ("error" in v) return "";
  }
  return "";
}

function normalizeHeader(text: string): string {
  return text.replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function findSheet(wb: { worksheets: Worksheet[] }, name: string): Worksheet | undefined {
  return wb.worksheets.find((ws) => ws.name.trim().toLowerCase() === name.toLowerCase());
}

/** Reads the data rows of a sheet by header name; blank rows are skipped. */
export function readSheet(ws: Worksheet, sheetName: string, columns: ImportColumn[], fileProblems: string[]): SheetRow[] {
  const headerRow = ws.getRow(1);
  const indexByHeader = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    indexByHeader.set(normalizeHeader(cellText(cell.value)), col);
  });

  const indexByKey = new Map<string, number>();
  for (const column of columns) {
    const idx = indexByHeader.get(normalizeHeader(column.header));
    if (idx === undefined) {
      if (column.required) {
        fileProblems.push(`Sheet "${sheetName}" is missing the column "${column.header}". Download the template again.`);
      }
      continue;
    }
    indexByKey.set(column.key, idx);
  }

  const rows: SheetRow[] = [];
  for (let r = 2; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    const cells: Cells = {};
    let any = false;
    for (const [key, idx] of indexByKey) {
      const value = row.getCell(idx).value;
      cells[key] = value;
      if (!isEmpty(value)) any = true;
    }
    if (any) rows.push({ row: r, cells });
  }
  return rows;
}

/** Opens an uploaded .xlsx; returns the workbook or a user-facing problem. */
export async function openWorkbook(file: File): Promise<{ workbook: import("exceljs").Workbook } | { problem: string }> {
  if (!/\.xlsx$/i.test(file.name)) return { problem: "Upload an Excel .xlsx file (use the template)." };
  if (file.size > MAX_FILE_BYTES) return { problem: `The file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.` };

  const { default: excelJs } = await import("exceljs");
  const workbook = new excelJs.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return { problem: "This file could not be read as an Excel workbook." };
  }
  return { workbook };
}

// ─── Typed readers (each returns the value and records problems) ─────────────

/** Reads and validates the cells of one row; every problem becomes an issue naming sheet, row and column. */
export class RowReader {
  constructor(
    private readonly sheet: string,
    private readonly columns: ImportColumn[],
    private readonly row: number,
    private readonly cells: Cells,
    readonly issues: ImportIssue[],
  ) {}

  private col(key: string): ImportColumn {
    return this.columns.find((c) => c.key === key)!;
  }

  fail(key: string, message: string) {
    this.issues.push({ sheet: this.sheet, row: this.row, field: this.col(key).header, message });
  }

  private raw(key: string): CellValue | undefined {
    return this.cells[key];
  }

  /** Trimmed text of a cell, for callers that need the raw value before validating it. */
  peek(key: string): string {
    return cellText(this.raw(key));
  }

  text(key: string, max?: number): string | undefined {
    const column = this.col(key);
    const value = cellText(this.raw(key));
    if (!value) {
      if (column.required) this.fail(key, "Required");
      return undefined;
    }
    if (max && value.length > max) {
      this.fail(key, `At most ${max} characters (this has ${value.length})`);
      return undefined;
    }
    return value;
  }

  /**
   * Matches an option by stored value or label, ignoring case; returns the stored value.
   * `normalize` (default: lower-case) is applied to the cell and to every option before comparing.
   */
  option(key: string, options: LookupOption[], normalize: (text: string) => string = (t) => t.toLowerCase()): string | undefined {
    const column = this.col(key);
    const value = cellText(this.raw(key));
    if (!value) {
      if (column.required) this.fail(key, "Required");
      return undefined;
    }
    const wanted = normalize(value);
    const match = options.find((o) => normalize(o.value) === wanted || normalize(o.label) === wanted);
    if (!match) {
      this.fail(key, `"${value}" is not an allowed value. Allowed: ${options.map((o) => o.label).join(", ") || "none available"}`);
      return undefined;
    }
    return match.value;
  }

  int(key: string, { min, max }: { min: number; max?: number }): number | undefined {
    const column = this.col(key);
    const raw = this.raw(key);
    const value = cellText(raw);
    if (!value) {
      if (column.required) this.fail(key, "Required");
      return undefined;
    }
    const n = typeof raw === "number" ? raw : Number(value.replace(/,/g, ""));
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      this.fail(key, `"${value}" is not a whole number`);
      return undefined;
    }
    if (n < min || (max !== undefined && n > max)) {
      this.fail(key, max !== undefined ? `Must be between ${min} and ${max}` : `Must be at least ${min}`);
      return undefined;
    }
    return n;
  }

  decimal(
    key: string,
    { min, max, exclusiveMin, digits = true }: { min?: number; max?: number; exclusiveMin?: number; digits?: boolean },
  ): number | undefined {
    const column = this.col(key);
    const raw = this.raw(key);
    const value = cellText(raw);
    if (!value) {
      if (column.required) this.fail(key, "Required");
      return undefined;
    }
    const n = typeof raw === "number" ? raw : Number(value.replace(/,/g, ""));
    if (!Number.isFinite(n)) {
      this.fail(key, `"${value}" is not a number`);
      return undefined;
    }
    if (exclusiveMin !== undefined && n <= exclusiveMin) {
      this.fail(key, `Must be greater than ${exclusiveMin}`);
      return undefined;
    }
    if (min !== undefined && max !== undefined && (n < min || n > max)) {
      this.fail(key, `Must be between ${min} and ${max}`);
      return undefined;
    }
    if (min !== undefined && max === undefined && n < min) {
      this.fail(key, `Must be ${min} or more`);
      return undefined;
    }
    if (digits && (Math.abs(n) >= 1e12 || Math.round(n * 100) / 100 !== n)) {
      this.fail(key, "At most 12 digits before and 2 after the decimal point");
      return undefined;
    }
    return n;
  }

  /** ISO yyyy-mm-dd from an Excel date or a yyyy-mm-dd text cell. */
  date(key: string): string | undefined {
    const raw = this.raw(key);
    if (isEmpty(raw)) {
      if (this.col(key).required) this.fail(key, "Required");
      return undefined;
    }
    if (raw instanceof Date) {
      if (Number.isNaN(raw.getTime())) {
        this.fail(key, "Not a valid date");
        return undefined;
      }
      return raw.toISOString().slice(0, 10);
    }
    const value = cellText(raw);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) {
      const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
      if (d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])) {
        return value;
      }
    }
    this.fail(key, `"${value}" is not a valid date. Use yyyy-mm-dd, e.g. 2026-01-31`);
    return undefined;
  }
}
