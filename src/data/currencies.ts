import type { CurrencyCode, RateSnapshot } from '@/types';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: { en: string };
  fractionDigits: number;
  roundingIncrement: number;
}

// Safe metadata for every currency accepted by the public TypeScript API. Live rates and admin
// settings replace these values at startup, but formatting must also work during the initial render,
// tests, a slow settings request, or a temporary settings outage.

export let CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', name: { en: 'US dollar' }, fractionDigits: 2, roundingIncrement: 1 },
  EUR: { code: 'EUR', name: { en: 'Euro' }, fractionDigits: 2, roundingIncrement: 1 },
  GBP: { code: 'GBP', name: { en: 'British pound' }, fractionDigits: 2, roundingIncrement: 1 },
  INR: { code: 'INR', name: { en: 'Indian rupee' }, fractionDigits: 0, roundingIncrement: 100 },
};

export let CURRENCY_CODES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR'];

export let RATE_SNAPSHOT: RateSnapshot = {
  base: 'USD',
  rates: { USD: 1 } as Record<CurrencyCode, number>,
  asOf: new Date().toISOString().split('T')[0],
  illustrative: true,
};

/** Called by initSiteSettings after /api/settings resolves. */
export function syncCurrenciesFromSettings(
  currencies: Array<{ code: CurrencyCode; name: string; rate: number; fractionDigits: number; roundingIncrement?: number }>,
) {
  if (!currencies.length) return;
  CURRENCIES = Object.fromEntries(
    currencies.map((c) => [
      c.code,
      {
        code: c.code,
        name: { en: c.name },
        fractionDigits: c.fractionDigits,
        // Use server-configured increment when available; fall back for older API responses.
        roundingIncrement: c.roundingIncrement ?? (c.fractionDigits === 0 ? 100 : 1),
      },
    ]),
  ) as Record<CurrencyCode, CurrencyConfig>;
  CURRENCY_CODES = currencies.map((c) => c.code);
  RATE_SNAPSHOT = {
    base: 'USD',
    rates: Object.fromEntries(currencies.map((c) => [c.code, c.rate])) as Record<CurrencyCode, number>,
    asOf: new Date().toISOString().split('T')[0],
    illustrative: false,
  };
}
