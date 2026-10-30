import { queryOptions } from "@tanstack/react-query";
import { api } from "~/lib/api";

/** Refresh all analytics materialized views on the server. */
export const refreshVisualizations = () => api.post<void>("/api/visualizations/refresh");

// ─── Senior dashboard (1.1–1.11) ────────────────────────────────────────────────

export interface SeniorDashboard {
  cards: {
    totalFlagships: number;
    totalJobsCreated: number | null;
    totalFunders: number;
    totalInvestmentRwf: number | null;
    totalCooperativesEngaged: number;
  };
  investmentBySource: { name: string; value: number | null }[];
  jobsByFlagship: { flagshipCode: string; flagshipName: string; jobs: number | null }[];
  locations: {
    locationId: number;
    flagshipId: number;
    flagshipName: string;
    flagshipCode: string;
    status: string;
    province: string;
    district: string;
    sector: string | null;
  }[];
  investmentProgress: {
    flagshipId: number;
    flagshipCode: string;
    flagshipName: string;
    status: string;
    totalInvestmentRwf: number | null;
    budgetTotalRwf: number | null;
    progressPercent: number | null;
  }[];
}

/** Dashboard data: revisiting within the window shows the cache instantly; stale data refetches in the background. */
const DASHBOARD_CACHE = { staleTime: 60_000, gcTime: 30 * 60_000 } as const;

export const seniorDashboardQueryOptions = (year?: number) =>
  queryOptions({
    queryKey: ["viz", "senior-dashboard", year ?? "all"],
    queryFn: ({ signal }) =>
      api.get<SeniorDashboard>("/api/visualizations/senior-dashboard", { year }, signal),
    ...DASHBOARD_CACHE,
  });

/** Total individuals and the youth_status split, from one aggregate query (no list download). */
export interface SeniorIndividuals {
  total: number;
  youth: number;
  nonYouth: number;
  /** youth_status null or not 'youth' / 'non_youth'. */
  unknown: number;
}

export const seniorIndividualsQueryOptions = queryOptions({
  queryKey: ["viz", "senior-individuals"],
  queryFn: ({ signal }) =>
    api.get<SeniorIndividuals>("/api/visualizations/senior-dashboard/individuals", undefined, signal),
  ...DASHBOARD_CACHE,
});

// ─── Cooperatives dashboard (C.1–C.10) ──────────────────────────────────────────

export interface CooperativesDashboard {
  cards: {
    totalCooperatives: number;
    linkedToFlagships: number;
    notLinkedToFlagships: number;
    totalMembers: number | null;
    totalFemaleMembers: number | null;
  };
  flagshipProportion: { name: string; value: number }[];
  membersByFlagship: { flagshipCode: string; members: number | null }[];
  engagementByFlagship: {
    flagshipCode: string;
    implementingPartner: number;
    beneficiaryGroup: number;
    serviceProvider: number;
  }[];
  inclusionShare: { flagshipCode: string; femaleShare: number | null; youthShare: number | null }[];
  cooperativesPerFlagship: { flagshipCode: string; cooperatives: number }[];
}

export const cooperativesDashboardQueryOptions = (flagship?: string, type?: string) =>
  queryOptions({
    queryKey: ["viz", "cooperatives", flagship ?? "all", type ?? "all"],
    queryFn: ({ signal }) =>
      api.get<CooperativesDashboard>("/api/visualizations/cooperatives", { flagship, type }, signal),
  });

// ─── Flagship summary (mv_flagship_summary) ────────────────────────────────────

export interface FlagshipSummaryRow {
  flagshipId: number;
  flagshipName: string;
  flagshipCode: string;
  flagshipCluster: string;
  status: string;
  primaryValueChain: string[];
  startDate: string | null;
  targetYouthCount: number | null;
  budgetTotalRwf: number | null;
  jobsCreatedActual: number | null;
  investorCount: number | null;
  /** mv_flagship_summary.jobs_created_female; null when the flagship has no female job KPI. */
  jobsCreatedFemale: number | null;
}

export const flagshipSummaryQueryOptions = queryOptions({
  queryKey: ["viz", "flagship-summary"],
  queryFn: ({ signal }) =>
    api.get<FlagshipSummaryRow[]>("/api/visualizations/flagship-summary", undefined, signal),
});

