import { useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../api";
import type { AppSelectOption } from "~/components/app-select";

// ─── Shared enum lookup ───────────────────────────────────────────────────────

export interface LookupEnumValue {
  id: number;
  enumGroup: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

function enumToSelectOptions(items: LookupEnumValue[]): AppSelectOption[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ value: item.value, label: item.label }));
}

function enumValueToLabelMap(items: LookupEnumValue[]): Map<string, string> {
  return new Map(items.map((item) => [item.value, item.label]));
}

async function fetchEnumValuesByGroup(enumGroup: string, signal?: AbortSignal) {
  return api.get<LookupEnumValue[]>("/api/lookups/enum-values/by-group", { enumGroup, active: true }, signal);
}

export function enumLookupQueryOptions(enumGroup: string) {
  return queryOptions({
    queryKey: ["lookups", "enum-values", enumGroup],
    queryFn: ({ signal }) => fetchEnumValuesByGroup(enumGroup, signal),
  });
}

// Legacy enum query used by admin KPI / cooperative forms (group_type, registration_status, indicator_tier, indicator_value_type)
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
  | "registration_status"
  | "funder_type"
  | "agency_type";

/**
 * @param active true = active only (default, for dropdowns); undefined = all
 *   (active + inactive, for the Manage Types admin list).
 */
export const enumValuesQueryOptions = (enumGroup: EnumGroup, active: boolean | undefined = true) =>
  queryOptions({
    queryKey: ["enum-values", enumGroup, active ?? "all"],
    queryFn: ({ signal }) =>
      api.get<EnumValue[]>(
        "/api/lookups/enum-values/by-group",
        active === undefined ? { enumGroup } : { enumGroup, active },
        signal,
      ),
  });

// Enum-value CRUD (admin-managed type lists, e.g. funder_type / agency_type)
export interface EnumValueRequest {
  enumGroup: string;
  value: string;
  label: string;
  sortOrder: number;
}

export const createEnumValue = (body: EnumValueRequest) =>
  api.post<EnumValue>("/api/lookups/enum-values", body);

export const updateEnumValue = (id: number, body: EnumValueRequest) =>
  api.put<EnumValue>(`/api/lookups/enum-values/${id}`, body);

export const deleteEnumValue = (id: number) =>
  api.delete<void>(`/api/lookups/enum-values/${id}`);

// Named enum lookup options (used by flagship & individual forms)
export const flagshipClusterLookupQueryOptions    = enumLookupQueryOptions("flagship_cluster");
export const flagshipStatusLookupQueryOptions     = enumLookupQueryOptions("flagship_status");
export const sourceTypeLookupQueryOptions         = enumLookupQueryOptions("source_type");
export const disbursementTypeLookupQueryOptions   = enumLookupQueryOptions("disbursement_type");
export const currencyLookupQueryOptions           = enumLookupQueryOptions("currency");
export const reportingPeriodLookupQueryOptions    = enumLookupQueryOptions("reporting_period");
export const indicatorTierLookupQueryOptions      = enumLookupQueryOptions("indicator_tier");
export const indicatorValueTypeLookupQueryOptions = enumLookupQueryOptions("indicator_value_type");

// ─── Value Chains ─────────────────────────────────────────────────────────────

export interface ValueChain {
  id: number;
  cluster: string;
  valueChain: string;
  active: boolean;
}

export type ValueChainLookup = ValueChain;

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

export const valueChainsLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "value-chains"],
  queryFn: ({ signal }) =>
    api.get<ValueChainLookup[]>("/api/lookups/value-chains", { active: true }, signal),
});

// ─── Funders ──────────────────────────────────────────────────────────────────

export interface Funder {
  id: number;
  funderName: string;
  funderType: string;
  active: boolean;
}

export type FunderLookup = Funder;

export interface FunderRequest {
  funderName: string;
  funderType: string;
}

export const fundersQueryOptions = (params?: { active?: boolean; funderType?: string }) =>
  queryOptions({
    queryKey: ["funders", params ?? {}],
    queryFn: ({ signal }) => api.get<Funder[]>("/api/lookups/funders", params, signal),
  });

