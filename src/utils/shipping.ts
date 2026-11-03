import { getCountryZone, isShippingSupported as _isSupported } from '@/data/countries';
import type { CurrencyCode, RateSnapshot, ShippingMethodId, ShippingQuote } from '@/types';
import { convertFromBase } from './money';

export function isShippingSupported(countryCode: string | undefined | null): boolean {
  return _isSupported(countryCode);
}

/** Shipping quotes from /api/settings zones, converted to display currency. Null = unsupported. */
export function getShippingQuotes(countryCode: string | undefined | null, currency: CurrencyCode, snapshot: RateSnapshot): ShippingQuote[] | null {
  const zone = getCountryZone(countryCode);
  if (!zone) return null;
  const methods = (['standard', 'express'] as const).filter((id) => zone[id].enabled);
  return methods.map((id) => ({
    id,
    amount: convertFromBase(zone[id].rate, currency, snapshot),
    minDays: zone[id].minDays,
    maxDays: zone[id].maxDays,
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
