const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const USER_KEY = "flagship_user";
const ACCESS_TOKEN_KEY = "flagship_access_token";

export type UserRole = "ADMIN" | "SENIOR" | "MONITORING_OFFICER";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresIn: number;
  user: AuthUser;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(accessToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
  clearAccessToken();
}

/** Both profile and JWT must be present (Swagger sends Bearer; API returns 403 without it). */
export function hasValidSession(): boolean {
  return Boolean(getStoredUser() && getAccessToken());
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "SENIOR": return "/senior/dashboard";
    case "MONITORING_OFFICER": return "/me/flagships";
  }
}

export function getRolePrefix(role: UserRole): "admin" | "senior" | "me" {
  switch (role) {
    case "ADMIN": return "admin";
    case "SENIOR": return "senior";
    case "MONITORING_OFFICER": return "me";
  }
}

async function authFetch<T>(path: string, body: unknown, options?: { auth?: boolean }): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = options?.auth !== false ? getAccessToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;

  if (!res.ok) {
    throw new AuthError((data.error as string) ?? `Request failed: ${res.status}`, res.status, data);
  }

  return data as T;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function login(email: string, password: string) {
  return authFetch<LoginResponse>("/api/auth/login", { email, password }, { auth: false });
}

export function logout() {
  return authFetch<{ message: string }>("/api/auth/logout", {});
}

export function forgotPassword(email: string) {
  return authFetch<{ message: string }>("/api/auth/forgot-password", { email }, { auth: false });
}

export function resendCode(email: string) {
  return authFetch<{ message: string }>("/api/auth/resend-code", { email }, { auth: false });
}

export function verifyCode(email: string, code: string) {
  return authFetch<{ resetToken: string }>("/api/auth/verify-code", { email, code }, { auth: false });
}

export function resetPassword(resetToken: string, newPassword: string) {
  return authFetch<{ message: string }>("/api/auth/reset-password", { resetToken, newPassword }, { auth: false });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<{ message: string }>("/api/auth/change-password", { currentPassword, newPassword });
}
