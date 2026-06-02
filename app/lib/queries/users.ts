import { queryOptions } from "@tanstack/react-query";
import { api, API_BASE_URL, ApiError } from "~/lib/api";

export type UserRole = "ADMIN" | "SENIOR" | "MONITORING_OFFICER";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface UserPageResponse {
  content: User[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: UserRole;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export const usersQueryOptions = (params?: { cursor?: string; search?: string; role?: string }) =>
  queryOptions({
    queryKey: ["users", params ?? {}],
    queryFn: ({ signal }) => api.get<UserPageResponse>("/api/users", params, signal),
  });

/**
 * CSV import is multipart/form-data, which the JSON `api` client can't build —
 * so we use a dedicated fetch here. Backend expects field name `file`.
 */
export async function importUsersCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/users/import`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, response.statusText, text);
  }
  return response.json() as Promise<ImportResult>;
}
