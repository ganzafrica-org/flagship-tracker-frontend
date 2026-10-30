/** A problem in the file or reported by the server, pinned to a sheet, row and field. */
export interface ImportIssue {
  /** Sheet name as shown to the user. */
  sheet: string;
  /** 1-based Excel row. */
  row: number;
  /** Column header (without the required marker), or "" for a whole-row problem. */
  field: string;
  message: string;
}

/** One row (or one flagship = a group of rows) read from the workbook. */
export interface ParsedEntity<TPayload> {
  /** Row the entity starts on, used as its identity in the preview. */
  row: number;
  title: string;
  subtitle: string;
  /** What is sent to the server; null while the file has errors for this entity. */
  payload: TPayload | null;
  /** Problems found reading the file. */
  errors: ImportIssue[];
  /** Notes that do not block the row (it can still be imported). */
  warnings?: ImportIssue[];
}

export interface ParsedWorkbook<TPayload> {
  entities: ParsedEntity<TPayload>[];
  /** Rows that belong to no entity (e.g. a child row whose code matches nothing). */
  orphanIssues: ImportIssue[];
  /** File-level problems (missing sheet / column). Import is blocked while any exist. */
  fileProblems: string[];
}

export interface ServerImportError {
  sheet: string;
  row: number;
  field: string | null;
  message: string;
}

/** Per-entity result of POST …/import, normalised from each endpoint's response. */
export interface ServerImportResult {
  row: number;
  title: string | null;
  outcome: "VALID" | "CREATED" | "FAILED";
  errors: ServerImportError[];
  warnings?: ServerImportError[];
}

export interface ServerImportResponse {
  results: ServerImportResult[];
}
