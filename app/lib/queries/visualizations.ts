import { queryOptions } from "@tanstack/react-query";
import { api } from "~/lib/api";

/** Refresh all analytics materialized views on the server. */
export const refreshVisualizations = () => api.post<void>("/api/visualizations/refresh");

// ─── Senior dashboard (1.1–1.11) ────────────────────────────────────────────────

export interface SeniorDashboard {
  cards: {
    totalFlagships: number;
    totalJobsCreated: number | null;
    totalInvestors: number;
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

export const seniorDashboardQueryOptions = (year?: number) =>
  queryOptions({
    queryKey: ["viz", "senior-dashboard", year ?? "all"],
    queryFn: ({ signal }) =>
      api.get<SeniorDashboard>("/api/visualizations/senior-dashboard", { year }, signal),
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

export const cooperativesDashboardQueryOptions = (flagship?: string) =>
  queryOptions({
    queryKey: ["viz", "cooperatives", flagship ?? "all"],
    queryFn: ({ signal }) =>
      api.get<CooperativesDashboard>("/api/visualizations/cooperatives", { flagship }, signal),
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
  byYouthCategory: { name: string; value: number }[];
  flagshipProportion: { name: string; value: number }[];
  perFlagship: { flagshipCode: string; count: number }[];
  byValueChain: { name: string; value: number }[];
  growth: {
    year: number;
    month: number;
    registered: number;
    inFlagships: number;
    outsideFlagships: number;
  }[];
}

export const individualsDashboardQueryOptions = (params?: {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  view?: "all" | "youth";
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
