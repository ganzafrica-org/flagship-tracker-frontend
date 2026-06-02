import { queryOptions } from "@tanstack/react-query";
import { api } from "~/lib/api";

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

/** Full detail response (used when editing — has the core fields plus nested). */
export interface CooperativeDetail extends CooperativeRequest {
  cooperativeId: number;
  createdAt?: string;
}

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
