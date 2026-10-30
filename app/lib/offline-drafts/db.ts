import Dexie, { type EntityTable } from "dexie";

import type { CreateFlagshipKpiRequest, CreateFlagshipRequest } from "~/lib/queries/flagships";
import type { CreateIndividualRequest } from "~/lib/queries/individuals";
import type { CooperativeRequest } from "~/lib/queries/cooperatives";

export type DraftStatus = "pending" | "error";

interface DraftBase {
  id?: number;
  status: DraftStatus;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndividualDraft extends DraftBase {
  entityType: "individual";
  payload: CreateIndividualRequest;
}

export interface FlagshipDraft extends DraftBase {
  entityType: "flagship";
  payload: CreateFlagshipRequest;
  /** Queued KPI rows from the form's own in-memory state, replayed after the flagship is created. */
  pendingKpis: (CreateFlagshipKpiRequest & { displayLabel: string })[];
  /**
   * Set once the flagship itself was created server-side but one or more KPIs failed.
   * When present, a retry must only replay the remaining `pendingKpis`, never re-POST the flagship.
   */
  createdEntityId?: number;
}

export interface CooperativeDraft extends DraftBase {
  entityType: "cooperative";
  payload: CooperativeRequest;
}

export type DraftRecord = IndividualDraft | FlagshipDraft | CooperativeDraft;

class OfflineDraftsDB extends Dexie {
  drafts!: EntityTable<DraftRecord, "id">;

  constructor() {
    super("flagship-tracker-offline-drafts");
    this.version(1).stores({
      // Compound index on [entityType+status] powers the review-screen list and the sidebar count.
      drafts: "++id, entityType, status, [entityType+status], createdAt",
    });
  }
}

export const db = new OfflineDraftsDB();
