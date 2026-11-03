import type { LookupOption } from "~/lib/import/schema";
import type { CooperativeRequest, CooperativeSummary } from "~/lib/queries/cooperatives";

/** One row to create with POST /api/cooperatives (the same body the Add form sends). */
export interface CooperativeImportItem {
  row: number;
  cooperative: CooperativeRequest;
}

/** The option lists the Add Cooperative form offers, plus the records that already exist. */
export interface CooperativeImportLookups {
  groupTypes: LookupOption[];
  registrationStatuses: LookupOption[];
  /** value = flagship id, label = "CODE — Name" (as the form's Flagship select shows it). */
  flagships: LookupOption[];
  engagementTypes: LookupOption[];
  /**
   * Every existing cooperative (all group types), to recognise rows that are already saved.
   * null when it could not be loaded (offline with nothing cached): rows are then warned, and
   * re-checked when their draft is submitted.
   */
  existing: CooperativeSummary[] | null;
  /** Cooperative drafts already stored on this device, so the same sheet uploaded twice offline is not drafted twice. */
  drafts?: CooperativeRequest[];
}
