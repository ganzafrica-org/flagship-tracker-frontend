import { useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { countFunders, parseFunderNames } from "../flagship-funders";
import { ApiError, api } from "../api";
import { getAccessToken } from "../auth";
import { queryClient } from "../query-client";
import type { FlagshipSummaryRow } from "./visualizations";

export type FlagshipStatus = "planning" | "active" | "suspended" | "closed";

/** UI tabs mirror backend statuses exactly. */
export type FlagshipStatusTab = "all" | FlagshipStatus;

export const FLAGSHIP_STATUS_TAB_ITEMS: { id: FlagshipStatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
  { id: "closed", label: "Closed" },
];

export function filterFlagshipsByStatusTab<T extends { status: FlagshipStatus }>(
  items: T[],
  tab: FlagshipStatusTab,
): T[] {
  if (tab === "all") return items;
  return items.filter((item) => item.status === tab);
}

export interface FundingContribution {
  name: string;
  currency: string | null;
  amount: string | null;
  description: string | null;
  color: string | null;
}

export interface FlagshipInvestment {
  investmentId: number;
  flagshipId: number;
  amount: number;
  currency: string;
  amountRwf: number;
  sourceType: string;
  investorName: string | null;
  investmentDate: string | null;
  year: number | null;
  disbursementType: string | null;
  notes: string | null;
}

export interface FlagshipLocation {
  id: number;
  flagshipId: number;
  province: string;
  district: string;
  sector: string | null;
}

export interface FlagshipKpi {
  kpiId: number;
  flagshipId: number;
  indicatorTier: string;
  indicatorName: string;
  indicatorValueType: string | null;
  baselineValue: number | null;
  targetValue: number | null;
  actualValue: number | null;
  measurementPoint: number;
  year: number;
  reportingPeriod: string;
  disaggregation: string | null;
  dataSource: string | null;
  verified: boolean | null;
  notes: string | null;
  valueChain: string | null;
}

export interface FlagshipDetailResponse {
  flagshipId: number;
  flagshipName: string;
  flagshipCode: string;
  description: string | null;
  flagshipCluster: string;
  primaryValueChain: string | null;
  startDate: string | null;
  endDate: string | null;
  status: FlagshipStatus;
  implementingAgency: string | null;
  managementModel: string | null;
  targetYouthCount: number | null;
  jobsCreated: number | null;
  progressPercent: number | null;
  budgetTotalRwf: number | null;
  funders: string | null;
  fundingContributions: FundingContribution[];
  createdAt: string;
  updatedAt: string | null;
  investments: FlagshipInvestment[];
  kpis: FlagshipKpi[];
  locations: FlagshipLocation[];
  valueChains?: { valueChain: string; cluster: string | null; primary: boolean }[];
}

export interface FlagshipsPageResponse {
  content: FlagshipDetailResponse[];
  nextCursor: string | null;
  hasNext: boolean;
}

/** UI model for detail pages. */
export interface Flagship {
  id: number;
  name: string;
  code: string;
  status: FlagshipStatus;
  cluster: string;
  description: string | null;
  primaryValueChain: string | null;
  implementingAgency: string | null;
  managementModel: string | null;
  jobsCreated: number;
  progressPercent: number;
  targetYouthCount: number | null;
  startDate: string | null;
  endDate: string | null;
  budgetTotalRwf: number | null;
  funders: string | null;
  fundingContributions: FundingContribution[];
  lead: string;
  createdAt: string;
  investments: FlagshipInvestment[];
  kpis: FlagshipKpi[];
  locations: FlagshipLocation[];
  valueChains: { valueChain: string; cluster: string | null; primary: boolean }[];
}

/** Card grid / table row shape used by `FlagshipsList`. */
export interface FlagshipListItem {
  id: number;
  status: FlagshipStatus;
  title: string;
  code: string;
  cluster: string;
  jobsCreated: number;
  /** Youth jobs target used by the card progress bar. Null when the flagship has no target. */
  jobsTarget: number | null;
  totalBudget: string;
  numberOfFunders: number;
  valueChain: string;
  progress: number;
  /** Text shown next to the bar (can exceed 100% or be "—"); the bar itself is capped at 100. */
  progressText?: string;
  location: string;
  dateLabel: string;
  accentColor: string;
  funderNames: string[];
  /** Rich funder rows (name + currency/amount/description) for the card popover. */
  funderContributions: FundingContribution[];
  viewMoreLabel?: string;
}

/**
 * Per-card hues (icon circle + progress bar only). Uses app theme tokens from app.css
 * (primary blue, amber, dark green, red) — same palette as the flagship card design.
 */
const FLAGSHIP_CARD_ACCENTS = [
  "var(--accent)",
  "var(--warning)",
  "var(--forest)",
  "var(--danger)",
  "var(--forest)",
  "var(--accent)",
] as const;

/** Color by grid position so the first card is always primary blue (`--accent`). */
export function getFlagshipCardAccent(cardIndex: number): string {
  return FLAGSHIP_CARD_ACCENTS[Math.max(0, cardIndex) % FLAGSHIP_CARD_ACCENTS.length];
}

export function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Budget with its currency, e.g. "18,089,904,359 RWF" (budgets are stored in RWF). */
export function formatBudgetRwf(amount: number): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} RWF`;
}

/** Text beside the flagship progress bar: jobs created, and the youth target when one exists. */
function jobsTowardTargetText(jobs: number, target: number | null | undefined): string {
  const jobsLabel = jobs.toLocaleString("en-US");
  if (target == null || target <= 0) return jobsLabel;
  return `${jobsLabel} of ${target.toLocaleString("en-US")}`;
}

function formatLocations(locations: FlagshipLocation[]): string {
  if (locations.length === 0) return "—";
  const first = locations[0];
  return [first.district, first.province].filter(Boolean).join(", ");
}

export function mapFlagshipToListItem(
  detail: FlagshipDetailResponse,
  cardIndex = 0,
): FlagshipListItem {
  const funderCount = countFunders(detail.funders, detail.fundingContributions);
  let funderNames = parseFunderNames(detail.funders);
  if (funderCount === 1 && funderNames.length > 1 && detail.funders?.trim()) {
    funderNames = [detail.funders.trim()];
  }

  return {
    id: detail.flagshipId,
    status: detail.status,
    title: detail.flagshipName,
    code: detail.flagshipCode,
    cluster: detail.flagshipCluster,
    jobsCreated: detail.jobsCreated ?? 0,
    jobsTarget: detail.targetYouthCount,
    totalBudget:
      detail.budgetTotalRwf != null && detail.budgetTotalRwf > 0
        ? formatBudgetRwf(detail.budgetTotalRwf)
        : "—",
    numberOfFunders: funderCount,
    valueChain: detail.primaryValueChain?.trim() || "—",
    progress: detail.progressPercent == null ? 0 : Math.round(detail.progressPercent),
    progressText: jobsTowardTargetText(detail.jobsCreated ?? 0, detail.targetYouthCount),
    location: formatLocations(detail.locations),
    dateLabel: formatDateLabel(detail.createdAt),
    accentColor: getFlagshipCardAccent(cardIndex),
    funderNames,
    funderContributions: detail.fundingContributions ?? [],
  };
}

/**
 * Card data from a mv_flagship_summary row. Funders are not in the view (only a count),
 * so they come from the flagship detail the card was already built from.
 */
export function applySummaryRow(item: FlagshipListItem, row: FlagshipSummaryRow): FlagshipListItem {
  const target = row.targetYouthCount;
  const jobsCreated = row.jobsCreatedActual == null ? item.jobsCreated : Math.round(row.jobsCreatedActual);
  const pct = target == null || target <= 0 ? null : Math.round((jobsCreated / target) * 100);

  return {
    ...item,
    id: row.flagshipId,
    status: row.status as FlagshipStatus,
    title: row.flagshipName,
    code: row.flagshipCode,
    cluster: row.flagshipCluster,
    jobsCreated,
    jobsTarget: target ?? null,
    totalBudget:
      row.budgetTotalRwf != null && row.budgetTotalRwf > 0 ? formatBudgetRwf(row.budgetTotalRwf) : item.totalBudget,
    valueChain: row.primaryValueChain?.length ? row.primaryValueChain.join(", ") : item.valueChain,
    progress: pct == null ? 0 : Math.min(100, Math.max(0, pct)),
    progressText: jobsTowardTargetText(jobsCreated, target),
    dateLabel: row.startDate ? formatDateLabel(row.startDate) : item.dateLabel,
  };
}

export function mapDetailToFlagship(detail: FlagshipDetailResponse): Flagship {
  return {
    id: detail.flagshipId,
    name: detail.flagshipName,
    code: detail.flagshipCode,
    status: detail.status,
    cluster: detail.flagshipCluster,
    description: detail.description,
    primaryValueChain: detail.primaryValueChain,
    implementingAgency: detail.implementingAgency,
    managementModel: detail.managementModel,
    jobsCreated: detail.jobsCreated ?? 0,
    progressPercent: detail.progressPercent ?? 0,
    targetYouthCount: detail.targetYouthCount,
    startDate: detail.startDate,
    endDate: detail.endDate,
    budgetTotalRwf: detail.budgetTotalRwf,
    funders: detail.funders,
    fundingContributions: detail.fundingContributions ?? [],
    lead: detail.implementingAgency ?? "—",
    createdAt: detail.createdAt,
    investments: detail.investments,
    kpis: detail.kpis,
    locations: detail.locations,
    valueChains: detail.valueChains ?? [],
  };
}

function assertAccessToken(): void {
  if (!getAccessToken()) {
    throw new ApiError(401, "Unauthorized", "Missing access token. Please log in again.");
  }
}

export async function fetchAllFlagships(
  signal?: AbortSignal,
  filters?: { search?: string; status?: FlagshipStatus },
): Promise<FlagshipDetailResponse[]> {
  assertAccessToken();
  const all: FlagshipDetailResponse[] = [];
  let cursor: string | undefined;

  do {
    const page = await api.get<FlagshipsPageResponse>(
      "/api/flagships",
      {
        cursor,
        search: filters?.search,
        status: filters?.status,
      },
      signal,
    );
    all.push(...page.content);
    cursor = page.hasNext && page.nextCursor ? page.nextCursor : undefined;
  } while (cursor);

  return all;
}

/** Revisits paint from cache immediately; a background refresh keeps figures current. */
const FLAGSHIP_CACHE = { staleTime: 60_000, gcTime: 30 * 60_000 } as const;

export const flagshipsQueryOptions = queryOptions({
  queryKey: ["flagships"],
  queryFn: ({ signal }) => fetchAllFlagships(signal),
  ...FLAGSHIP_CACHE,
});

export async function fetchFlagshipDetail(
  id: number,
  signal?: AbortSignal,
): Promise<FlagshipDetailResponse> {
  assertAccessToken();
  return api.get<FlagshipDetailResponse>(`/api/flagships/${id}`, undefined, signal);
}

export const flagshipDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["flagships", id, "detail"],
    queryFn: ({ signal }) => fetchFlagshipDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
    ...FLAGSHIP_CACHE,
  });

export const flagshipQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["flagships", id],
    queryFn: async ({ signal }) => mapDetailToFlagship(await fetchFlagshipDetail(id, signal)),
    enabled: Number.isFinite(id) && id > 0,
    /** Paint the page from the list the user is already looking at, then replace it with the full record. */
    placeholderData: () => {
      const list = queryClient.getQueryData<FlagshipDetailResponse[]>(flagshipsQueryOptions.queryKey);
      const row = list?.find((item) => item.flagshipId === id);
      return row ? mapDetailToFlagship(row) : undefined;
    },
    ...FLAGSHIP_CACHE,
  });

export interface FlagshipTableRow {
  id: number;
  flagshipId: number;
  projectName: string;
  totalBudget: string;
  jobsCreated: number;
  numberOfFunders: number;
  valueChain: string;
  code: string;
  cluster: string;
  progress: string;
  /** Numeric progress for the progress-bar renderer. */
  progressValue: number;
  /** Rich funder rows for the avatar-group renderer. */
  funderContributions: FundingContribution[];
  status: FlagshipStatus;
}

/**
 * Single mapping used by both the card and table views, so they always match:
 * mv_flagship_summary figures when the view has a row, else the flagship's own data
 * (e.g. created since the last refresh).
 */
export function mapFlagshipCard(
  detail: FlagshipDetailResponse,
  index: number,
  row: FlagshipSummaryRow | undefined,
): FlagshipListItem {
  const base = mapFlagshipToListItem(detail, index);
  return row ? applySummaryRow(base, row) : base;
}

export function buildFlagshipTableRows(
  flagships: FlagshipDetailResponse[],
  summaryById: Map<number, FlagshipSummaryRow> = new Map(),
): FlagshipTableRow[] {
  return flagships.map((item, index) => {
    const card = mapFlagshipCard(item, index, summaryById.get(item.flagshipId));
    return {
      id: index + 1,
      flagshipId: card.id,
      projectName: card.title,
      totalBudget: card.totalBudget,
      jobsCreated: card.jobsCreated,
      numberOfFunders: card.numberOfFunders,
      valueChain: card.valueChain,
      code: card.code,
      cluster: card.cluster,
      status: card.status,
      progress: card.progressText ?? `${card.progress}%`,
      progressValue: card.progress,
      funderContributions: card.funderContributions,
    };
  });
}

export function useFlagshipSelectOptions() {
  const query = useQuery(flagshipsQueryOptions);
  const options = useMemo(
    () =>
      (query.data ?? []).map((item) => ({
        value: String(item.flagshipId),
        label: item.flagshipName,
      })),
    [query.data],
  );

  return { options, ...query };
}

/** Body for POST /api/flagships (ADMIN). */
export interface CreateFlagshipRequest {
  flagshipName: string;
  flagshipCode: string;
  flagshipCluster: string;
  status: FlagshipStatus;
  description?: string | null;
  primaryValueChain?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  implementingAgency?: string | null;
  managementModel?: string | null;
  targetYouthCount?: number | null;
  budgetTotalRwf?: number | null;
  funders?: string | null;
}

function parsePositiveInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

function parsePositiveLong(value: string): number | undefined {
  const trimmed = value.replace(/,/g, "").trim();
  if (!trimmed) return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

export function buildCreateFlagshipRequest(input: {
  flagshipName: string;
  flagshipCode: string;
  flagshipCluster: string;
  status: string;
  description?: string;
  primaryValueChain?: string;
  startDate?: string;
  endDate?: string;
  implementingAgency?: string;
  managementModel?: string;
  targetYouthCount?: string;
  budgetTotalRwf?: string;
  funders?: string;
}): CreateFlagshipRequest {
  const body: CreateFlagshipRequest = {
    flagshipName: input.flagshipName.trim(),
    flagshipCode: input.flagshipCode.trim().toUpperCase(),
    flagshipCluster: input.flagshipCluster,
    status: input.status as FlagshipStatus,
  };

  const description = input.description?.trim();
  if (description) body.description = description;

  if (input.primaryValueChain?.trim()) {
    body.primaryValueChain = input.primaryValueChain.trim();
  }

  if (input.startDate) body.startDate = input.startDate;
  if (input.endDate) body.endDate = input.endDate;

  if (input.implementingAgency?.trim()) {
    body.implementingAgency = input.implementingAgency.trim();
  }

  const managementModel = input.managementModel?.trim();
  if (managementModel) body.managementModel = managementModel;

  const targetYouthCount = input.targetYouthCount ? parsePositiveInt(input.targetYouthCount) : undefined;
  if (targetYouthCount !== undefined) body.targetYouthCount = targetYouthCount;

  const budgetTotalRwf = input.budgetTotalRwf ? parsePositiveLong(input.budgetTotalRwf) : undefined;
  if (budgetTotalRwf !== undefined) body.budgetTotalRwf = budgetTotalRwf;

  if (input.funders?.trim()) body.funders = input.funders.trim();

  return body;
}

export async function createFlagship(body: CreateFlagshipRequest): Promise<FlagshipDetailResponse> {
  assertAccessToken();
  return api.post<FlagshipDetailResponse>("/api/flagships", body);
}

/** Body for POST /api/flagships/{flagshipId}/kpis (ADMIN). */
export interface CreateFlagshipKpiRequest {
  indicatorTier: string;
  indicatorName: string;
  indicatorValueType: string;
  baselineValue?: number | null;
  targetValue?: number | null;
  actualValue?: number | null;
  measurementPoint: number;
  year: number;
  reportingPeriod: string;
  verified?: boolean;
}

/** Creates the approved indicator for this flagship code. A 409 means it already exists. */
export async function ensureFlagshipKpiDefinition(
  flagshipCode: string,
  body: { indicatorName: string; indicatorTier: string; indicatorValueType: string },
): Promise<void> {
  assertAccessToken();
  try {
    await api.post("/api/lookups/kpi-definitions", {
      flagshipCode: flagshipCode.trim().toUpperCase(),
      indicatorName: body.indicatorName,
      indicatorTier: body.indicatorTier,
      indicatorValueType: body.indicatorValueType,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return;
    throw error;
  }
}

export async function createFlagshipKpi(
  flagshipId: number,
  body: CreateFlagshipKpiRequest,
): Promise<FlagshipKpi> {
  assertAccessToken();
  return api.post<FlagshipKpi>(`/api/flagships/${flagshipId}/kpis`, {
    ...body,
    verified: body.verified ?? false,
  });
}

/** Body for POST /api/flagships/{flagshipId}/investments. */
export interface CreateFlagshipInvestmentRequest {
  amount: number;
  currency: string;
  sourceType: string;
  funderId: number;
  investmentDate?: string | null;
  year?: number | null;
  disbursementType?: string | null;
  notes?: string | null;
}

export async function createFlagshipInvestment(
  flagshipId: number,
  body: CreateFlagshipInvestmentRequest,
): Promise<FlagshipInvestment> {
  assertAccessToken();
  return api.post<FlagshipInvestment>(`/api/flagships/${flagshipId}/investments`, body);
}

/** Body for POST /api/flagships/{flagshipId}/locations. */
export interface CreateFlagshipLocationRequest {
  province: string;
  district: string;
  sector?: string | null;
}

export async function createFlagshipLocation(
  flagshipId: number,
  body: CreateFlagshipLocationRequest,
): Promise<unknown> {
  assertAccessToken();
  return api.post(`/api/flagships/${flagshipId}/locations`, body);
}

export type UpdateFlagshipRequest = Partial<CreateFlagshipRequest>;

export async function updateFlagship(
  id: number,
  body: UpdateFlagshipRequest,
): Promise<FlagshipDetailResponse> {
  assertAccessToken();
  return api.put<FlagshipDetailResponse>(`/api/flagships/${id}`, body);
}

export async function deleteFlagship(id: number): Promise<void> {
  assertAccessToken();
  await api.delete(`/api/flagships/${id}`);
}
