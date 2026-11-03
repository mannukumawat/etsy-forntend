import { describe, expect, it } from 'vitest';
import type { CurrencyCode, RateSnapshot } from '@/types';
import { convertFromBase, formatMoney, majorToBaseMinor, roundMinor } from './money';
import { calculateTotals, lineTotal } from './pricing';

const SNAPSHOT: RateSnapshot = {
  base: 'USD',
  rates: { USD: 1, EUR: 0.92, GBP: 0.78, INR: 84 } as Record<CurrencyCode, number>,
  asOf: '2025-01-01',
  illustrative: true,
};

describe('money', () => {
  it('converts base USD to each currency with consistent rounding', () => {
    expect(convertFromBase(2800, 'USD', SNAPSHOT)).toBe(2800);
    expect(convertFromBase(2800, 'EUR', SNAPSHOT)).toBe(2576); // 28 * 0.92
    expect(convertFromBase(2800, 'GBP', SNAPSHOT)).toBe(2184); // 28 * 0.78
    expect(convertFromBase(2800, 'INR', SNAPSHOT)).toBe(235200); // ₹2,352 (whole rupees)
  });

  it('rounds INR to whole rupees and other currencies to minor units', () => {
    expect(roundMinor(12345, 'INR')).toBe(12300);
    expect(roundMinor(12350, 'INR')).toBe(12400);
    expect(roundMinor(1234.5, 'USD')).toBe(1235);
  });

  it('converts display major amounts back to base minor units', () => {
    expect(majorToBaseMinor(84, 'INR', SNAPSHOT)).toBe(100);
  });

  it("formats with Intl and the currency's fraction digits", () => {
    expect(formatMoney(235200, 'INR', 'en-US')).toBe('₹2,352');
    expect(formatMoney(2576, 'EUR', 'en-US')).toBe('€25.76');
    expect(formatMoney(2800, 'USD', 'en-US', 'code')).toMatch(/USD\s?28\.00/);
    expect(formatMoney(2576, 'EUR', 'de').replace(/\s/g, ' ')).toBe('25,76 €');
    expect(formatMoney(235200, 'INR', 'en-IN')).toBe('₹2,352');
  });
});

describe('totals', () => {
  const lines = [
    { unitBase: 2800, quantity: 2 },
    { unitBase: 2600, quantity: 1 },
  ];

  it('sums converted line totals so lines and subtotal always agree', () => {
    const t = calculateTotals({ lines, currency: 'EUR', snapshot: SNAPSHOT, shipping: null, taxRate: 0 });
    const expected = lineTotal(2800, 2, 'EUR', SNAPSHOT) + lineTotal(2600, 1, 'EUR', SNAPSHOT);
    expect(t.subtotal).toBe(expected);
    expect(t.itemCount).toBe(3);
    expect(t.total).toBe(expected);
  });
});
