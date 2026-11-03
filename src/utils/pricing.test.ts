import { describe, expect, it } from 'vitest';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { convertFromBase, formatMoney, majorToBaseMinor, roundMinor } from './money';
import { calculateTotals, couponDiscount, isValidCoupon, lineTotal } from './pricing';
import { getShippingQuote, getShippingQuotes } from './shipping';

describe('money', () => {
  it('converts base USD to each currency with consistent rounding', () => {
    expect(convertFromBase(2800, 'USD', RATE_SNAPSHOT)).toBe(2800);
    expect(convertFromBase(2800, 'EUR', RATE_SNAPSHOT)).toBe(2576); // 28 * 0.92
    expect(convertFromBase(2800, 'GBP', RATE_SNAPSHOT)).toBe(2184); // 28 * 0.78
    expect(convertFromBase(2800, 'INR', RATE_SNAPSHOT)).toBe(235200); // ₹2,352 (whole rupees)
  });

  it('rounds INR to whole rupees and other currencies to minor units', () => {
    expect(roundMinor(12345, 'INR')).toBe(12300);
    expect(roundMinor(12350, 'INR')).toBe(12400);
    expect(roundMinor(1234.5, 'USD')).toBe(1235);
  });

  it('converts display major amounts back to base minor units', () => {
    expect(majorToBaseMinor(84, 'INR', RATE_SNAPSHOT)).toBe(100);
  });

  it('formats with Intl and the currency’s fraction digits', () => {
    expect(formatMoney(235200, 'INR', 'en-US')).toBe('₹2,352');
    expect(formatMoney(2576, 'EUR', 'en-US')).toBe('€25.76');
    expect(formatMoney(2800, 'USD', 'en-US', 'code')).toMatch(/USD\s?28\.00/);
    // Each UI language uses its own number format (German: comma decimals, no-break space before €).
    expect(formatMoney(2576, 'EUR', 'de').replace(/\s/g, ' ')).toBe('25,76 €');
    expect(formatMoney(235200, 'INR', 'en-IN')).toBe('₹2,352');
  });
});

describe('totals', () => {
  const lines = [
    { unitBase: 2800, quantity: 2 }, // mug
    { unitBase: 2600, quantity: 1 }, // bowl on sale
  ];

  it('sums converted line totals so lines and subtotal always agree', () => {
    const t = calculateTotals({ lines, currency: 'EUR', snapshot: RATE_SNAPSHOT, shipping: null, taxRate: 0 });
    const expected = lineTotal(2800, 2, 'EUR', RATE_SNAPSHOT) + lineTotal(2600, 1, 'EUR', RATE_SNAPSHOT);
    expect(t.subtotal).toBe(expected);
    expect(t.itemCount).toBe(3);
    expect(t.total).toBe(expected);
  });

  it('applies the documented demo coupon (case-insensitive) and rejects others', () => {
    expect(isValidCoupon(' welcome10 ')).toBe(true);
    expect(isValidCoupon('WELCOME20')).toBe(false);
    expect(couponDiscount('WELCOME10', 8200, 'USD')).toBe(820);
    expect(couponDiscount('NOPE', 8200, 'USD')).toBe(0);
  });

  it('computes discount, shipping and demo tax in the display currency', () => {
    const shipping = getShippingQuote('IN', 'standard', 'INR', RATE_SNAPSHOT)!.amount;
    const t = calculateTotals({ lines, currency: 'INR', snapshot: RATE_SNAPSHOT, couponCode: 'WELCOME10', shipping, taxRate: 0.12 });
    expect(t.subtotal).toBe(235200 * 2 + 218400); // 4,704 + 2,184 = ₹6,888
    expect(t.discount).toBe(68900); // 10% of 6,888 = 688.8 -> ₹689
    expect(t.tax).toBe(74400); // 12% of 6,199 = 743.88 -> ₹744
    expect(shipping).toBe(25200); // $3 -> ₹252
    expect(t.total).toBe(t.subtotal - t.discount + t.tax + shipping);
    expect(t.total % 100).toBe(0); // whole rupees end to end
  });
});

describe('shipping', () => {
  it('returns standard + express quotes for supported destinations', () => {
    const q = getShippingQuotes('GB', 'GBP', RATE_SNAPSHOT)!;
    expect(q.map((x) => x.id)).toEqual(['standard', 'express']);
    expect(q[0].amount).toBe(convertFromBase(1400, 'GBP', RATE_SNAPSHOT));
  });

  it('returns null for unsupported destinations', () => {
    expect(getShippingQuotes('BR', 'USD', RATE_SNAPSHOT)).toBeNull();
    expect(getShippingQuotes('XX', 'USD', RATE_SNAPSHOT)).toBeNull();
  });
});
