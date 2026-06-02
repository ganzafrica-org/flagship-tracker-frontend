import { queryOptions } from "@tanstack/react-query";
import { api } from "~/lib/api";

// ─── Value Chains ───────────────────────────────────────────────────────────

export interface ValueChain {
  id: number;
  cluster: string;
  valueChain: string;
  active: boolean;
}

export interface ValueChainRequest {
  cluster: string;
  valueChain: string;
}

export const valueChainsQueryOptions = (params?: { active?: boolean }) =>
  queryOptions({
    queryKey: ["value-chains", params ?? {}],
    queryFn: ({ signal }) =>
      api.get<ValueChain[]>("/api/lookups/value-chains", params, signal),
  });

// ─── Funders ──────────────────────────────────────────────────────────────────

export interface Funder {
  id: number;
  funderName: string;
  funderType: string;
  active: boolean;
}

export interface FunderRequest {
  funderName: string;
  funderType: string;
}

export const fundersQueryOptions = (params?: { active?: boolean; funderType?: string }) =>
  queryOptions({
    queryKey: ["funders", params ?? {}],
    queryFn: ({ signal }) => api.get<Funder[]>("/api/lookups/funders", params, signal),
  });

// ─── Implementing Agencies ─────────────────────────────────────────────────────

export interface Agency {
  id: number;
  agencyName: string;
  agencyType: string;
  active: boolean;
}

export interface AgencyRequest {
  agencyName: string;
  agencyType: string;
}

export const agenciesQueryOptions = (params?: { active?: boolean }) =>
  queryOptions({
    queryKey: ["implementing-agencies", params ?? {}],
    queryFn: ({ signal }) =>
      api.get<Agency[]>("/api/lookups/implementing-agencies", params, signal),
  });

// ─── KPI Definitions ──────────────────────────────────────────────────────────

export interface KpiDefinition {
  id: number;
  flagshipCode: string;
  indicatorName: string;
  indicatorTier: string;
  indicatorValueType: string;
  active: boolean;
}

export interface KpiDefinitionRequest {
  flagshipCode: string;
  indicatorName: string;
  indicatorTier: string;
  indicatorValueType: string;
}

export const kpiDefinitionsQueryOptions = (params?: {
  flagshipCode?: string;
  indicatorTier?: string;
  active?: boolean;
}) =>
  queryOptions({
    queryKey: ["kpi-definitions", params ?? {}],
    queryFn: ({ signal }) =>
      api.get<KpiDefinition[]>("/api/lookups/kpi-definitions", params, signal),
  });

// ─── Enum values (for dropdowns) ────────────────────────────────────────────────

export interface EnumValue {
  id?: number;
  enumGroup: string;
  value: string;
  label: string;
  active?: boolean;
}

export type EnumGroup =
  | "flagship_cluster"
  | "indicator_tier"
  | "indicator_value_type"
  | "group_type"
  | "registration_status";

export const enumValuesQueryOptions = (enumGroup: EnumGroup, active = true) =>
  queryOptions({
    queryKey: ["enum-values", enumGroup, active],
    queryFn: ({ signal }) =>
      api.get<EnumValue[]>("/api/lookups/enum-values/by-group", { enumGroup, active }, signal),
  });

// ─── Flagship codes (for KPI definition dropdown) ───────────────────────────────

interface FlagshipSummary {
  flagshipId: number;
  flagshipName: string;
  flagshipCode: string;
  flagshipCluster: string;
  status: string;
}

interface FlagshipPage {
  content: FlagshipSummary[];
  nextCursor: string | null;
  hasNext: boolean;
}

/** Real flagship list — used to populate the flagshipCode select on KPI definitions. */
export const flagshipCodesQueryOptions = () =>
  queryOptions({
    queryKey: ["flagship-codes"],
    queryFn: async ({ signal }) => {
      const page = await api.get<FlagshipPage>("/api/flagships", undefined, signal);
      return page.content.map((f) => ({
        code: f.flagshipCode,
        name: f.flagshipName,
      }));
    },
  });
