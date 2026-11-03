// The ONE place this app reads its backend URL. Nothing else should touch import.meta.env for the API,
// and no module should hard-code a backend origin.
//
// API mode is explicit: on only when VITE_API_BASE_URL is set. When it is on there is no silent
// fallback to bundled sample data — a failing backend surfaces a real error instead.

const RAW = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';

/** Backend origin without a trailing slash, e.g. "http://localhost:4000". Empty in mock mode. */
export const API_BASE_URL = RAW.replace(/\/+$/, '');

/** Unit tests exercise the in-memory services, so API mode is always off under Vitest. */
export const API_MODE = API_BASE_URL.length > 0 && import.meta.env?.MODE !== 'test';

/** How long a request may run before it is aborted. */
export const API_TIMEOUT_MS = 15_000;

/**
 * Images are served by Express from `/media/:id`, which sits OUTSIDE the `/api` prefix, so it is built
 * from the origin directly. The API already returns absolute image URLs; this helper is for the rare
 * case where only an id is known.
 */
export const mediaUrl = (id: string) => `${API_BASE_URL}/media/${encodeURIComponent(id)}`;

/** Human-readable label for the storefront footer. */
export const apiModeLabel = () => (API_MODE ? `Catalogue: live store API (${API_BASE_URL})` : 'API not configured');
