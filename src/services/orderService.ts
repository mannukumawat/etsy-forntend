import type { Address, CartLine, CurrencyCode, Order, PaymentMethodPreview, ShippingMethodId } from '@/types';
import { fetchCheckoutTotals, fetchMyOrder, fetchMyOrders, fetchOrderById, placeOrder, trackOrder, type CheckoutTotalsResponse } from '@/api';
import { ApiError } from './api';
import { getOrderToken, storeOrderToken } from '@/utils/orderAccess';

export class PaymentError extends ApiError {
  constructor(public reason: 'declined' | 'cancelled') {
    super(`payment_${reason}`, reason === 'declined' ? 'Card declined' : 'Payment cancelled');
    this.name = 'PaymentError';
  }
}

export interface StockIssue {
  productId: string;
  variantId: string;
  requested: number;
  available: number;
}

export interface PlaceOrderInput {
  idempotencyKey: string;
  lines: CartLine[];
  couponCode?: string;
  currency: CurrencyCode;
  email: string;
  address: Address;
  shippingMethodId: ShippingMethodId;
  paymentMethod: PaymentMethodPreview;
}

export function previewTotals(input: { lines: CartLine[]; currency: CurrencyCode; country: string; shippingMethodId: ShippingMethodId; couponCode?: string }): Promise<CheckoutTotalsResponse> {
  return fetchCheckoutTotals({
    lines: input.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    currency: input.currency,
    country: input.country,
    shippingMethodId: input.shippingMethodId,
    couponCode: input.couponCode,
  });
}

export const orderService = {
  place(input: PlaceOrderInput): Promise<Order> {
    const { email, address, shippingMethodId, paymentMethod, couponCode, idempotencyKey, lines, currency } = input;
    return placeOrder({
      idempotencyKey,
      lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
      currency,
      email,
      address,
      shippingMethodId,
      paymentMethod,
      couponCode,
    }).then((order) => {
      if (order.accessToken) storeOrderToken(order.id, order.accessToken);
      return order;
    });
  },

  get(id: string): Promise<Order> {
    return fetchOrderById(id, getOrderToken(id));
  },

  listForUser(_userId: string): Promise<Order[]> {
    return fetchMyOrders();
  },

  getMine(id: string): Promise<Order> {
    return fetchMyOrder(id);
  },

  track(orderNumber: string, email: string): Promise<Order> {
    return trackOrder(orderNumber, email);
  },
};
