export type DemoUserRole = "admin" | "me" | "senior";

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: DemoUserRole;
}

export const DEMO_USERS: DemoUser[] = [
  {
    email: "dearankara3@gmail.com",
    password: "Password123!",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "jeannine.uwase@gmail.com",
    password: "Password123!",
    name: "Jeannine Uwase",
    role: "me",
  },
  {
    email: "jeannineuwasee@gmail.com",
    password: "Password123!",
    name: "Senior Official",
    role: "senior",
  },
];

const STORAGE_KEY = "flagship-demo-user";
const PASSWORD_OVERRIDES_KEY = "flagship-demo-password-overrides";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getRoleHomePath(role: DemoUserRole) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "me":
      return "/me/flagships";
    case "senior":
      return "/senior/dashboard";
  }
}

export function findDemoUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const expectedPassword = getPasswordOverride(normalizedEmail) ?? DEMO_USERS.find((u) => u.email === normalizedEmail)?.password;
  if (!expectedPassword) return null;
  if (expectedPassword !== password) return null;
  return DEMO_USERS.find((user) => user.email === normalizedEmail) ?? null;
}

export function setPasswordOverride(email: string, newPassword: string) {
  const normalizedEmail = normalizeEmail(email);
  if (typeof window === "undefined") return;

  const current = getAllPasswordOverrides();
  const next = { ...current, [normalizedEmail]: newPassword };
  window.localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(next));
}

function getAllPasswordOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(PASSWORD_OVERRIDES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function getPasswordOverride(email: string) {
  const overrides = getAllPasswordOverrides();
  return overrides[email] ?? null;
}

export function getStoredDemoUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DemoUser;
    return DEMO_USERS.find((user) => user.email === parsed.email && user.role === parsed.role) ?? null;
  } catch {
    return null;
  }
}

export function storeDemoUser(user: DemoUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredDemoUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
