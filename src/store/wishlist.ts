import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { WishlistItem } from '@/types';
import { API_MODE, customerApi } from '@/api';

// Anonymous (signed-out) wishlist stays local-only, exactly as before — persisted to localStorage,
// per-device. Once a customer signs in, `setAccount` switches the SAME store to the backend: items
// are loaded from (and every change written to) the account's server-side wishlist instead, so it
// follows the customer across devices. `toggle`/`remove` still update local state synchronously
// (every existing caller depends on that), firing the server write in the background.

interface WishlistState {
  items: WishlistItem[];
  /** Signed-in customer id, or null for the anonymous/local-only wishlist. Set by store/session.ts. */
  accountId: string | null;
  has: (productId: string) => boolean;
  /** Returns true when the product is now saved. */
  toggle: (productId: string, variantId?: string) => boolean;
  remove: (productId: string) => void;
  setAccount: (id: string | null) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      accountId: null,
      has: (productId) => get().items.some((i) => i.productId === productId),
      toggle: (productId, variantId) => {
        const wasSaved = get().has(productId);
        if (wasSaved) set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
        else set((s) => ({ items: [{ productId, variantId, addedAt: new Date().toISOString() }, ...s.items] }));

        if (API_MODE && get().accountId) {
          customerApi.toggleWishlist(productId, variantId).catch(() => {
            // Best-effort sync: local state already reflects the user's intent; a failed background
            // write will be reconciled on the next full load (sign-in, refresh, or wishlist page visit).
          });
        }
        return !wasSaved;
      },
      remove: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
        if (API_MODE && get().accountId) {
          customerApi.removeWishlistItem(productId).catch(() => {});
        }
      },
      setAccount: (id) => {
        set({ accountId: id });
        if (!id) {
          set({ items: [] });
          return;
        }
        if (API_MODE) {
          customerApi
            .fetchWishlist()
            .then((items) => set({ items }))
            .catch(() => {});
        }
      },
    }),
    {
      name: 'ys-wishlist',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // The signed-in (account-backed) wishlist is never persisted to this device's localStorage —
      // only the anonymous list is, so signing out never leaks one account's saved items to the next.
      partialize: (s) => (s.accountId ? { items: [] } : { items: s.items }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WishlistState>;
        const items = Array.isArray(p.items) ? p.items.filter((i): i is WishlistItem => !!i && typeof i.productId === 'string') : [];
        return { ...current, items };
      },
    },
  ),
);
