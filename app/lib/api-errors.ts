/** Parsed JSON body from 400/409 API responses. */
export interface ApiErrorBody {
  error?: string;
  errors?: Record<string, string>;
}

export function parseApiErrorBody(raw: string): ApiErrorBody {
  try {
    return JSON.parse(raw) as ApiErrorBody;
  } catch {
    return { error: raw };
  }
}

export function formatApiErrorMessage(raw: string): string {
  const body = parseApiErrorBody(raw);
  if (body.error) return body.error;
  if (body.errors) {
    return Object.entries(body.errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join("; ");
  }
  return raw || "Request failed";
}
