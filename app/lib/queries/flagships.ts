import { useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { countFunders, parseFunderNames } from "../flagship-funders";
import { ApiError, api } from "../api";
import { getAccessToken } from "../auth";

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
  budgetTotalRwf: number | null;
  funders: string | null;
  fundingContributions: FundingContribution[];
  lead: string;
  createdAt: string;
  investments: FlagshipInvestment[];
  kpis: FlagshipKpi[];
  locations: FlagshipLocation[];
}

/** Card grid / table row shape used by `FlagshipsList`. */
export interface FlagshipListItem {
  id: number;
  status: FlagshipStatus;
  title: string;
  code: string;
  cluster: string;
  jobsCreated: number;
  totalBudget: string;
  numberOfFunders: number;
  valueChain: string;
  progress: number;
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

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Plain number formatting — no currency code unless the API provides one separately. */
export function formatNumericAmount(amount: number): string {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
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
    totalBudget:
      detail.budgetTotalRwf != null && detail.budgetTotalRwf > 0
        ? formatNumericAmount(detail.budgetTotalRwf)
        : "—",
    numberOfFunders: funderCount,
    valueChain: detail.primaryValueChain?.trim() || "—",
    progress: Math.round(detail.progressPercent ?? 0),
    location: formatLocations(detail.locations),
    dateLabel: formatDateLabel(detail.createdAt),
    accentColor: getFlagshipCardAccent(cardIndex),
    funderNames,
    funderContributions: detail.fundingContributions ?? [],
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
    budgetTotalRwf: detail.budgetTotalRwf,
    funders: detail.funders,
    fundingContributions: detail.fundingContributions ?? [],
    lead: detail.implementingAgency ?? "—",
    createdAt: detail.createdAt,
    investments: detail.investments,
    kpis: detail.kpis,
    locations: detail.locations,
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

export const flagshipsQueryOptions = queryOptions({
  queryKey: ["flagships"],
  queryFn: ({ signal }) => fetchAllFlagships(signal),
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
  });

export const flagshipQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["flagships", id],
    queryFn: async ({ signal }) => mapDetailToFlagship(await fetchFlagshipDetail(id, signal)),
    enabled: Number.isFinite(id) && id > 0,
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

export function buildFlagshipTableRows(flagships: FlagshipDetailResponse[]): FlagshipTableRow[] {
  return flagships.map((item, index) => {
    const card = mapFlagshipToListItem(item, index);
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
      progress: `${card.progress}%`,
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
