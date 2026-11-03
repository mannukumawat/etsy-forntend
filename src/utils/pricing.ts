import type { CartTotals, CurrencyCode, Minor, RateSnapshot } from '@/types';
import { convertFromBase, roundMinor } from './money';

// Client-side price calculations for cart display. Server recomputes authoritatively at checkout.

export interface PricingLine {
  unitBase: Minor;
  quantity: number;
}

export function normalizeCoupon(code: string | undefined | null): string {
  return (code ?? '').trim().toUpperCase();
}

export function lineTotal(unitBase: Minor, quantity: number, currency: CurrencyCode, snapshot: RateSnapshot): Minor {
  return convertFromBase(unitBase, currency, snapshot) * quantity;
}

export interface TotalsInput {
  lines: PricingLine[];
  currency: CurrencyCode;
  snapshot: RateSnapshot;
  couponCode?: string | null;
  shipping: Minor | null;
  taxRate: number;
}

export function calculateTotals({ lines, currency, snapshot, shipping, taxRate }: TotalsInput): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l.unitBase, l.quantity, currency, snapshot), 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const discount = 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = roundMinor(taxable * taxRate, currency);
  const total = taxable + (shipping ?? 0) + tax;
  return { currency, itemCount, subtotal, discount, shipping, tax, taxRate, total };
}
