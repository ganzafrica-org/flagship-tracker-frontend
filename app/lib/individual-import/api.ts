import { api } from "~/lib/api";
import type { ServerImportResponse } from "~/lib/import/types";
import type { IndividualImportItem, IndividualImportServerResponse } from "./types";

/** dryRun runs the real save path (same validation as the form, plus duplicate checks) and rolls back. */
export async function importIndividuals(individuals: IndividualImportItem[], dryRun: boolean): Promise<ServerImportResponse> {
  const response = await api.post<IndividualImportServerResponse>(`/api/individuals/import?dryRun=${dryRun}`, { individuals });
  return {
    results: response.results.map((r) => ({ row: r.row, title: r.name, outcome: r.outcome, errors: r.errors, warnings: r.warnings })),
  };
}
