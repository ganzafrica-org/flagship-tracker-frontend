import { queryOptions } from "@tanstack/react-query";

import { api } from "../api";
import { getAccessToken } from "../auth";

export interface ProfileResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
}

function assertAccessToken(): void {
  if (!getAccessToken()) {
    throw new Error("Missing access token. Please log in again.");
  }
}

export async function fetchProfile(signal?: AbortSignal): Promise<ProfileResponse> {
  assertAccessToken();
  return api.get<ProfileResponse>("/api/auth/me", undefined, signal);
}

export async function updateProfile(body: UpdateProfileRequest): Promise<ProfileResponse> {
  assertAccessToken();
  return api.patch<ProfileResponse>("/api/auth/profile", body);
}

export const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: ({ signal }) => fetchProfile(signal),
});
