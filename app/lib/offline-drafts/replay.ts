import type { QueryClient } from "@tanstack/react-query";

import { api } from "~/lib/api";
import { createIndividual, individualsQueryOptions } from "~/lib/queries/individuals";
import {
  createFlagship,
  createFlagshipInvestment,
  createFlagshipKpi,
  createFlagshipLocation,
  ensureFlagshipKpiDefinition,
  flagshipsQueryOptions,
} from "~/lib/queries/flagships";
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

  const kpis = [...draft.pendingKpis];
  while (kpis.length > 0) {
    const kpi = kpis[0];
    const { displayLabel: _displayLabel, ...kpiBody } = kpi;
    await ensureFlagshipKpiDefinition(draft.payload.flagshipCode, {
      indicatorName: kpiBody.indicatorName,
      indicatorTier: kpiBody.indicatorTier,
      indicatorValueType: kpiBody.indicatorValueType,
    });
    await createFlagshipKpi(flagshipId, kpiBody);
    kpis.shift();
    await updateDraft(draft.id!, { pendingKpis: kpis });
  }

  const investments = [...(draft.pendingInvestments ?? [])];
  while (investments.length > 0) {
    const investment = investments[0];
    const { displayLabel: _displayLabel, ...investmentBody } = investment;
    await createFlagshipInvestment(flagshipId, investmentBody);
    investments.shift();
    await updateDraft(draft.id!, { pendingInvestments: investments });
  }

  const locations = [...(draft.pendingLocations ?? [])];
  while (locations.length > 0) {
    const location = locations[0];
    const { displayLabel: _displayLabel, ...locationBody } = location;
    await createFlagshipLocation(flagshipId, locationBody);
    locations.shift();
    await updateDraft(draft.id!, { pendingLocations: locations });
  }

  void queryClient.invalidateQueries({ queryKey: flagshipsQueryOptions.queryKey });
  void queryClient.invalidateQueries({ queryKey: ["flagships", flagshipId] });
  void queryClient.invalidateQueries({ queryKey: ["flagships", flagshipId, "detail"] });
  await deleteDraft(draft.id!);
}
