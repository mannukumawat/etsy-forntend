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

export interface RazorpayPaymentResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
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
  razorpayResult?: RazorpayPaymentResult;
  /** INR paise to debit from store wallet for a full wallet-only payment. */
  walletAmountPaise?: number;
  /** INR paise to debit from wallet for a partial payment; Razorpay covers the rest. */
  walletPartialPaise?: number;
}

/** Loads the Razorpay checkout script and resolves when ready. */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.head.appendChild(script);
  });
}

/** Opens the Razorpay checkout modal and resolves with payment details, or rejects on cancel/failure. */
export async function openRazorpayModal(input: {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  name: string;
  email: string;
}): Promise<RazorpayPaymentResult> {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: input.keyId,
      amount: input.amount,
      currency: input.currency,
      name: input.name,
      order_id: input.razorpayOrderId,
      prefill: { email: input.email },
      theme: { color: '#8B4513' },
      method: {
        card: true,
        upi: true,
        netbanking: true,
        wallet: true,
        paylater: false,
        emi: false,
      },
      handler(response) {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() { reject(new PaymentError('cancelled')); },
      },
    });
    rzp.open();
  });
}

export function previewTotals(input: { lines: CartLine[]; currency: CurrencyCode; country: string; region?: string; shippingMethodId: ShippingMethodId; couponCode?: string }): Promise<CheckoutTotalsResponse> {
  return fetchCheckoutTotals({
    lines: input.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    currency: input.currency,
    country: input.country,
    region: input.region,
    shippingMethodId: input.shippingMethodId,
    couponCode: input.couponCode,
  });
}

export const orderService = {
  place(input: PlaceOrderInput): Promise<Order> {
    const { email, address, shippingMethodId, paymentMethod, couponCode, idempotencyKey, lines, currency, razorpayResult, walletAmountPaise, walletPartialPaise } = input;
    return placeOrder({
      idempotencyKey,
      lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
      currency,
      email,
      address,
      shippingMethodId,
      paymentMethod,
      couponCode,
      ...(razorpayResult ?? {}),
      ...(walletAmountPaise ? { walletAmountPaise } : {}),
      ...(walletPartialPaise ? { walletPartialPaise } : {}),
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
