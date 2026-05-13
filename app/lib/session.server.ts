import { createCookieSessionStorage } from "react-router";

export type UserRole = "ADMIN" | "SENIOR" | "MONITORING_OFFICER";

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}

const SESSION_SECRET = process.env.SESSION_SECRET ?? "flagship-tracker-dev-secret-change-in-prod";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "__flagship_session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches refresh token lifetime
    secrets: [SESSION_SECRET],
  },
});

export { getSession, commitSession, destroySession };

// Token cookies (separate short-lived cookie for access token)

const tokenStorage = createCookieSessionStorage({
  cookie: {
    name: "__flagship_tokens",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secrets: [SESSION_SECRET],
  },
});

export const getTokenSession = tokenStorage.getSession;
export const commitTokenSession = tokenStorage.commitSession;
export const destroyTokenSession = tokenStorage.destroySession;

// Helpers

export async function getUserFromSession(request: Request): Promise<SessionUser | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user") as SessionUser | undefined;
  return user ?? null;
}

export async function getTokensFromSession(request: Request): Promise<{ accessToken: string; refreshToken: string } | null> {
  const session = await getTokenSession(request.headers.get("Cookie"));
  const accessToken = session.get("accessToken") as string | undefined;
  const refreshToken = session.get("refreshToken") as string | undefined;
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "SENIOR": return "/senior/dashboard";
    case "MONITORING_OFFICER": return "/me/flagships";
  }
}

// Maps backend role to the layout prefix used in routes
export function getRolePrefix(role: UserRole): "admin" | "senior" | "me" {
  switch (role) {
    case "ADMIN": return "admin";
    case "SENIOR": return "senior";
    case "MONITORING_OFFICER": return "me";
  }
}
