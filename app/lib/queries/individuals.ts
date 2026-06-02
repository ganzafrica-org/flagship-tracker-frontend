import { queryOptions } from "@tanstack/react-query";

import { api, ApiError } from "../api";
import { getAccessToken } from "../auth";

export interface IndividualsPageItem {
  individualId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  sex: string;
  youthCategory: string | null;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  registrationSource: string;
  flagshipNames: string[];
  createdAt: string;
}

export interface IndividualsPageResponse {
  content: IndividualsPageItem[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface IndividualFlagshipRelation {
  flagshipId: number;
  participationType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active?: boolean | null;
  notes?: string | null;
}

export interface IndividualDetailResponse extends IndividualsPageItem {
  nationalId?: string | null;
  dateOfBirth?: string | null;
  programEntryAge?: number | null;
  educationLevel?: string | null;
  disabilityStatus?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  flagships?: IndividualFlagshipRelation[];
  cooperatives?: unknown[];
  valueChains?: unknown[];
  employments?: unknown[];
  landAccess?: unknown[];
  productionRecords?: unknown[];
  interventions?: unknown[];
  constraintFeedback?: unknown[];
}

export interface CreateIndividualRequest {
  nationalId?: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth?: string;
  programEntryAge?: number;
  youthCategory?: string;
  educationLevel?: string;
  disabilityStatus?: boolean;
  registrationSource: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateIndividualRequest extends Partial<CreateIndividualRequest> {
  flagships?: unknown[];
  cooperatives?: unknown[];
  valueChains?: unknown[];
  employments?: unknown[];
  landAccess?: unknown[];
  productionRecords?: unknown[];
  interventions?: unknown[];
  constraintFeedback?: unknown[];
}

function assertAccessToken(): void {
  if (!getAccessToken()) {
    throw new ApiError(401, "Unauthorized", "Missing access token. Please log in again.");
  }
}

export async function fetchAllIndividuals(signal?: AbortSignal): Promise<IndividualsPageItem[]> {
  assertAccessToken();
  const all: IndividualsPageItem[] = [];
  let cursor: string | undefined;

  do {
    const page = await api.get<IndividualsPageResponse>(
      "/api/individuals",
      { cursor },
      signal,
    );
    all.push(...page.content);
    cursor = page.hasNext && page.nextCursor ? page.nextCursor : undefined;
  } while (cursor);

  return all;
}

export async function fetchIndividualById(id: number, signal?: AbortSignal): Promise<IndividualDetailResponse> {
  assertAccessToken();
  return api.get<IndividualDetailResponse>(`/api/individuals/${id}`, undefined, signal);
}

export async function createIndividual(body: CreateIndividualRequest): Promise<IndividualDetailResponse> {
  assertAccessToken();
  return api.post<IndividualDetailResponse>("/api/individuals", body);
}

export async function updateIndividual(id: number, body: UpdateIndividualRequest): Promise<IndividualDetailResponse> {
  assertAccessToken();
  return api.patch<IndividualDetailResponse>(`/api/individuals/${id}`, body);
}

export async function deleteIndividual(id: number): Promise<void> {
  assertAccessToken();
  await api.delete(`/api/individuals/${id}`);
}

export const individualsQueryOptions = queryOptions({
  queryKey: ["individuals"],
  queryFn: ({ signal }) => fetchAllIndividuals(signal),
});

export const individualQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["individuals", id],
    queryFn: ({ signal }) => fetchIndividualById(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
