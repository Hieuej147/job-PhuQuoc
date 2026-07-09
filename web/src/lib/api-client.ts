export function unwrapApiPayload<T = unknown>(body: unknown): T {
  const payload = body as { data?: unknown } | null | undefined;
  const nested = payload?.data as { data?: unknown } | null | undefined;
  return (nested?.data ?? payload?.data ?? body) as T;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function getErrorMessage(body: any, fallback: string) {
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.data?.message === "string") return body.data.message;
  if (typeof body?.error === "string") return body.error;
  return fallback;
}

function getErrorCode(body: any) {
  const message = body?.message;
  return body?.code ?? body?.data?.code ?? (typeof message === "object" ? message?.code : undefined);
}

function getErrorDetails(body: any) {
  const message = body?.message;
  return body?.details ?? body?.data?.details ?? (typeof message === "object" ? message?.details ?? message : undefined);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: options.credentials ?? "include",
    headers:
      options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
  });
  const body = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(body, `Request failed: ${response.status}`), {
      status: response.status,
      code: getErrorCode(body),
      details: getErrorDetails(body),
    });
  }

  return unwrapApiPayload<T>(body);
}

export function apiGet<T>(path: string, options: RequestInit = {}) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options: RequestInit = {}) {
  return apiRequest<T>(path, {
    ...options,
    method: "POST",
    body: body === undefined || body instanceof FormData ? (body as BodyInit | undefined) : JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body?: unknown, options: RequestInit = {}) {
  return apiRequest<T>(path, {
    ...options,
    method: "PATCH",
    body: body === undefined || body instanceof FormData ? (body as BodyInit | undefined) : JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string, options: RequestInit = {}) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}
