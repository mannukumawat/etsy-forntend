import { describe, expect, it } from 'vitest';
import { estimatedReturnRefund } from './refunds';
import type { Order, OrderLine } from '@/types';

describe('estimatedReturnRefund', () => {
  it('refunds the exact paid total for a full single-line return', () => {
    const order = { subtotal: 26760, total: 30271 } as Order;
    const line = { quantity: 1, lineTotal: 26760 } as OrderLine;
    expect(estimatedReturnRefund(order, line, 1)).toBe(30271);
  });

  it('allocates the paid total proportionally for a partial return', () => {
    const order = { subtotal: 40000, total: 44000 } as Order;
    const line = { quantity: 2, lineTotal: 20000 } as OrderLine;
    expect(estimatedReturnRefund(order, line, 1)).toBe(11000);
  });
});