export const fundersLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "funders"],
  queryFn: ({ signal }) =>
    api.get<FunderLookup[]>("/api/lookups/funders", { active: true }, signal),
});

// ─── Implementing Agencies ────────────────────────────────────────────────────

export interface Agency {
  id: number;
  agencyName: string;
  agencyType: string;
  active: boolean;
}

export type ImplementingAgencyLookup = Agency;

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

export const implementingAgenciesLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "implementing-agencies"],
  queryFn: ({ signal }) =>
    api.get<ImplementingAgencyLookup[]>("/api/lookups/implementing-agencies", { active: true }, signal),
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

// Admin list — no required args, supports optional filters
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

// Flagship data-entry forms — requires a flagship code, only fetches active definitions
export function kpiDefinitionsByFlagshipQueryOptions(flagshipCode: string) {
  const code = flagshipCode.trim().toUpperCase();
  return queryOptions({
    queryKey: ["lookups", "kpi-definitions", code],
    queryFn: ({ signal }) =>
      api.get<KpiDefinition[]>("/api/lookups/kpi-definitions", { flagshipCode: code, active: true }, signal),
    enabled: code.length > 0,
  });
}

export const MEASUREMENT_POINT_OPTIONS: AppSelectOption[] = [
  { value: "0", label: "Baseline" },
  { value: "1", label: "Midline" },
  { value: "2", label: "Endline" },
];

export function formatIndicatorNameLabel(indicatorName: string): string {
  return indicatorName
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

// ─── Flagship codes (for KPI definition dropdown on admin) ───────────────────

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

// ─── Cooperatives lookup ──────────────────────────────────────────────────────

export interface CooperativeLookup {
  cooperativeId: number;
  cooperativeName: string;
}

interface CooperativePageResponse {
  content: CooperativeLookup[];
  nextCursor: string | null;
  hasNext: boolean;
}

async function fetchAllCooperatives(signal?: AbortSignal): Promise<CooperativeLookup[]> {
  const all: CooperativeLookup[] = [];
  let cursor: string | undefined;

  do {
    const page = await api.get<CooperativePageResponse>(
      "/api/cooperatives",
      { cursor },
      signal,
    );
    all.push(...page.content);
    cursor = page.hasNext && page.nextCursor ? page.nextCursor : undefined;
  } while (cursor);

  return all;
}

export const cooperativesLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "cooperatives"],
  queryFn: ({ signal }) => fetchAllCooperatives(signal),
});

// ─── Composite hooks ──────────────────────────────────────────────────────────