const STATUS_ORDER = ["active", "planning", "suspended", "closed"];

/** Flagships Status: every flagship from mv_flagship_summary, active first, then by name (same cache entry as the flagship cards). */
export const flagshipStatusListQueryOptions = queryOptions({
  ...flagshipSummaryQueryOptions,
  ...DASHBOARD_CACHE,
  select: (summary: FlagshipSummaryRow[]): FlagshipSummaryRow[] => {
    const rank = (status: string) => {
      const i = STATUS_ORDER.indexOf(status);
      return i === -1 ? STATUS_ORDER.length : i;
    };
    return [...summary].sort(
      (a, b) => rank(a.status) - rank(b.status) || a.flagshipName.localeCompare(b.flagshipName),
    );
  },
});

// ─── Individuals dashboard (I.1–I.11) ───────────────────────────────────────────

export interface IndividualsDashboard {
  cards: {
    totalIndividuals: number;
    inFlagships: number;
    outsideFlagships: number;
    female: number;
    youth: number;
  };
  bySex: { name: string; value: number }[];
  /** One entry per value chain (stages combined); `stages` is the per-stage breakdown. */
  byValueChain: { name: string; value: number; stages?: { stage: string; count: number }[] }[];
}

export const individualsDashboardQueryOptions = (params?: {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  view?: "all" | "youth";
  /** Flagship NAME; narrows the value-chain chart to that flagship. */
  flagship?: string;
}) =>
  queryOptions({
    queryKey: ["viz", "individuals", params ?? {}],
    queryFn: ({ signal }) =>
      api.get<IndividualsDashboard>("/api/visualizations/individuals", params, signal),
  });

// ─── Single flagship dashboard (3.1–3.15) ───────────────────────────────────────

export interface FlagshipDashboard {
  locations: { locationId: number; province: string; district: string; sector: string | null }[];
  kpis: {
    indicatorName: string;
    indicatorTier: string;
    indicatorValueType: string;
    year: number | null;
    reportingPeriod: string | null;
    baselineValue: number | null;
    targetValue: number | null;
    actualValue: number | null;
    disaggregation: string | null;
  }[];
  gender: {
    jobsKpiYear: number | null;
    jobsMale: number | null;
    jobsFemale: number | null;
    individualsMale: number | null;
    individualsFemale: number | null;
  } | null;
  investmentBySource: { name: string; value: number | null }[];
  production: {
    valueChain: string;
    year: number | null;
    revenueRwf: number | null;
    quantityProduced: number | null;
    unit: string | null;
  }[];
  team: {
    individualId: number;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    active: boolean | null;
  }[];
  constraints: {
    feedbackId: number;
    constraintType: string;
    severity: string | null;
    description: string | null;
    reportedDate: string | null;
    year: number | null;
    location: string | null;
  }[];
}

export const flagshipDashboardQueryOptions = (id: number | string) =>
  queryOptions({
    queryKey: ["viz", "flagship", String(id)],
    queryFn: ({ signal }) =>
      api.get<FlagshipDashboard>(`/api/visualizations/flagships/${id}`, undefined, signal),
  });

// ─── Value chains by flagship (admin dashboard) ─────────────────────────────────

export interface FlagshipValueChain {
  name: string;
  totalIndividuals: number;
  stages: { stage: string; count: number }[];
  female: number;
  male: number;
  youth: number;
  nonYouth: number;
  unknownYouth: number;
  cooperatives: number;
}

export interface FlagshipValueChains {
  flagships: {
    flagshipId: number;
    flagshipCode: string;
    flagshipName: string;
    /** Flagship-level only: jobs are not tracked per value chain. */
    jobsCreated: number | null;
    /** Individuals linked to this flagship through individual_flagship (any value chain). */
    linkedIndividuals: number;
    valueChains: FlagshipValueChain[];
  }[];
}

export const flagshipValueChainsQueryOptions = queryOptions({
  queryKey: ["viz", "flagship-value-chains"],
  queryFn: ({ signal }) =>
    api.get<FlagshipValueChains>("/api/visualizations/flagship-value-chains", undefined, signal),
});
