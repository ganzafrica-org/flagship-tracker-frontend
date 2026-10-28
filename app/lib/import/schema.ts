/**
 * Shared description of an import workbook column. Each import (flagships, individuals…) declares
 * its sheets as `ImportColumn[]`; the template is generated from them and the uploaded file is
 * parsed against them, so the two can never drift apart. `key` is the request field the server
 * reports errors against.
 */

export type ColumnType = "text" | "int" | "decimal" | "date" | "list";

export interface ImportColumn {
  key: string;
  header: string;
  required: boolean;
  type: ColumnType;
  /** Key of the allowed-value list (see `ListColumn.key`) that feeds this column's dropdown. */
  list?: string;
  width: number;
  /** Shown as a note on the header cell. */
  hint?: string;
  /** Bounds for the template's number validation (int default min 1, decimal default min 0). */
  min?: number;
  max?: number;
}

/** Rows (below the header) that get dropdowns / validation in the template. */
export const TEMPLATE_ROWS = 500;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function headerLabel(column: ImportColumn): string {
  return column.required ? `${column.header} *` : column.header;
}

/** Human label for a request field in a column set (falls back to the key). */
export function fieldLabel(columns: ImportColumn[], key: string | null | undefined): string {
  if (!key) return "";
  return columns.find((c) => c.key === key)?.header ?? key;
}

/** A value that can be picked in a dropdown: what the API stores and what the form shows. */
export interface LookupOption {
  value: string;
  label: string;
}
