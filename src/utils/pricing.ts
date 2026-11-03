import { DEMO_COUPON } from '@/config/store';
import type { CartTotals, CurrencyCode, Minor, RateSnapshot } from '@/types';
import { convertFromBase, percentOf, roundMinor } from './money';

// Pure price calculations shared by cart, checkout and the mock order service.
// Phase 2: the server must recompute all of this from its own catalogue — never trust client totals.

export interface PricingLine {
  /** Effective unit price in base currency minor units. */
  unitBase: Minor;
  quantity: number;
}

export function normalizeCoupon(code: string | undefined | null): string {
  return (code ?? '').trim().toUpperCase();
}

export function isValidCoupon(code: string | undefined | null): boolean {
  return normalizeCoupon(code) === DEMO_COUPON.code;
}

export function couponDiscount(code: string | undefined | null, subtotal: Minor, currency: CurrencyCode): Minor {
  if (!isValidCoupon(code) || subtotal <= 0) return 0;
  return Math.min(subtotal, percentOf(subtotal, DEMO_COUPON.percentOff, currency));
}

/** Unit price converted once, then multiplied — keeps line totals and the subtotal consistent. */
export function lineTotal(unitBase: Minor, quantity: number, currency: CurrencyCode, snapshot: RateSnapshot): Minor {
  return convertFromBase(unitBase, currency, snapshot) * quantity;
}

export interface TotalsInput {
  lines: PricingLine[];
  currency: CurrencyCode;
  snapshot: RateSnapshot;
  couponCode?: string | null;
  /** Shipping in display-currency minor units, or null when not yet known. */
  shipping: Minor | null;
  /** Illustrative tax rate (0–1) for the destination. */
  taxRate: number;
}

export function calculateTotals({ lines, currency, snapshot, couponCode, shipping, taxRate }: TotalsInput): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l.unitBase, l.quantity, currency, snapshot), 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const discount = couponDiscount(couponCode, subtotal, currency);
  const taxable = Math.max(0, subtotal - discount);
  const tax = roundMinor(taxable * taxRate, currency);
  const total = taxable + (shipping ?? 0) + tax;
  return { currency, itemCount, subtotal, discount, shipping, tax, taxRate, total };
}
