const RESET_STORAGE_KEY = "flagship-demo-password-reset";
const VERIFIED_STORAGE_KEY = "flagship-demo-password-reset-verified";

export type DemoResetRecord = {
  email: string;
  code: string;
  createdAt: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const code = "123456";

  if (typeof window !== "undefined") {
    const record: DemoResetRecord = { email: normalizedEmail, code, createdAt: Date.now() };
    window.localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(record));
  }

  return { email: normalizedEmail, code };
}

export function getLatestPasswordReset() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(RESET_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DemoResetRecord;
  } catch {
    return null;
  }
}

export function verifyPasswordResetCode(email: string, code: string) {
  const record = getLatestPasswordReset();
  if (!record) return false;

  return record.email === normalizeEmail(email) && record.code === code.trim();
}

export function markPasswordResetVerified(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VERIFIED_STORAGE_KEY, JSON.stringify({ email: normalizedEmail, verifiedAt: Date.now() }));
}

export function getVerifiedResetEmail() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(VERIFIED_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email: string; verifiedAt: number };
    return parsed.email ?? null;
  } catch {
    return null;
  }
}

export function clearPasswordResetVerified() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VERIFIED_STORAGE_KEY);
}

