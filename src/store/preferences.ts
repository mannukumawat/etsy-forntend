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

function detectInitialCountryAndCurrency(): { country: string; currency: CurrencyCode } {
  try {
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) {
      return { country: 'IN', currency: 'INR' };
    }
    if (tz.includes('London')) {
      return { country: 'GB', currency: 'GBP' };
    }
    if (tz.includes('Berlin') || tz.includes('Zurich') || tz.includes('Vienna')) {
      return { country: 'DE', currency: 'EUR' };
    }
    if (tz.includes('Paris')) {
      return { country: 'FR', currency: 'EUR' };
    }
    if (tz.includes('Rome')) {
      return { country: 'IT', currency: 'EUR' };
    }
    if (tz.includes('Madrid')) {
      return { country: 'ES', currency: 'EUR' };
    }
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) {
      return { country: 'CA', currency: 'CAD' };
    }
    if (tz.includes('Sydney') || tz.includes('Melbourne')) {
      return { country: 'AU', currency: 'AUD' };
    }
    if (tz.includes('Dubai')) {
      return { country: 'AE', currency: 'AED' };
    }
    if (tz.includes('Tokyo')) {
      return { country: 'JP', currency: 'JPY' };
    }
    if (tz.includes('Singapore')) {
      return { country: 'SG', currency: 'SGD' };
    }
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver')) {
      return { country: 'US', currency: 'USD' };
    }

    if (typeof navigator !== 'undefined') {
      const langs = navigator.languages ? [...navigator.languages] : [navigator.language || ''];
      for (const lang of langs) {
        if (!lang) continue;
        const parts = lang.split('-');
        if (parts.length > 1) {
          const region = parts[1].toUpperCase();
          if (region === 'IN') return { country: 'IN', currency: 'INR' };
          if (region === 'GB') return { country: 'GB', currency: 'GBP' };
          if (['DE', 'FR', 'IT', 'ES', 'NL', 'IE', 'PT', 'BE', 'AT', 'FI', 'GR'].includes(region)) {
            return { country: region, currency: 'EUR' };
          }
          if (region === 'CA') return { country: 'CA', currency: 'CAD' };
          if (region === 'AU') return { country: 'AU', currency: 'AUD' };
          if (region === 'US') return { country: 'US', currency: 'USD' };
        }
        if (lang.toLowerCase().startsWith('hi')) {
          return { country: 'IN', currency: 'INR' };
        }
      }
    }
  } catch {
    // ignore
  }

  return { country: 'IN', currency: 'INR' };
}

const initialPrefs = detectInitialCountryAndCurrency();

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: initialPrefs.currency,
      deliveryCountry: initialPrefs.country,
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
