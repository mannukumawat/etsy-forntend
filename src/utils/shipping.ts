import { getCountry, SHIPPING_ZONES } from '@/data/countries';
import type { CurrencyCode, RateSnapshot, ShippingMethodId, ShippingQuote } from '@/types';
import { convertFromBase } from './money';

export function isShippingSupported(countryCode: string | undefined | null): boolean {
  return !!getCountry(countryCode)?.zone;
}

/** Illustrative shipping quotes for a destination, converted to the display currency. Null = unsupported. */
export function getShippingQuotes(countryCode: string | undefined | null, currency: CurrencyCode, snapshot: RateSnapshot): ShippingQuote[] | null {
  const zone = getCountry(countryCode)?.zone;
  if (!zone) return null;
  const rates = SHIPPING_ZONES[zone];
  return (['standard', 'express'] as const).map((id) => ({
    id,
    amount: convertFromBase(rates[id].price, currency, snapshot),
    minDays: rates[id].minDays,
    maxDays: rates[id].maxDays,
  }));
}

export function getShippingQuote(
  countryCode: string | undefined | null,
  method: ShippingMethodId,
  currency: CurrencyCode,
  snapshot: RateSnapshot,
): ShippingQuote | null {
  return getShippingQuotes(countryCode, currency, snapshot)?.find((q) => q.id === method) ?? null;
}

/** Demo-only tax estimate for a destination. Real tax/duty rules belong to the future backend configuration. */
export function getDemoTaxRate(countryCode: string | undefined | null): number {
  return getCountry(countryCode)?.demoTaxRate ?? 0;
}
