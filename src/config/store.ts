// Store-level settings. Live values come from /api/settings via the siteSettings store.
// These constants are UI defaults that don't belong in the backend.

import { useSiteSettings } from '@/store/siteSettings';

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;
/** Fallback per-line quantity cap, used only until the live settings have loaded. */
export const MAX_QTY_PER_LINE = 10;

/** Read the live store identity from the settings API. */
export function getStore() {
  return useSiteSettings.getState().store;
}

/**
 * Maximum quantity per cart line from the live store settings (admin-editable,
 * GET /api/settings → store.maxQtyPerLine). Falls back to MAX_QTY_PER_LINE while the
 * settings have not loaded yet — the same default the backend seeds.
 */
export function getMaxQtyPerLine(): number {
  const value = useSiteSettings.getState().store.maxQtyPerLine;
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? value : MAX_QTY_PER_LINE;
}
