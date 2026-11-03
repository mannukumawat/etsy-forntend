import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CURRENCY_CODES } from '@/data/currencies';
import { getCountry } from '@/data/countries';
import type { CurrencyCode } from '@/types';

// Non-sensitive preferences, persisted in localStorage. Language is persisted by i18n (see i18n/index.ts).

interface PreferencesState {
  currency: CurrencyCode;
  /** Destination used for delivery estimates before checkout. */
  deliveryCountry: string;
  setCurrency: (currency: CurrencyCode) => void;
  setDeliveryCountry: (code: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: 'USD',
      deliveryCountry: 'IN',
      setCurrency: (currency) => set({ currency }),
      setDeliveryCountry: (deliveryCountry) => set({ deliveryCountry }),
    }),
    {
      name: 'ys-prefs',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ currency, deliveryCountry }) => ({ currency, deliveryCountry }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PreferencesState>;
        return {
          ...current,
          currency: p.currency && CURRENCY_CODES.includes(p.currency) ? p.currency : current.currency,
          deliveryCountry: p.deliveryCountry && getCountry(p.deliveryCountry) ? p.deliveryCountry : current.deliveryCountry,
        };
      },
    },
  ),
);
