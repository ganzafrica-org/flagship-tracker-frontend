import type { QueryClient } from "@tanstack/react-query";

import type { ExportColumn } from "~/lib/export/table-export";
import {
  cooperativeQueryOptions,
  flagshipOptionsQueryOptions,
  ENGAGEMENT_TYPE_OPTIONS,
  maleMembers,
  type CooperativeDetail,
  type CooperativeSummary,
} from "~/lib/queries/cooperatives";
import { enumValuesQueryOptions, type EnumValue } from "~/lib/queries/lookups";

type Row = Record<string, unknown>;
type Option = { value: string; label: string };

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "" : v);
const showDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
const labelFor = (options: Option[], value: string | null | undefined) =>
  value ? (options.find((o) => o.value === value)?.label ?? value) : "";

export const COOPERATIVE_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "Name", label: "Name" },
  { key: "Code", label: "Code" },
  { key: "Group type", label: "Group type" },
  { key: "Registration status", label: "Registration status" },
  { key: "Primary value chain", label: "Primary value chain" },
  { key: "Cluster", label: "Cluster" },
  { key: "Total members", label: "Total members" },
  { key: "Female members", label: "Female members" },
  { key: "Male members", label: "Male members" },
  { key: "Youth members", label: "Youth members" },
  { key: "Province", label: "Province" },
  { key: "District", label: "District" },
  { key: "Sector", label: "Sector" },
  { key: "Flagship engagement", label: "Flagship engagement" },
];

/** Runs `fn` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Same fields as useCooperativeRecord's "Basic information"/"Members"/"Location"/"Flagship engagement" sections, flattened into one row. */
function flattenCooperative(
  c: CooperativeDetail,
  groupTypes: EnumValue[],
  statuses: EnumValue[],
  flagshipNames: Map<number, string>,
): Row {
  const engagement = (c.flagships ?? [])
    .map((f) =>
      [
        flagshipNames.get(f.flagshipId) ?? `Flagship #${f.flagshipId}`,
        labelFor(ENGAGEMENT_TYPE_OPTIONS, f.engagementType),
        showDate(f.startDate),
        showDate(f.endDate),
      ]
        .filter(Boolean)
        .join(" · "),
    )
    .join("; ");

  return {
    "Name": show(c.cooperativeName),
    "Code": show(c.cooperativeCode),
    "Group type": labelFor(groupTypes, c.groupType),
    "Registration status": labelFor(statuses, c.registrationStatus),
    "Primary value chain": show(c.primaryValueChain),
    "Cluster": show(c.cluster),
    "Total members": show(c.totalMembers),
    "Female members": show(c.femaleMembers),
    "Male members": c.totalMembers != null ? maleMembers(c.totalMembers, c.femaleMembers) : "",
    "Youth members": show(c.youthMembers),
    "Province": show(c.province),
    "District": show(c.district),
    "Sector": show(c.sector),
    "Flagship engagement": engagement,
  };
}

/**
 * Bulk export data for every Cooperatives/Associations/Companies/Farmer-groups "Export" button:
 * fetches each record's full detail (same data the View Details dialog shows) instead of just the
 * compact table columns. Fetches run with limited concurrency to avoid flooding the backend when
 * exporting hundreds of records at once.
 */
export async function buildCooperativesExportData(
  queryClient: QueryClient,
  cooperatives: CooperativeSummary[],
): Promise<{ columns: ExportColumn[]; rows: Row[] }> {
  const [groupTypes, statuses, flagshipOptions] = await Promise.all([
    queryClient.fetchQuery({ ...enumValuesQueryOptions("group_type"), staleTime: 60_000 }),
    queryClient.fetchQuery({ ...enumValuesQueryOptions("registration_status"), staleTime: 60_000 }),
    queryClient.fetchQuery({ ...flagshipOptionsQueryOptions(), staleTime: 60_000 }),
  ]);
  const flagshipNames = new Map(flagshipOptions.map((o) => [Number(o.value), o.label]));

  const rows = await mapWithConcurrency(cooperatives, 10, async (item) => {
    const detail = await queryClient.fetchQuery(cooperativeQueryOptions(item.cooperativeId));
    return flattenCooperative(detail, groupTypes, statuses, flagshipNames);
  });

  return { columns: COOPERATIVE_EXPORT_COLUMNS, rows };
}
