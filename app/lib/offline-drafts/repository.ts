import { db, type CooperativeDraft, type DraftRecord, type FlagshipDraft, type IndividualDraft } from "./db";
import type { CreateFlagshipKpiRequest, CreateFlagshipRequest } from "~/lib/queries/flagships";
import type { CreateIndividualRequest } from "~/lib/queries/individuals";
import type { CooperativeRequest } from "~/lib/queries/cooperatives";

/** Creates a new individual draft and returns its local id. */
export async function createIndividualDraft(payload: CreateIndividualRequest): Promise<number> {
  const now = new Date().toISOString();
  const draft: IndividualDraft = { entityType: "individual", status: "pending", payload, createdAt: now, updatedAt: now };
  return db.drafts.add(draft as DraftRecord) as unknown as Promise<number>;
}

/** Creates a new flagship draft (with its queued KPI rows) and returns its local id. */
export async function createFlagshipDraft(
  payload: CreateFlagshipRequest,
  pendingKpis: (CreateFlagshipKpiRequest & { displayLabel: string })[],
): Promise<number> {
  const now = new Date().toISOString();
  const draft: FlagshipDraft = { entityType: "flagship", status: "pending", payload, pendingKpis, createdAt: now, updatedAt: now };
  return db.drafts.add(draft as DraftRecord) as unknown as Promise<number>;
}

/** Creates a new cooperative/association/company/farmer-group draft and returns its local id. */
export async function createCooperativeDraft(payload: CooperativeRequest): Promise<number> {
  const now = new Date().toISOString();
  const draft: CooperativeDraft = { entityType: "cooperative", status: "pending", payload, createdAt: now, updatedAt: now };
  return db.drafts.add(draft as DraftRecord) as unknown as Promise<number>;
}

export async function getDraft(id: number): Promise<DraftRecord | undefined> {
  return db.drafts.get(id);
}

export async function listDrafts(): Promise<DraftRecord[]> {
  const all = await db.drafts.toArray();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateDraft(id: number, patch: Partial<DraftRecord>): Promise<void> {
  await db.drafts.update(id, { ...patch, updatedAt: new Date().toISOString() } as Partial<DraftRecord>);
}

export async function deleteDraft(id: number): Promise<void> {
  await db.drafts.delete(id);
}

export async function countDrafts(): Promise<number> {
  return db.drafts.count();
}
