import { ApiError } from '@/services/api';
import i18n from 'i18next';
import { contentLanguage, toLanguageCode } from '@/utils/money';
import { API_BASE_URL, API_MODE, API_TIMEOUT_MS } from './config';

// The single HTTP client for this app. Built on fetch (no second HTTP library), it owns:
//   - joining the base URL with relative paths, keeping the /api prefix exactly once
//   - cookie credentials, so a future customer session works without touching call sites
//   - JSON vs FormData bodies (FormData must set its own multipart boundary)
//   - timeouts and caller cancellation
//   - turning every failure into one ApiError shape the services already expect

export interface RequestOptions {
  /** Query parameters; undefined/null/'' entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON body, or FormData for uploads. */
  body?: unknown;
  /** Caller cancellation (e.g. a component unmounting). Combined with the internal timeout. */
  signal?: AbortSignal;
  /** Override the default timeout; 0 disables it. */
  timeoutMs?: number;
  /** Skip the session-expiry hook. Used by the customer auth endpoints themselves. */
  skipAuthHandler?: boolean;
  /** Extra headers for this one call — e.g. the guest order access token (never put in a URL/query
   *  string: that risks it ending up in server logs, analytics, or a Referer header). */
  headers?: Record<string, string>;
}

// --- session expiry --------------------------------------------------------------------------------
// Registered once by the app shell. A 401 from anywhere EXCEPT the auth endpoints themselves means the
// customer's session cookie has expired or was revoked — sign them out locally without a redirect loop
// (re-entrancy guarded, since signing out can itself trigger requests that might also 401).

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

function handleUnauthorized() {
  if (!onUnauthorized || handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    onUnauthorized();
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false;
    }, 0);
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; issues?: Array<{ path: string; message: string }> };
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (/^https?:\/\//i.test(path)) throw new ApiError('network', 'Call the API with a relative path, not an absolute URL.');
  // Guard the "/api twice" mistake: the base URL is an origin, paths carry the /api prefix.
  const relative = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${relative}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function toApiError(status: number, parsed: unknown): ApiError {
  const body = (parsed as ApiErrorBody | null)?.error;
  const code = body?.code ?? (status === 401 ? 'unauthorized' : status === 404 ? 'not_found' : 'network');
  const message = body?.message ?? (status === 404 ? 'Not found.' : `The store API returned ${status}.`);
  return new ApiError(code, message, body?.issues ?? []);
}

const CSRF_COOKIE = 'ys_csrf';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_MODE) throw new ApiError('network', 'API mode is off (VITE_API_BASE_URL is not set).');

  const { body, signal, timeoutMs = API_TIMEOUT_MS } = options;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  // The backend double-submits this cookie as a header on every mutating request from a signed-in
  // session (see backend/src/csrf.ts) — a no-op before any session cookie/csrf cookie exists yet.
  const csrfToken = MUTATING_METHODS.has(method) ? readCookie(CSRF_COOKIE) : null;
  const contentLang = method === 'GET' ? contentLanguage(toLanguageCode(i18n.language)) : null;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      // Centralised so no call site deals with cookies. The backend allows this origin explicitly.
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        // Deliberately NOT set for FormData: the browser must add its own multipart boundary.
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        // Asks the API to add translations of store content for the shopper's language.
        ...(contentLang ? { 'x-lang': contentLang } : {}),
        ...options.headers,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (signal?.aborted) throw new ApiError('cancelled', 'Request cancelled.');
    if ((e as Error)?.name === 'AbortError') throw new ApiError('timeout', 'The store API took too long to respond.');
    throw new ApiError('network', `Can’t reach the store API at ${API_BASE_URL}. Is the backend running?`);
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuthHandler) handleUnauthorized();
    throw toApiError(response.status, parsed);
  }
  return parsed as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body: body ?? {} }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
