import { useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../api";
import type { AppSelectOption } from "~/components/app-select";

export interface LookupEnumValue {
  id: number;
  enumGroup: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export interface ValueChainLookup {
  id: number;
  cluster: string;
  valueChain: string;
  active: boolean;
}

export interface ImplementingAgencyLookup {
  id: number;
  agencyName: string;
  agencyType: string;
  active: boolean;
}

export interface FunderLookup {
  id: number;
  funderName: string;
  funderType: string;
  active: boolean;
}

export interface CooperativeLookup {
  cooperativeId?: number;
  id?: number;
  cooperativeName?: string;
  name?: string;
}

function enumToSelectOptions(items: LookupEnumValue[]): AppSelectOption[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ value: item.value, label: item.label }));
}

async function fetchEnumValuesByGroup(enumGroup: string, signal?: AbortSignal) {
  return api.get<LookupEnumValue[]>("/api/lookups/enum-values/by-group", {
    enumGroup,
    active: true,
  }, signal);
}

export function enumLookupQueryOptions(enumGroup: string) {
  return queryOptions({
    queryKey: ["lookups", "enum-values", enumGroup],
    queryFn: ({ signal }) => fetchEnumValuesByGroup(enumGroup, signal),
  });
}

export const flagshipClusterLookupQueryOptions = enumLookupQueryOptions("flagship_cluster");
export const flagshipStatusLookupQueryOptions = enumLookupQueryOptions("flagship_status");
export const sourceTypeLookupQueryOptions = enumLookupQueryOptions("source_type");
export const disbursementTypeLookupQueryOptions = enumLookupQueryOptions("disbursement_type");
export const currencyLookupQueryOptions = enumLookupQueryOptions("currency");
export const reportingPeriodLookupQueryOptions = enumLookupQueryOptions("reporting_period");
export const indicatorTierLookupQueryOptions = enumLookupQueryOptions("indicator_tier");
export const indicatorValueTypeLookupQueryOptions = enumLookupQueryOptions("indicator_value_type");

export interface KpiDefinition {
  id: number;
  flagshipCode: string;
  indicatorName: string;
  indicatorTier: string;
  indicatorValueType: string;
  active: boolean;
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

export function kpiDefinitionsQueryOptions(flagshipCode: string) {
  const code = flagshipCode.trim().toUpperCase();
  return queryOptions({
    queryKey: ["lookups", "kpi-definitions", code],
    queryFn: ({ signal }) =>
      api.get<KpiDefinition[]>("/api/lookups/kpi-definitions", {
        flagshipCode: code,
        active: true,
      }, signal),
    enabled: code.length > 0,
  });
}

export const valueChainsLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "value-chains"],
  queryFn: ({ signal }) =>
    api.get<ValueChainLookup[]>("/api/lookups/value-chains", { active: true }, signal),
});

export const implementingAgenciesLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "implementing-agencies"],
  queryFn: ({ signal }) =>
    api.get<ImplementingAgencyLookup[]>("/api/lookups/implementing-agencies", { active: true }, signal),
});

export const fundersLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "funders"],
  queryFn: ({ signal }) =>
    api.get<FunderLookup[]>("/api/lookups/funders", { active: true }, signal),
});

export const cooperativesLookupQueryOptions = queryOptions({
  queryKey: ["lookups", "cooperatives"],
  queryFn: async ({ signal }) => {
    const raw = await api.get<CooperativeLookup[] | { content?: CooperativeLookup[] }>(
      "/api/cooperatives",
      undefined,
      signal,
    );
    if (Array.isArray(raw)) return raw;
    return raw.content ?? [];
  },
});

