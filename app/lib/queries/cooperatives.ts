import { queryOptions } from "@tanstack/react-query";
import type { DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import { api } from "~/lib/api";

function parsePositiveInt(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function dateValueToIso(value: DateValue | null): string | undefined {
  return value ? value.toString() : undefined;
}

export function isoToDateValue(iso: string | null | undefined): DateValue | null {
  if (!iso) return null;
  return parseDate(iso.slice(0, 10));
}

interface FlagshipOption {
  flagshipId: number;
  flagshipName: string;
  flagshipCode: string;
}

interface FlagshipPage {
  content: FlagshipOption[];
  nextCursor: string | null;
  hasNext: boolean;
}

export const flagshipOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ["flagship-options"],
    queryFn: async ({ signal }) => {
      const page = await api.get<FlagshipPage>("/api/flagships", undefined, signal);
      return page.content.map((f) => ({
        id: f.flagshipId,
        label: `${f.flagshipCode} — ${f.flagshipName}`,
        value: String(f.flagshipId),
      }));
    },
  });

export interface CooperativeSummary {
  cooperativeId: number;
  cooperativeName: string;
  cooperativeCode: string | null;
  groupType: string;
  registrationStatus: string | null;
  primaryValueChain: string | null;
  totalMembers: number | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  createdAt: string;
}

export function formatCooperativeLocation(
  province: string | null | undefined,
  district: string | null | undefined,
): string {
  const parts = [province?.trim(), district?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function cooperativeToTableRow(c: CooperativeSummary) {
  return {
    id: c.cooperativeId,
    cooperativeCode: c.cooperativeCode ?? "—",
    cooperativeName: c.cooperativeName,
    primaryValueChain: c.primaryValueChain ?? "—",
    totalMembers: c.totalMembers ?? 0,
    location: formatCooperativeLocation(c.province, c.district),
    province: c.province ?? "",
    district: c.district ?? "",
  };
}

export const COOPERATIVE_LIST_COLUMNS = [
  { key: "cooperativeCode", label: "Code", width: "110px" },
  { key: "cooperativeName", label: "Cooperative Name" },
  { key: "primaryValueChain", label: "Primary Value Chain" },
  { key: "totalMembers", label: "Total Members", width: "120px" },
  { key: "location", label: "Location" },
  { key: "action", label: "Action", width: "80px" },
] as const;

export const COOPERATIVE_LIST_SEARCH_KEYS = [
  "cooperativeName",
  "cooperativeCode",
  "primaryValueChain",
  "location",
  "province",
  "district",
] as const;

export interface CooperativePageResponse {
  content: CooperativeSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

/** Core fields shared by create + update (no nested flagships/members). */
export interface CooperativeRequest {
  cooperativeName: string;
  cooperativeCode?: string;
  groupType: string;
  registrationStatus?: string;
  primaryValueChain?: string;
  cluster?: string;
  totalMembers?: number;
  femaleMembers?: number;
  youthMembers?: number;
  province?: string;
  district?: string;
  sector?: string;
}

export interface CooperativeFlagshipRelation {
  flagshipId: number;
  engagementType?: string;
  startDate?: string;
  endDate?: string;
}

export interface CooperativeMemberRelation {
  individualId: number;
  role?: string;
  joinDate?: string;
  endDate?: string;
  active?: boolean;
}

export interface CooperativeUpdateRequest extends Partial<CooperativeRequest> {
  flagships?: CooperativeFlagshipRelation[];
  members?: CooperativeMemberRelation[];
}

export function buildCooperativeFlagshipsPayload(input: {
  flagshipId: string;
  engagementType?: string;
  startDate?: DateValue | null;
  endDate?: DateValue | null;
}): CooperativeFlagshipRelation[] {
  const flagshipId = parsePositiveInt(input.flagshipId);
  if (flagshipId == null) return [];

  return [
    {
      flagshipId,
      engagementType: input.engagementType?.trim() || undefined,
      startDate: dateValueToIso(input.startDate ?? null),
      endDate: dateValueToIso(input.endDate ?? null),
    },
  ];
}

/** Full detail response (used when editing — has the core fields plus nested). */
export interface CooperativeDetail extends CooperativeRequest {
  cooperativeId: number;
  createdAt?: string;
  updatedAt?: string;
  flagships?: CooperativeFlagshipRelation[];
  members?: CooperativeMemberRelation[];
}

export async function fetchAllCooperatives(signal?: AbortSignal): Promise<CooperativeSummary[]> {
  const all: CooperativeSummary[] = [];
  let cursor: string | undefined;

  do {
    const page = await api.get<CooperativePageResponse>("/api/cooperatives", { cursor }, signal);
    all.push(...page.content);
    cursor = page.hasNext && page.nextCursor ? page.nextCursor : undefined;
  } while (cursor);

  return all;
}

export const cooperativesListQueryOptions = queryOptions({
  queryKey: ["cooperatives", "all"],
  queryFn: ({ signal }) => fetchAllCooperatives(signal),
});

export const cooperativesQueryOptions = (params?: {
  cursor?: string;
  search?: string;
  valueChain?: string;
}) =>
  queryOptions({
    queryKey: ["cooperatives", params ?? {}],
    queryFn: ({ signal }) =>
      api.get<CooperativePageResponse>("/api/cooperatives", params, signal),
  });

export const cooperativeQueryOptions = (id: number | string) =>
  queryOptions({
    queryKey: ["cooperative", String(id)],
    queryFn: ({ signal }) =>
      api.get<CooperativeDetail>(`/api/cooperatives/${id}`, undefined, signal),
  });
