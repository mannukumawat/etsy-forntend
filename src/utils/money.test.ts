import { describe, expect, it } from 'vitest';
import type { RateSnapshot } from '@/types';
import { convertFromBase, majorToBaseMinor } from './money';

function snapshot(rates: Record<string, number>): RateSnapshot {
  return { base: 'USD', rates: rates as RateSnapshot['rates'], asOf: '2026-11-21', illustrative: false };
}

describe('convertFromBase rate guard (M-S3)', () => {
  it('converts normally with a valid rate', () => {
    expect(convertFromBase(10000, 'INR', snapshot({ USD: 1, INR: 84 }))).toBe(840000);
    expect(convertFromBase(10000, 'EUR', snapshot({ USD: 1, EUR: 0.92 }))).toBe(9200);
  });

  it('falls back to rate 1 when the rate is missing (never NaN)', () => {
    const result = convertFromBase(10000, 'INR', snapshot({ USD: 1 }));
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(10000);
  });

  it('falls back to rate 1 when the rate is zero, negative, NaN or Infinity', () => {
    for (const bad of [0, -84, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = convertFromBase(10000, 'INR', snapshot({ USD: 1, INR: bad }));
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBe(10000);
    }
  });
});

describe('majorToBaseMinor rate guard (M-S3)', () => {
  it('converts normally with a valid rate', () => {
    expect(majorToBaseMinor(100, 'EUR', snapshot({ USD: 1, EUR: 0.92 }))).toBe(10870);
  });

  it('falls back to rate 1 when the rate is missing or zero (never Infinity/NaN)', () => {
    expect(majorToBaseMinor(100, 'EUR', snapshot({ USD: 1 }))).toBe(10000);
    expect(majorToBaseMinor(100, 'EUR', snapshot({ USD: 1, EUR: 0 }))).toBe(10000);
    expect(majorToBaseMinor(100, 'EUR', snapshot({ USD: 1, EUR: -0.5 }))).toBe(10000);
    expect(majorToBaseMinor(100, 'EUR', snapshot({ USD: 1, EUR: Number.NaN }))).toBe(10000);
  });
});
