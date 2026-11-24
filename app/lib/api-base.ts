function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

/**
 * API origin for this browser.
 * A localhost value is only used when the page itself is open on localhost.
 * A hosted page keeps its own host, even if the build baked in the local default.
 */
export function getApiBaseUrl(): string {
  const configured = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (typeof window === "undefined") {
    return configured || "http://localhost:8080";
  }
  if (!configured) return window.location.origin;
  try {
    const configuredHost = new URL(configured).hostname;
    if (isLocalHost(configuredHost) && !isLocalHost(window.location.hostname)) {
      return window.location.origin;
    }
  } catch {
    return window.location.origin;
  }
  return configured;
}
