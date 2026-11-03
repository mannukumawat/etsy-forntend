import type { CurrencyCode, RateSnapshot } from '@/types';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: { en: string };
  fractionDigits: number;
  roundingIncrement: number;
}

// Populated from /api/settings at startup. Minimal USD-only default prevents crashes before the
// settings response arrives; the real values replace these as soon as initSiteSettings() resolves.

export let CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', name: { en: 'US dollar' }, fractionDigits: 2, roundingIncrement: 1 },
} as Record<CurrencyCode, CurrencyConfig>;

export let CURRENCY_CODES: CurrencyCode[] = ['USD'];

export let RATE_SNAPSHOT: RateSnapshot = {
  base: 'USD',
  rates: { USD: 1 } as Record<CurrencyCode, number>,
  asOf: '',
  illustrative: true,
};

/** Called by initSiteSettings after /api/settings resolves. */
export function syncCurrenciesFromSettings(
  currencies: Array<{ code: CurrencyCode; name: string; rate: number; fractionDigits: number }>,
) {
  if (!currencies.length) return;
  CURRENCIES = Object.fromEntries(
    currencies.map((c) => [
      c.code,
      {
        code: c.code,
        name: { en: c.name },
        fractionDigits: c.fractionDigits,
        roundingIncrement: c.fractionDigits === 0 ? 100 : 1,
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
