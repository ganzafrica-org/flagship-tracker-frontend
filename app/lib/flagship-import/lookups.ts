import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  currencyLookupQueryOptions,
  disbursementTypeLookupQueryOptions,
  flagshipClusterLookupQueryOptions,
  flagshipStatusLookupQueryOptions,
  fundersLookupQueryOptions,
  implementingAgenciesLookupQueryOptions,
  kpiDefinitionsQueryOptions,
  MEASUREMENT_POINT_OPTIONS,
  reportingPeriodLookupQueryOptions,
  sourceTypeLookupQueryOptions,
  valueChainsLookupQueryOptions,
  type LookupEnumValue,
} from "~/lib/queries/lookups";
import { listRwandaProvinces } from "~/lib/rwanda-locations";

export interface LookupOption {
  /** What the API stores. */
  value: string;
  /** What the form shows. The template offers labels; uploads may use either. */
  label: string;
}

export interface ImportLookups {
  clusters: LookupOption[];
  statuses: LookupOption[];
  valueChains: { cluster: string; valueChain: string }[];
  funders: LookupOption[];
  agencies: LookupOption[];
  currencies: LookupOption[];
  sourceTypes: LookupOption[];
  disbursementTypes: LookupOption[];
  measurementPoints: LookupOption[];
  reportingPeriods: LookupOption[];
  kpiDefinitions: { flagshipCode: string; indicatorName: string }[];
  provinces: string[];
}

function fromEnum(items: LookupEnumValue[] | undefined): LookupOption[] {
  return [...(items ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ value: item.value, label: item.label }));
}

/** The same lookups the Add Flagship form uses, plus the approved KPI definitions for every code. */
export function useFlagshipImportLookups(enabled = true) {
  const queries = {
    clusters: useQuery({ ...flagshipClusterLookupQueryOptions, enabled }),
    statuses: useQuery({ ...flagshipStatusLookupQueryOptions, enabled }),
    valueChains: useQuery({ ...valueChainsLookupQueryOptions, enabled }),
    funders: useQuery({ ...fundersLookupQueryOptions, enabled }),
    agencies: useQuery({ ...implementingAgenciesLookupQueryOptions, enabled }),
    currencies: useQuery({ ...currencyLookupQueryOptions, enabled }),
    sourceTypes: useQuery({ ...sourceTypeLookupQueryOptions, enabled }),
    disbursementTypes: useQuery({ ...disbursementTypeLookupQueryOptions, enabled }),
    reportingPeriods: useQuery({ ...reportingPeriodLookupQueryOptions, enabled }),
    kpiDefinitions: useQuery({ ...kpiDefinitionsQueryOptions({ active: true }), enabled }),
  };
  const all = Object.values(queries);

  const lookups = useMemo<ImportLookups | null>(() => {
    if (all.some((q) => q.data === undefined)) return null;
    return {
      clusters: fromEnum(queries.clusters.data),
      statuses: fromEnum(queries.statuses.data),
      valueChains: queries.valueChains.data!.map((v) => ({ cluster: v.cluster, valueChain: v.valueChain })),
      funders: queries.funders.data!.map((f) => ({ value: f.funderName, label: f.funderName })),
      agencies: queries.agencies.data!.map((a) => ({ value: a.agencyName, label: a.agencyName })),
      currencies: fromEnum(queries.currencies.data),
      sourceTypes: fromEnum(queries.sourceTypes.data),
      disbursementTypes: fromEnum(queries.disbursementTypes.data),
      measurementPoints: MEASUREMENT_POINT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      reportingPeriods: fromEnum(queries.reportingPeriods.data),
      kpiDefinitions: queries.kpiDefinitions.data!.map((d) => ({
        flagshipCode: d.flagshipCode.toUpperCase(),
        indicatorName: d.indicatorName,
      })),
      provinces: listRwandaProvinces(),
    };
  }, all.map((q) => q.data));

  return {
    lookups,
    isLoading: all.some((q) => q.isLoading),
    isError: all.some((q) => q.isError),
  };
}
