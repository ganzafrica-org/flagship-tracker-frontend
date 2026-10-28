import type { QueryClient } from "@tanstack/react-query";

import { api } from "~/lib/api";
import { createIndividual, individualsQueryOptions } from "~/lib/queries/individuals";
import { createFlagship, createFlagshipKpi, flagshipsQueryOptions } from "~/lib/queries/flagships";
import type { CooperativeDetail } from "~/lib/queries/cooperatives";
import type { CooperativeDraft, FlagshipDraft, IndividualDraft } from "./db";
import { deleteDraft, updateDraft } from "./repository";

/**
 * Replays a stored cooperative/association/company/farmer-group draft, including its optional
 * flagship link (the backend links it in the same create transaction). Deletes the draft on success.
 */
export async function replayCooperativeDraft(draft: CooperativeDraft, queryClient: QueryClient): Promise<void> {
  await api.post<CooperativeDetail>("/api/cooperatives", draft.payload);
  void queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
  void queryClient.invalidateQueries({ queryKey: ["viz", "cooperatives"] });
  await deleteDraft(draft.id!);
}

/** Replays a stored individual draft against the real API. Deletes the draft on success. */
export async function replayIndividualDraft(draft: IndividualDraft, queryClient: QueryClient): Promise<void> {
  await createIndividual(draft.payload);
  void queryClient.invalidateQueries({ queryKey: individualsQueryOptions.queryKey });
  await deleteDraft(draft.id!);
}

/**
 * Replays a stored flagship draft (and its queued KPIs) against the real API.
 * If the flagship was already created on a previous attempt (`createdEntityId` set), only the
 * remaining KPIs are retried — never re-creates the flagship itself, which would duplicate it.
 */
export async function replayFlagshipDraft(draft: FlagshipDraft, queryClient: QueryClient): Promise<void> {
  let flagshipId = draft.createdEntityId;

  if (!flagshipId) {
    const saved = await createFlagship(draft.payload);
    flagshipId = saved.flagshipId;
    // Record immediately so a failure partway through the KPI loop below can't cause a retry to
    // re-POST the flagship and create a duplicate.
    await updateDraft(draft.id!, { createdEntityId: flagshipId });
  }

  const toProcess = [...draft.pendingKpis];
  while (toProcess.length > 0) {
    const kpi = toProcess[0];
    const { displayLabel: _displayLabel, ...kpiBody } = kpi;
    await createFlagshipKpi(flagshipId, kpiBody);
    toProcess.shift();
    await updateDraft(draft.id!, { pendingKpis: toProcess });
  }

  void queryClient.invalidateQueries({ queryKey: flagshipsQueryOptions.queryKey });
  void queryClient.invalidateQueries({ queryKey: ["flagships", flagshipId] });
  void queryClient.invalidateQueries({ queryKey: ["flagships", flagshipId, "detail"] });
  await deleteDraft(draft.id!);
}
