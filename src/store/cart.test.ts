import { beforeEach, describe, expect, it } from 'vitest';
import { selectCartCount, useCart } from './cart';

describe('cart store', () => {
  beforeEach(() => useCart.getState().clear());

  it('keeps separate lines per variant and caps quantity at the stock limit', () => {
    const { addItem } = useCart.getState();
    expect(addItem('p-mug', 'p-mug--sand', 2, 24)).toBe(2);
    expect(addItem('p-mug', 'p-mug--sage', 1, 12)).toBe(1);
    expect(addItem('p-mug', 'p-mug--blush', 5, 3)).toBe(3);
    expect(addItem('p-mug', 'p-mug--blush', 1, 3)).toBe(0);
    const s = useCart.getState();
    expect(s.lines).toHaveLength(3);
    expect(selectCartCount(s)).toBe(6);
  });

  it('removes a line when quantity is set to zero and can restore it', () => {
    const { addItem, setQuantity, restoreLine } = useCart.getState();
    addItem('p-vase', 'p-vase--default', 1, 4);
    const line = useCart.getState().lines[0];
    setQuantity('p-vase', 'p-vase--default', 0);
    expect(useCart.getState().lines).toHaveLength(0);
    restoreLine(line, 0);
    expect(useCart.getState().lines).toEqual([line]);
  });

  it('normalises coupon codes', () => {
    useCart.getState().applyCoupon('  welcome10 ');
    expect(useCart.getState().couponCode).toBe('WELCOME10');
  });
});
