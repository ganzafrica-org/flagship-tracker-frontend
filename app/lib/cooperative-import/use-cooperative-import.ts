import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { LookupOption } from "~/lib/import/schema";
import { mapWithConcurrency } from "~/lib/individual-details";
import {
  cooperativeQueryOptions,
  cooperativesListQueryOptions,
  ENGAGEMENT_TYPE_OPTIONS,
  flagshipOptionsQueryOptions,
  type CooperativeDetail,
  type CooperativeRequest,
  type CooperativeSummary,
} from "~/lib/queries/cooperatives";
import { enumValuesQueryOptions, type EnumValue } from "~/lib/queries/lookups";
import { listDrafts } from "~/lib/offline-drafts/repository";
import { cooperativeImportSender } from "./api";
import { parseCooperativeFile } from "./parse";
import { cooperativeSheetName, cooperativeTemplateFilename, GROUP_TYPE_FALLBACK, REGISTRATION_STATUS_FALLBACK } from "./schema";
import { buildCooperativeImportTemplate } from "./template";
import type { CooperativeImportLookups } from "./types";
import { isNetworkError } from "~/lib/offline-drafts/network";

function summaryAsDetail(c: CooperativeSummary): CooperativeDetail {
  return {
    cooperativeId: c.cooperativeId,
    cooperativeName: c.cooperativeName,
    cooperativeCode: c.cooperativeCode ?? undefined,
    groupType: c.groupType,
    registrationStatus: c.registrationStatus ?? undefined,
    primaryValueChain: c.primaryValueChain ?? undefined,
    totalMembers: c.totalMembers ?? undefined,
    femaleMembers: c.femaleMembers ?? undefined,
    youthMembers: c.youthMembers ?? undefined,
    province: c.province ?? undefined,
    district: c.district ?? undefined,
    sector: c.sector ?? undefined,
  };
}

function fromEnum(items: EnumValue[] | undefined, fallback: LookupOption[]): LookupOption[] {
  return items && items.length > 0 ? items.map((i) => ({ value: i.value, label: i.label })) : fallback;
}

/**
 * Everything one group-type page needs for its template and upload: the Add Cooperative form's own
 * option lists, a template pre-filled with the page's current records, the parser and the sender.
 * `loadRecords` returns the records of the page's current query (with its filters) when the template is built.
 */
export function useCooperativeImport(type: string, loadRecords: () => Promise<CooperativeSummary[]>, enabled = true) {
  const queryClient = useQueryClient();
  // offlineFirst: offline, the request is still made once, so the service worker's cached lookups can
  // answer it (the default "online" mode would pause it and the upload would wait for a connection).
  const groupTypes = useQuery({ ...enumValuesQueryOptions("group_type"), enabled, networkMode: "offlineFirst" });
  const statuses = useQuery({ ...enumValuesQueryOptions("registration_status"), enabled, networkMode: "offlineFirst" });
  const flagships = useQuery({ ...flagshipOptionsQueryOptions(), enabled, networkMode: "offlineFirst" });
  const queries = [groupTypes, statuses, flagships];

  // Like the form, a failed lookup falls back (group types / statuses to the API's allowed values, flagships to none).
  // Only a request in flight holds it up; a paused (offline) or failed one uses what is cached or the fallback.
  const lookups: Omit<CooperativeImportLookups, "existing"> | null =
    !enabled || queries.some((q) => q.isPending && q.fetchStatus === "fetching")
      ? null
      : {
          groupTypes: fromEnum(groupTypes.data, GROUP_TYPE_FALLBACK),
          registrationStatuses: fromEnum(statuses.data, REGISTRATION_STATUS_FALLBACK),
          flagships: (flagships.data ?? []).map((f) => ({ value: f.value, label: f.label })),
          engagementTypes: ENGAGEMENT_TYPE_OPTIONS,
        };

  const sheet = cooperativeSheetName(type);

  return {
    ready: lookups !== null,
    isLoading: queries.some((q) => q.isPending && q.fetchStatus === "fetching"),
    isError: false,
    templateFilename: cooperativeTemplateFilename(type),
    /** The list lacks Cluster and the flagship link, so each record's detail is fetched, as the Export does. */
    async buildTemplate(): Promise<Blob> {
      if (!lookups) throw new Error("The form options are still loading");
      const records = await loadRecords();
      // Offline, a record whose detail is not cached is written from the list's own fields (it lacks
      // Cluster and the flagship link, but still re-imports as an existing record).
      const details = await mapWithConcurrency(records, 10, async (c) => {
        try {
          return await queryClient.fetchQuery({ ...cooperativeQueryOptions(c.cooperativeId), networkMode: "always", retry: false });
        } catch (e) {
          const cached = queryClient.getQueryData(cooperativeQueryOptions(c.cooperativeId).queryKey);
          if (cached) return cached;
          if (!isNetworkError(e)) throw e;
          return summaryAsDetail(c);
        }
      });
      return buildCooperativeImportTemplate(type, { ...lookups, existing: [] }, details);
    },
    /** Reads against a fresh copy of every existing record so already-saved rows are recognised. */
    async parse(file: File) {
      if (!lookups) throw new Error("The form options are still loading");
      let existing: CooperativeSummary[] | null;
      try {
        existing = await queryClient.fetchQuery({ ...cooperativesListQueryOptions, staleTime: 0, networkMode: "always", retry: false });
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        // Offline: what this session already loaded, if anything (null → each row is warned and re-checked on submit).
        existing = queryClient.getQueryData(cooperativesListQueryOptions.queryKey) ?? null;
      }
      const drafts = (await listDrafts().catch(() => []))
        .filter((d) => d.entityType === "cooperative")
        .map((d) => d.payload as CooperativeRequest);
      return parseCooperativeFile(file, type, { ...lookups, existing, drafts });
    },
    send: cooperativeImportSender(sheet),
    sheet,
  };
}

export type CooperativeImporter = ReturnType<typeof useCooperativeImport>;
