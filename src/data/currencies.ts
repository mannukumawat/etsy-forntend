import type { CurrencyCode, RateSnapshot } from '@/types';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: { en: string };
  /** Digits shown after the decimal point. */
  fractionDigits: number;
  /** Converted amounts are rounded to a multiple of this many minor units (INR rounds to whole rupees). */
  roundingIncrement: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', name: { en: 'US dollar' }, fractionDigits: 2, roundingIncrement: 1 },
  INR: { code: 'INR', name: { en: 'Indian rupee' }, fractionDigits: 0, roundingIncrement: 100 },
  EUR: { code: 'EUR', name: { en: 'Euro' }, fractionDigits: 2, roundingIncrement: 1 },
  GBP: { code: 'GBP', name: { en: 'British pound' }, fractionDigits: 2, roundingIncrement: 1 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/**
 * Illustrative, fixed conversion rates — NOT live market rates.
 * Phase 2: fetch from the backend, which should own the rate source and snapshot it per order.
 */
export const RATE_SNAPSHOT: RateSnapshot = {
  base: 'USD',
  rates: { USD: 1, INR: 84, EUR: 0.92, GBP: 0.78 },
  asOf: '2026-10-01',
  illustrative: true,
};
