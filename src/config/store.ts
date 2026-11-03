// Store-level settings. Live values come from /api/settings via the siteSettings store.
// These constants are UI defaults that don't belong in the backend.

import { useSiteSettings } from '@/store/siteSettings';

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_QTY_PER_LINE = 10;

/** Read the live store identity from the settings API. */
export function getStore() {
  return useSiteSettings.getState().store;
}
