const TOKEN_KEY = 'taskflow.token';
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// localStorage can throw (private mode, blocked storage); auth then lasts for the tab only.
let memoryToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? memoryToken;
    } catch {
      return memoryToken;
    }
  },
  set(token: string): void {
    memoryToken = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* keep the in-memory copy */
    }
  },
  clear(): void {
    memoryToken = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

let unauthorizedHandler: (() => void) | undefined;

/** Called when an authenticated request comes back 401, e.g. an expired token. */
export function onUnauthorized(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler;
}

type QueryValue = string | number | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_BASE}/api${path}${search ? `?${search}` : ''}`;
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? null : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) unauthorizedHandler?.();
    const error = (payload as ErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? `Request failed with status ${String(response.status)}`,
      error?.details,
    );
  }
  return payload as T;
}
