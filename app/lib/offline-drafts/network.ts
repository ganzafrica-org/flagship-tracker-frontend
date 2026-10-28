import { API_BASE_URL } from "~/lib/api";

/**
 * True when `error` came from a failed `fetch()` call itself (DNS/connection refused/offline),
 * as opposed to `ApiError` (server reached, but rejected the request) or anything else. The fetch
 * spec throws a plain `TypeError` for network failures — browsers vary the message
 * ("Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource…") but the
 * type is consistent, so that's what this checks instead of matching message text.
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

/** Cheap reachability probe — used before showing a "back online" prompt, not before every submit. */
export async function checkReachability(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
