import { beforeEach, describe, expect, it } from 'vitest';
import { useSiteSettings } from '@/store/siteSettings';
import { MAX_QTY_PER_LINE, getMaxQtyPerLine } from './store';

function setMaxQtyPerLine(value: number | undefined) {
  useSiteSettings.setState((s) => ({ store: { ...s.store, maxQtyPerLine: value } }));
}

describe('getMaxQtyPerLine (M-S1)', () => {
  beforeEach(() => setMaxQtyPerLine(undefined));

  it('falls back to MAX_QTY_PER_LINE while settings have not loaded', () => {
    expect(getMaxQtyPerLine()).toBe(MAX_QTY_PER_LINE);
    expect(getMaxQtyPerLine()).toBe(10);
  });

  it('reads the live settings value once loaded', () => {
    setMaxQtyPerLine(5);
    expect(getMaxQtyPerLine()).toBe(5);
  });

  it('ignores an invalid settings value and falls back', () => {
    setMaxQtyPerLine(0);
    expect(getMaxQtyPerLine()).toBe(MAX_QTY_PER_LINE);
    setMaxQtyPerLine(Number.NaN);
    expect(getMaxQtyPerLine()).toBe(MAX_QTY_PER_LINE);
  });
});
