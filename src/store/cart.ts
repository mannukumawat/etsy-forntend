import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_QTY_PER_LINE } from '@/config/store';
import type { CartLine } from '@/types';
import { normalizeCoupon } from '@/utils/pricing';

// Cart contents (ids + quantities only) persisted in localStorage.
// Prices are always derived from the catalogue, never stored, so they can't go stale or be tampered with.

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
  /** Adds up to `maxQuantity` total for the line. Returns how many were actually added. */
  addItem: (productId: string, variantId: string, quantity: number, maxQuantity: number) => number;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  restoreLine: (line: CartLine, index: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clear: () => void;
}

const same = (l: CartLine, productId: string, variantId: string) => l.productId === productId && l.variantId === variantId;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,

      addItem: (productId, variantId, quantity, maxQuantity) => {
        const existing = get().lines.find((l) => same(l, productId, variantId));
        const current = existing?.quantity ?? 0;
        const limit = Math.min(maxQuantity, MAX_QTY_PER_LINE);
        const next = Math.min(limit, current + Math.max(0, Math.floor(quantity)));
        const added = next - current;
        if (added <= 0) return 0;
        set((s) => ({
          lines: existing
            ? s.lines.map((l) => (same(l, productId, variantId) ? { ...l, quantity: next } : l))
            : [...s.lines, { productId, variantId, quantity: next, addedAt: new Date().toISOString() }],
        }));
        return added;
      },

      setQuantity: (productId, variantId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => !same(l, productId, variantId))
              : s.lines.map((l) => (same(l, productId, variantId) ? { ...l, quantity: Math.min(Math.floor(quantity), MAX_QTY_PER_LINE) } : l)),
        })),

      removeItem: (productId, variantId) => set((s) => ({ lines: s.lines.filter((l) => !same(l, productId, variantId)) })),

      restoreLine: (line, index) =>
        set((s) => {
          if (s.lines.some((l) => same(l, line.productId, line.variantId))) return s;
          const lines = [...s.lines];
          lines.splice(Math.min(index, lines.length), 0, line);
          return { lines };
        }),

      applyCoupon: (code) => set({ couponCode: normalizeCoupon(code) }),
      removeCoupon: () => set({ couponCode: null }),
      clear: () => set({ lines: [], couponCode: null }),
    }),
    {
      name: 'ys-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, couponCode }) => ({ lines, couponCode }),
      // Defensive: ignore malformed data from older versions or manual edits.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        const lines = Array.isArray(p.lines)
          ? p.lines.filter(
              (l): l is CartLine =>
                !!l && typeof l.productId === 'string' && typeof l.variantId === 'string' && Number.isInteger(l.quantity) && l.quantity > 0,
            )
          : [];
        return { ...current, lines, couponCode: typeof p.couponCode === 'string' ? p.couponCode : null };
      },
    },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((sum, l) => sum + l.quantity, 0);
