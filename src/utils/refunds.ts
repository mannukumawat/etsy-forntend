import type { Order, OrderLine } from '@/types';

/** The returned units' proportional share of the amount actually paid for the order. */
export function estimatedReturnRefund(order: Order, line: OrderLine, quantity: number): number {
  const lineShare = Math.round((line.lineTotal * quantity) / line.quantity);
  if (order.subtotal <= 0) return Math.min(order.total, lineShare);
  return Math.min(order.total, Math.round((order.total * lineShare) / order.subtotal));
}
