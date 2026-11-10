import { headerLabel, TEMPLATE_ROWS, type ImportColumn } from "./schema";

const LISTS_SHEET = "Lists";
const REQUIRED_FILL = "FFFDE68A";
const OPTIONAL_FILL = "FFE5E7EB";

/** A value to pre-fill in a template cell; null, undefined and "" leave the cell blank. */
export type TemplateValue = string | number | boolean | Date | null | undefined;

export interface TemplateSheet {
  name: string;
  columns: ImportColumn[];
  /** Existing records to pre-fill below the header, keyed by `ImportColumn.key`. */
  rows?: Record<string, TemplateValue>[];
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Converts a value to what the import parser (RowReader) reads back unchanged: dates become real
 * Excel dates at UTC midnight (read back as yyyy-mm-dd), numbers stay numeric, and text stays a
 * string so IDs and phone numbers keep leading zeros and full precision.
 */
function toCellValue(column: ImportColumn, value: TemplateValue): string | number | Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  switch (column.type) {
    case "date": {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
      }
      const m = ISO_DATE.exec(String(value).trim());
      return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : String(value).trim();
    }
    case "int":
    case "decimal": {
      const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
      return Number.isFinite(n) ? n : String(value).trim();
    }
    default:
      return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).trim();
  }
}

/** One column of the Lists sheet. A `key` makes it the dropdown source for columns with that `list`. */
export interface ListColumn {
  title: string;
  values: string[];
  key?: string;
}

function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function dataValidation(column: ImportColumn, listRange: string | null) {
  switch (column.type) {
    case "list":
      return listRange
        ? {
            type: "list" as const,
            allowBlank: !column.required,
            formulae: [listRange],
            showErrorMessage: true,
            errorStyle: "stop" as const,
            errorTitle: "Not an allowed value",
            error: "Pick a value from the list (see the Lists sheet).",
          }
        : undefined;
    case "int": {
      const min = column.min ?? 1;
      return {
        type: "whole" as const,
        operator: column.max !== undefined ? ("between" as const) : ("greaterThanOrEqual" as const),
        allowBlank: !column.required,
        formulae: column.max !== undefined ? [min, column.max] : [min],
        showErrorMessage: true,
        errorTitle: "Whole number required",
        error: column.max !== undefined ? `Enter a whole number, ${min}–${column.max}.` : `Enter a whole number, minimum ${min}.`,
      };
    }
    case "decimal": {
      const min = column.min ?? 0;
      return {
        type: "decimal" as const,
        operator: column.max !== undefined ? ("between" as const) : ("greaterThanOrEqual" as const),
        allowBlank: !column.required,
        formulae: column.max !== undefined ? [min, column.max] : [min],
        showErrorMessage: true,
        errorTitle: "Number required",
        error: column.max !== undefined ? `Enter a number from ${min} to ${column.max}.` : `Enter a number, ${min} or more.`,
      };
    }
    case "date":
      return {
        type: "date" as const,
        operator: "greaterThan" as const,
        allowBlank: true,
        formulae: [new Date(Date.UTC(1899, 11, 31))],
        showErrorMessage: true,
        errorTitle: "Date required",
        error: "Enter a date, e.g. 2026-01-31.",
      };
    default:
      return undefined;
  }
}

/**
 * Builds an import template: one sheet per entry in `sheets` (required columns marked with "*",
 * header notes, dropdowns and number/date validation) plus a Lists sheet with every allowed value.
 */
export async function buildTemplateWorkbook(sheets: TemplateSheet[], lists: ListColumn[]): Promise<Blob> {
  const { default: excelJs } = await import("exceljs");
  const wb = new excelJs.Workbook();
  wb.creator = "Flagship Tracker";

  const listRange = (key: string | undefined): string | null => {
    if (key === undefined) return null;
    const idx = lists.findIndex((l) => l.key === key);
    if (idx === -1) return null;
    const count = lists[idx].values.length;
    if (count === 0) return null;
    return `${LISTS_SHEET}!$${columnLetter(idx)}$2:$${columnLetter(idx)}$${count + 1}`;
  };

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = sheet.columns.map((c) => ({ key: c.key, width: c.width }));

    const rows = sheet.rows ?? [];
    // Validation and formats cover every pre-filled row plus the usual blank rows for new entries.
    const lastRow = Math.max(TEMPLATE_ROWS, rows.length) + 1;

    const header = ws.getRow(1);
    header.height = 22;
    sheet.columns.forEach((column, i) => {
      const cell = header.getCell(i + 1);
      cell.value = headerLabel(column);
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: column.required ? REQUIRED_FILL : OPTIONAL_FILL } };
      const notes = [column.required ? "Required." : "Optional.", column.hint];
      if (column.type === "list" && column.list) notes.push("Choose from the dropdown (values are on the Lists sheet).");
      cell.note = notes.filter(Boolean).join(" ");

      const validation = dataValidation(column, listRange(column.list));
      for (let r = 2; r <= lastRow; r += 1) {
        const body = ws.getCell(r, i + 1);
        if (column.type === "date") body.numFmt = "yyyy-mm-dd";
        if (column.type === "text") body.numFmt = "@";
        if (validation) body.dataValidation = validation;
        const record = rows[r - 2];
        if (record) {
          const value = toCellValue(column, record[column.key]);
          if (value !== null) body.value = value;
        }
      }
    });
  }

  const listsSheet = wb.addWorksheet(LISTS_SHEET);
  lists.forEach((column, i) => {
    const header = listsSheet.getCell(1, i + 1);
    header.value = column.title;
    header.font = { bold: true };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: OPTIONAL_FILL } };
    listsSheet.getColumn(i + 1).width = Math.max(18, column.title.length + 2);
    column.values.forEach((value, r) => {
      listsSheet.getCell(r + 2, i + 1).value = value;
    });
  });
  listsSheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
