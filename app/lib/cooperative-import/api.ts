import { api, ApiError } from "~/lib/api";
import { formatApiErrorMessage } from "~/lib/api-errors";
import type { ServerImportResponse, ServerImportResult } from "~/lib/import/types";
import { mapWithConcurrency } from "~/lib/individual-details";
import { isNetworkError } from "~/lib/offline-drafts/network";
import { createCooperativeDraft } from "~/lib/offline-drafts/repository";
import type { CooperativeDetail } from "~/lib/queries/cooperatives";
import type { CooperativeImportItem } from "./types";

/**
 * There is no bulk endpoint for cooperatives, so this adapts the single-record create to the shared
 * import dialog. The dry run has nothing to ask the server: every row it receives already passed the
 * form's and the API's rules in the parser, so each is VALID. The real run creates the rows with
 * POST /api/cooperatives (the Add form's request), a few at a time, and reports each one; a row the
 * server refuses is FAILED with its message and the others are still saved.
 *
 * Offline: a row whose request cannot reach the server (no connection, or it drops part-way) is
 * kept as an offline draft, exactly like the Add form does, and reported as DRAFT. It then shows on
 * the page's Draft tab to submit later; being a "sheet" draft, it is checked against the existing
 * records first, so it is never created twice.
 */
export function cooperativeImportSender(sheet: string) {
  return async function send(items: CooperativeImportItem[], dryRun: boolean): Promise<ServerImportResponse> {
    if (dryRun) {
      return { results: items.map((i) => ({ row: i.row, title: i.cooperative.cooperativeName, outcome: "VALID", errors: [] })) };
    }
    const results = await mapWithConcurrency(items, 4, async (item): Promise<ServerImportResult> => {
      try {
        await api.post<CooperativeDetail>("/api/cooperatives", item.cooperative);
        return { row: item.row, title: item.cooperative.cooperativeName, outcome: "CREATED", errors: [] };
      } catch (e) {
        if (isNetworkError(e)) {
          try {
            await createCooperativeDraft(item.cooperative, "sheet");
            return { row: item.row, title: item.cooperative.cooperativeName, outcome: "DRAFT", errors: [] };
          } catch {
            // Could not store it locally either (e.g. private browsing): report it as not saved.
          }
        }
        const message =
          e instanceof ApiError
            ? formatApiErrorMessage(e.message)
            : isNetworkError(e)
              ? "No connection, and it could not be saved as a draft on this device; this row was not saved"
              : e instanceof Error
                ? e.message
                : "Not saved";
        return { row: item.row, title: item.cooperative.cooperativeName, outcome: "FAILED", errors: [{ sheet, row: item.row, field: null, message }] };
      }
    });
    return { results };
  };
}