export function useFlagshipFormLookups(selectedCluster: string) {
  const clustersQuery = useQuery(flagshipClusterLookupQueryOptions);
  const statusesQuery = useQuery(flagshipStatusLookupQueryOptions);
  const sourceTypesQuery = useQuery(sourceTypeLookupQueryOptions);
  const disbursementTypesQuery = useQuery(disbursementTypeLookupQueryOptions);
  const currencyQuery = useQuery(currencyLookupQueryOptions);
  const valueChainsQuery = useQuery(valueChainsLookupQueryOptions);
  const agenciesQuery = useQuery(implementingAgenciesLookupQueryOptions);
  const fundersQuery = useQuery(fundersLookupQueryOptions);

  const allValueChains = valueChainsQuery.data ?? [];

  const valueChainOptions = useMemo((): AppSelectOption[] => {
    const chains = selectedCluster
      ? allValueChains.filter((row) => row.cluster === selectedCluster)
      : allValueChains;
    return chains.map((row) => ({
      value: row.valueChain,
      label: row.valueChain,
    }));
  }, [allValueChains, selectedCluster]);

  const clusterOptions = useMemo(
    () => enumToSelectOptions(clustersQuery.data ?? []),
    [clustersQuery.data],
  );

  const statusOptions = useMemo(
    () => enumToSelectOptions(statusesQuery.data ?? []),
    [statusesQuery.data],
  );

  const implementingAgencyOptions = useMemo(
    (): AppSelectOption[] =>
      (agenciesQuery.data ?? []).map((row) => ({
        value: row.agencyName,
        label: row.agencyName,
      })),
    [agenciesQuery.data],
  );

  const funderOptions = useMemo(
    (): AppSelectOption[] =>
      (fundersQuery.data ?? []).map((row) => ({
        value: row.funderName,
        label: row.funderName,
      })),
    [fundersQuery.data],
  );

  const sourceTypeOptions = useMemo(
    () => enumToSelectOptions(sourceTypesQuery.data ?? []),
    [sourceTypesQuery.data],
  );

  const disbursementTypeOptions = useMemo(
    () => enumToSelectOptions(disbursementTypesQuery.data ?? []),
    [disbursementTypesQuery.data],
  );

  const currencyOptions = useMemo(
    () => enumToSelectOptions(currencyQuery.data ?? []),
    [currencyQuery.data],
  );

  const isLoading =
    clustersQuery.isLoading ||
    statusesQuery.isLoading ||
    sourceTypesQuery.isLoading ||
    disbursementTypesQuery.isLoading ||
    currencyQuery.isLoading ||
    valueChainsQuery.isLoading ||
    agenciesQuery.isLoading ||
    fundersQuery.isLoading;

  const isError =
    clustersQuery.isError ||
    statusesQuery.isError ||
    sourceTypesQuery.isError ||
    disbursementTypesQuery.isError ||
    currencyQuery.isError ||
    valueChainsQuery.isError ||
    agenciesQuery.isError ||
    fundersQuery.isError;

  return {
    clusterOptions,
    statusOptions,
    valueChainOptions,
    implementingAgencyOptions,
    funderOptions,
    sourceTypeOptions,
    disbursementTypeOptions,
    currencyOptions,
    isLoading,
    isError,
  };
}

function enumValueToLabelMap(items: LookupEnumValue[]): Map<string, string> {
  return new Map(items.map((item) => [item.value, item.label]));
}