export function useFlagshipFormLookups(selectedCluster: string) {
  const clustersQuery         = useQuery(flagshipClusterLookupQueryOptions);
  const statusesQuery         = useQuery(flagshipStatusLookupQueryOptions);
  const sourceTypesQuery      = useQuery(sourceTypeLookupQueryOptions);
  const disbursementTypesQuery = useQuery(disbursementTypeLookupQueryOptions);
  const currencyQuery         = useQuery(currencyLookupQueryOptions);
  const valueChainsQuery      = useQuery(valueChainsLookupQueryOptions);
  const agenciesQuery         = useQuery(implementingAgenciesLookupQueryOptions);
  const fundersQuery          = useQuery(fundersLookupQueryOptions);

  const allValueChains = valueChainsQuery.data ?? [];

  const valueChainOptions = useMemo((): AppSelectOption[] => {
    const chains = selectedCluster
      ? allValueChains.filter((row) => row.cluster === selectedCluster)
      : allValueChains;
    return chains.map((row) => ({ value: row.valueChain, label: row.valueChain }));
  }, [allValueChains, selectedCluster]);

  const clusterOptions = useMemo(() => enumToSelectOptions(clustersQuery.data ?? []), [clustersQuery.data]);
  const statusOptions  = useMemo(() => enumToSelectOptions(statusesQuery.data ?? []), [statusesQuery.data]);

  const implementingAgencyOptions = useMemo(
    (): AppSelectOption[] =>
      (agenciesQuery.data ?? []).map((row) => ({ value: row.agencyName, label: row.agencyName })),
    [agenciesQuery.data],
  );

  const funderOptions = useMemo(
    (): AppSelectOption[] =>
      (fundersQuery.data ?? []).map((row) => ({ value: row.funderName, label: row.funderName })),
    [fundersQuery.data],
  );

  const sourceTypeOptions      = useMemo(() => enumToSelectOptions(sourceTypesQuery.data ?? []), [sourceTypesQuery.data]);
  const disbursementTypeOptions = useMemo(() => enumToSelectOptions(disbursementTypesQuery.data ?? []), [disbursementTypesQuery.data]);
  const currencyOptions        = useMemo(() => enumToSelectOptions(currencyQuery.data ?? []), [currencyQuery.data]);

  const isLoading =
    clustersQuery.isLoading || statusesQuery.isLoading || sourceTypesQuery.isLoading ||
    disbursementTypesQuery.isLoading || currencyQuery.isLoading || valueChainsQuery.isLoading ||
    agenciesQuery.isLoading || fundersQuery.isLoading;

  const isError =
    clustersQuery.isError || statusesQuery.isError || sourceTypesQuery.isError ||
    disbursementTypesQuery.isError || currencyQuery.isError || valueChainsQuery.isError ||
    agenciesQuery.isError || fundersQuery.isError;

  return {
    clusterOptions, statusOptions, valueChainOptions,
    implementingAgencyOptions, funderOptions,
    sourceTypeOptions, disbursementTypeOptions, currencyOptions,
    isLoading, isError,
  };
}

export function useKpiFormLookups(flagshipCode: string) {
  const code = flagshipCode.trim().toUpperCase();
  const definitionsQuery      = useQuery(kpiDefinitionsByFlagshipQueryOptions(code));
  const reportingPeriodQuery  = useQuery(reportingPeriodLookupQueryOptions);
  const tierQuery             = useQuery(indicatorTierLookupQueryOptions);
  const valueTypeQuery        = useQuery(indicatorValueTypeLookupQueryOptions);

  const definitionByName = useMemo(() => {
    const map = new Map<string, KpiDefinition>();
    for (const row of definitionsQuery.data ?? []) map.set(row.indicatorName, row);
    return map;
  }, [definitionsQuery.data]);

  const indicatorOptions = useMemo(
    (): AppSelectOption[] =>
      (definitionsQuery.data ?? []).map((row) => ({
        value: row.indicatorName,
        label: formatIndicatorNameLabel(row.indicatorName),
      })),
    [definitionsQuery.data],
  );

  const reportingPeriodOptions = useMemo(
    () => enumToSelectOptions(reportingPeriodQuery.data ?? []),
    [reportingPeriodQuery.data],
  );

  const tierLabels      = useMemo(() => enumValueToLabelMap(tierQuery.data ?? []), [tierQuery.data]);
  const valueTypeLabels = useMemo(() => enumValueToLabelMap(valueTypeQuery.data ?? []), [valueTypeQuery.data]);

  const isLoading = (code.length > 0 && definitionsQuery.isLoading) || reportingPeriodQuery.isLoading;
  const isError   = (code.length > 0 && definitionsQuery.isError)   || reportingPeriodQuery.isError;

  return {
    code, indicatorOptions, definitionByName, reportingPeriodOptions,
    tierLabels, valueTypeLabels, isLoading, isError,
    hasCode: code.length > 0,
    definitionsEmpty: code.length > 0 && !definitionsQuery.isLoading && (definitionsQuery.data?.length ?? 0) === 0,
  };
}

