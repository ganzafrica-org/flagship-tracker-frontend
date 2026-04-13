import type { DataManagementRow } from "~/data/dummy-data";

const STORAGE_KEY = "me-data-management-added";
const EDITED_STORAGE_KEY = "me-data-management-edited";

export function getAddedDataManagementRows(): DataManagementRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as DataManagementRow[];
  } catch {
    return [];
  }
}

export function prependDataManagementRow(row: DataManagementRow): void {
  const existing = getAddedDataManagementRows();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([row, ...existing]));
}

function getEditedDataManagementRows(): Record<string, DataManagementRow> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(EDITED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, DataManagementRow>;
  } catch {
    return {};
  }
}

function setEditedDataManagementRows(next: Record<string, DataManagementRow>): void {
  sessionStorage.setItem(EDITED_STORAGE_KEY, JSON.stringify(next));
}

export function mergeDataManagementRows(baseRows: DataManagementRow[]): DataManagementRow[] {
  const added = getAddedDataManagementRows();
  const edited = getEditedDataManagementRows();

  const applyEdit = (row: DataManagementRow): DataManagementRow => {
    const edit = edited[String(row.id)];
    return edit ? edit : row;
  };

  return [...added.map(applyEdit), ...baseRows.map(applyEdit)];
}

export function getDataManagementRowById(id: number, baseRows: DataManagementRow[]): DataManagementRow | null {
  if (!Number.isFinite(id)) return null;
  const rows = mergeDataManagementRows(baseRows);
  return rows.find((row) => Number(row.id) === id) ?? null;
}

export function upsertDataManagementRow(row: DataManagementRow): void {
  const existingAdded = getAddedDataManagementRows();
  const indexInAdded = existingAdded.findIndex((item) => Number(item.id) === Number(row.id));
  if (indexInAdded >= 0) {
    const nextAdded = [...existingAdded];
    nextAdded[indexInAdded] = row;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextAdded));
    return;
  }

  const edited = getEditedDataManagementRows();
  edited[String(row.id)] = row;
  setEditedDataManagementRows(edited);
}

export function nextDataManagementRowId(baseRows: Pick<DataManagementRow, "id">[]): number {
  const added = getAddedDataManagementRows();
  const ids = [...baseRows, ...added].map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}
