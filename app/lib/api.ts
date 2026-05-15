const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, response.statusText, text);
  }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { params, body, signal } = options;
  const url = buildUrl(path, params);

  const headers: HeadersInit = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    credentials: "include",
  });

  return handleResponse<T>(response);
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) =>
    request<T>("GET", path, { params, signal }),

  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("POST", path, { body, signal }),

  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("PUT", path, { body, signal }),

  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("PATCH", path, { body, signal }),

  delete: <T>(path: string, signal?: AbortSignal) =>
    request<T>("DELETE", path, { signal }),
};
