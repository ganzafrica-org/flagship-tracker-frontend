import { api } from "~/lib/api";
import type { ServerImportResponse } from "~/lib/import/types";
import type { ImportRequestItem, ImportServerResponse } from "./types";

/** dryRun validates against the database and rolls back; nothing is saved. */
export async function importFlagships(flagships: ImportRequestItem[], dryRun: boolean): Promise<ServerImportResponse> {
  const response = await api.post<ImportServerResponse>(`/api/flagships/import?dryRun=${dryRun}`, { flagships });
  return {
    results: response.results.map((r) => ({
      row: r.row,
      title: r.flagshipCode ? `${r.flagshipCode} — ${r.flagshipName ?? ""}` : r.flagshipName,
      outcome: r.outcome,
      errors: r.errors,
    })),
  };
}
