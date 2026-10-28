import type { CreateIndividualRequest } from "~/lib/queries/individuals";

/** Request item for POST /api/individuals/import. */
export interface IndividualImportItem {
  row: number;
  /** Includes the required youthStatus ('youth' | 'non_youth'). */
  individual: CreateIndividualRequest;
}

/** Raw response of POST /api/individuals/import. */
export interface IndividualImportServerResponse {
  dryRun: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: {
    row: number;
    name: string | null;
    outcome: "VALID" | "CREATED" | "FAILED";
    individualId: number | null;
    errors: { sheet: string; row: number; field: string | null; message: string }[];
    warnings?: { sheet: string; row: number; field: string | null; message: string }[];
  }[];
}