const INDIVIDUAL_ENUM_GROUPS = {
  sex: "sex",
  youthCategory: "youth_category",
  educationLevel: "education_level",
  registrationSource: "registration_source",
  participationType: "participation_type",
  cooperativeRole: "role",
  valueChainStage: "value_chain_stage",
  employmentType: "employment_type",
  employmentStatus: "employment_status",
  employerType: "employer_type",
  incomeRangeRwf: "income_range_rwf",
  landUseType: "land_use_type",
  ownershipStatus: "ownership_status",
  season: "season",
  unit: "unit",
  marketChannel: "market_channel",
  interventionType: "intervention_type",
  constraintType: "constraint_type",
  severity: "severity",
} as const;

export function useIndividualsFormLookups() {
  const sexQuery               = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.sex));
  const youthCategoryQuery     = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.youthCategory));
  const educationLevelQuery    = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.educationLevel));
  const registrationSourceQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.registrationSource));
  const participationTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.participationType));
  const cooperativeRoleQuery   = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.cooperativeRole));
  const valueChainStageQuery   = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.valueChainStage));
  const employmentTypeQuery    = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.employmentType));
  const employmentStatusQuery  = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.employmentStatus));
  const employerTypeQuery      = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.employerType));
  const incomeRangeQuery       = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.incomeRangeRwf));
  const landUseTypeQuery       = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.landUseType));
  const ownershipStatusQuery   = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.ownershipStatus));
  const seasonQuery            = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.season));
  const unitQuery              = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.unit));
  const marketChannelQuery     = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.marketChannel));
  const interventionTypeQuery  = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.interventionType));
  const constraintTypeQuery    = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.constraintType));
  const severityQuery          = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.severity));
  const valueChainsQuery       = useQuery(valueChainsLookupQueryOptions);
  const cooperativesQuery      = useQuery(cooperativesLookupQueryOptions);

  const valueChainOptions = useMemo(
    (): AppSelectOption[] =>
      (valueChainsQuery.data ?? []).map((item) => ({ value: item.valueChain, label: item.valueChain })),
    [valueChainsQuery.data],
  );

  const cooperativeOptions = useMemo(
    (): AppSelectOption[] =>
      (cooperativesQuery.data ?? []).map((item) => ({
        value: String(item.cooperativeId),
        label: item.cooperativeName,
      })),
    [cooperativesQuery.data],
  );

  return {
    sexOptions:               enumToSelectOptions(sexQuery.data ?? []),
    youthCategoryOptions:     enumToSelectOptions(youthCategoryQuery.data ?? []),
    educationLevelOptions:    enumToSelectOptions(educationLevelQuery.data ?? []),
    registrationSourceOptions: enumToSelectOptions(registrationSourceQuery.data ?? []),
    participationTypeOptions: enumToSelectOptions(participationTypeQuery.data ?? []),
    cooperativeRoleOptions:   enumToSelectOptions(cooperativeRoleQuery.data ?? []),
    valueChainStageOptions:   enumToSelectOptions(valueChainStageQuery.data ?? []),
    employmentTypeOptions:    enumToSelectOptions(employmentTypeQuery.data ?? []),
    employmentStatusOptions:  enumToSelectOptions(employmentStatusQuery.data ?? []),
    employerTypeOptions:      enumToSelectOptions(employerTypeQuery.data ?? []),
    incomeRangeOptions:       enumToSelectOptions(incomeRangeQuery.data ?? []),
    landUseTypeOptions:       enumToSelectOptions(landUseTypeQuery.data ?? []),
    ownershipStatusOptions:   enumToSelectOptions(ownershipStatusQuery.data ?? []),
    seasonOptions:            enumToSelectOptions(seasonQuery.data ?? []),
    unitOptions:              enumToSelectOptions(unitQuery.data ?? []),
    marketChannelOptions:     enumToSelectOptions(marketChannelQuery.data ?? []),
    interventionTypeOptions:  enumToSelectOptions(interventionTypeQuery.data ?? []),
    constraintTypeOptions:    enumToSelectOptions(constraintTypeQuery.data ?? []),
    severityOptions:          enumToSelectOptions(severityQuery.data ?? []),
    valueChainOptions,
    cooperativeOptions,
  };
}