export function useKpiFormLookups(flagshipCode: string) {
  const code = flagshipCode.trim().toUpperCase();
  const definitionsQuery = useQuery(kpiDefinitionsQueryOptions(code));
  const reportingPeriodQuery = useQuery(reportingPeriodLookupQueryOptions);
  const tierQuery = useQuery(indicatorTierLookupQueryOptions);
  const valueTypeQuery = useQuery(indicatorValueTypeLookupQueryOptions);

  const definitionByName = useMemo(() => {
    const map = new Map<string, KpiDefinition>();
    for (const row of definitionsQuery.data ?? []) {
      map.set(row.indicatorName, row);
    }
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

  const tierLabels = useMemo(
    () => enumValueToLabelMap(tierQuery.data ?? []),
    [tierQuery.data],
  );

  const valueTypeLabels = useMemo(
    () => enumValueToLabelMap(valueTypeQuery.data ?? []),
    [valueTypeQuery.data],
  );

  const isLoading =
    (code.length > 0 && definitionsQuery.isLoading) ||
    reportingPeriodQuery.isLoading;

  const isError =
    (code.length > 0 && definitionsQuery.isError) ||
    reportingPeriodQuery.isError;

  return {
    code,
    indicatorOptions,
    definitionByName,
    reportingPeriodOptions,
    tierLabels,
    valueTypeLabels,
    isLoading,
    isError,
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
  const sexQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.sex));
  const youthCategoryQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.youthCategory));
  const educationLevelQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.educationLevel));
  const registrationSourceQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.registrationSource));
  const participationTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.participationType));
  const cooperativeRoleQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.cooperativeRole));
  const valueChainStageQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.valueChainStage));
  const employmentTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.employmentType));
  const employmentStatusQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.employmentStatus));
  const employerTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.employerType));
  const incomeRangeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.incomeRangeRwf));
  const landUseTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.landUseType));
  const ownershipStatusQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.ownershipStatus));
  const seasonQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.season));
  const unitQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.unit));
  const marketChannelQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.marketChannel));
  const interventionTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.interventionType));
  const constraintTypeQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.constraintType));
  const severityQuery = useQuery(enumLookupQueryOptions(INDIVIDUAL_ENUM_GROUPS.severity));
  const valueChainsQuery = useQuery(valueChainsLookupQueryOptions);
  const cooperativesQuery = useQuery(cooperativesLookupQueryOptions);

  const valueChainOptions = useMemo(
    (): AppSelectOption[] =>
      (valueChainsQuery.data ?? []).map((item) => ({
        value: item.valueChain,
        label: item.valueChain,
      })),
    [valueChainsQuery.data],
  );

  const cooperativeOptions = useMemo(
    (): AppSelectOption[] =>
      (cooperativesQuery.data ?? []).map((item) => {
        const id = item.cooperativeId ?? item.id;
        const label = item.cooperativeName ?? item.name ?? String(id ?? "");
        return { value: String(id ?? ""), label };
      }).filter((opt) => Boolean(opt.value)),
    [cooperativesQuery.data],
  );

  return {
    sexOptions: enumToSelectOptions(sexQuery.data ?? []),
    youthCategoryOptions: enumToSelectOptions(youthCategoryQuery.data ?? []),
    educationLevelOptions: enumToSelectOptions(educationLevelQuery.data ?? []),
    registrationSourceOptions: enumToSelectOptions(registrationSourceQuery.data ?? []),
    participationTypeOptions: enumToSelectOptions(participationTypeQuery.data ?? []),
    cooperativeRoleOptions: enumToSelectOptions(cooperativeRoleQuery.data ?? []),
    valueChainStageOptions: enumToSelectOptions(valueChainStageQuery.data ?? []),
    employmentTypeOptions: enumToSelectOptions(employmentTypeQuery.data ?? []),
    employmentStatusOptions: enumToSelectOptions(employmentStatusQuery.data ?? []),
    employerTypeOptions: enumToSelectOptions(employerTypeQuery.data ?? []),
    incomeRangeOptions: enumToSelectOptions(incomeRangeQuery.data ?? []),
    landUseTypeOptions: enumToSelectOptions(landUseTypeQuery.data ?? []),
    ownershipStatusOptions: enumToSelectOptions(ownershipStatusQuery.data ?? []),
    seasonOptions: enumToSelectOptions(seasonQuery.data ?? []),
    unitOptions: enumToSelectOptions(unitQuery.data ?? []),
    marketChannelOptions: enumToSelectOptions(marketChannelQuery.data ?? []),
    interventionTypeOptions: enumToSelectOptions(interventionTypeQuery.data ?? []),
    constraintTypeOptions: enumToSelectOptions(constraintTypeQuery.data ?? []),
    severityOptions: enumToSelectOptions(severityQuery.data ?? []),
    valueChainOptions,
    cooperativeOptions,
  };
}
