const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const USER_KEY = "flagship_user";

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

// User info stored in localStorage (no tokens — tokens live in httpOnly cookies set by backend)

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

// Auth API calls — credentials:include so backend cookies are sent/received automatically

async function authFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  return authFetch<LoginResponse>("/api/auth/login", { email, password });
}

export function logout() {
  return authFetch<{ message: string }>("/api/auth/logout", {});
}

export function forgotPassword(email: string) {
  return authFetch<{ message: string }>("/api/auth/forgot-password", { email });
}

export function resendCode(email: string) {
  return authFetch<{ message: string }>("/api/auth/resend-code", { email });
}

export function verifyCode(email: string, code: string) {
  return authFetch<{ resetToken: string }>("/api/auth/verify-code", { email, code });
}

export function resetPassword(resetToken: string, newPassword: string) {
  return authFetch<{ message: string }>("/api/auth/reset-password", { resetToken, newPassword });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<{ message: string }>("/api/auth/change-password", { currentPassword, newPassword });
}
