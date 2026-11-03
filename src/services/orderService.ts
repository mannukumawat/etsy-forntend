import { RATE_SNAPSHOT } from '@/data/currencies';
import { PRODUCT_BY_ID } from '@/data/products';
import type { Address, CartLine, CurrencyCode, Order, OrderLine, PaymentMethodPreview, PaymentScenario, ShippingMethodId } from '@/types';
import { convertFromBase } from '@/utils/money';
import { calculateTotals, isValidCoupon, normalizeCoupon } from '@/utils/pricing';
import { getDemoTaxRate, getShippingQuote } from '@/utils/shipping';
import { effectivePrice, variantLabel } from '@/utils/variants';
import { API_MODE, fetchCheckoutTotals, fetchMyOrder, fetchMyOrders, fetchOrderById, placeOrder, trackOrder, type CheckoutTotalsResponse } from '@/api';
import { ApiError, clone, mockRequest, newId } from './api';
import { db } from './mockDb';
import { getOrderToken, storeOrderToken } from '@/utils/orderAccess';

// Phase 2 endpoints (suggested):
//   POST /api/orders            (Idempotency-Key header) -> creates a pending order + payment intent
//   POST /api/payments/webhook  (gateway -> server)      -> marks the order paid; never trust the client
//   GET  /api/orders/:id        (auth or signed token)
//   GET  /api/orders?mine=1
//   POST /api/orders/track      { orderNumber, email }

export class PaymentError extends ApiError {
  constructor(public reason: 'declined' | 'cancelled') {
    super(`payment_${reason}`, reason === 'declined' ? 'Simulated card decline' : 'Simulated payment cancellation');
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
  paymentScenario: PaymentScenario;
  userId?: string;
}

function createOrder(input: PlaceOrderInput): Order {
  // 1. Idempotency: a repeated submit with the same key returns the original order.
  const existingId = db.idempotency.get(input.idempotencyKey);
  if (existingId) {
    const existing = db.orders.find((o) => o.id === existingId);
    if (existing) return existing;
  }

  if (!input.lines.length) throw new ApiError('empty_cart', 'Cart is empty');

  // 2. Re-validate stock and prices from the catalogue — the client only sends ids and quantities.
  const issues: StockIssue[] = [];
  const priced = input.lines.map((line) => {
    const product = PRODUCT_BY_ID[line.productId];
    const variant = product?.variants.find((v) => v.id === line.variantId);
    const available = variant ? db.stock.get(variant.id) ?? 0 : 0;
    if (!product || !variant || available < line.quantity) {
      issues.push({ productId: line.productId, variantId: line.variantId, requested: line.quantity, available });
    }
    return { product, variant, quantity: line.quantity };
  });
  if (issues.length) throw new ApiError('stock', 'Some items are no longer available in the requested quantity', issues);

  // 3. Shipping must be supported for the destination.
  const quote = getShippingQuote(input.address.country, input.shippingMethodId, input.currency, RATE_SNAPSHOT);
  if (!quote) throw new ApiError('shipping_unsupported', 'Destination not supported');

  // 4. Simulated payment outcome.
  if (input.paymentScenario === 'decline') throw new PaymentError('declined');
  if (input.paymentScenario === 'cancel') throw new PaymentError('cancelled');

  // 5. Totals are recomputed here, never taken from the client.
  const taxRate = getDemoTaxRate(input.address.country);
  const couponCode = isValidCoupon(input.couponCode) ? normalizeCoupon(input.couponCode) : undefined;
  const totals = calculateTotals({
    lines: priced.map((l) => ({ unitBase: effectivePrice(l.variant!), quantity: l.quantity })),
    currency: input.currency,
    snapshot: RATE_SNAPSHOT,
    couponCode,
    shipping: quote.amount,
    taxRate,
  });

  const lines: OrderLine[] = priced.map(({ product, variant, quantity }) => {
    const unitPrice = convertFromBase(effectivePrice(variant!), input.currency, RATE_SNAPSHOT);
    return {
      productId: product!.id,
      variantId: variant!.id,
      slug: product!.slug,
      name: product!.name,
      variantLabel: variantLabel(product!, variant!),
      image: variant!.images[0],
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    };
  });

  // 6. Commit: decrement stock, record the order and the idempotency key.
  for (const l of priced) db.stock.set(l.variant!.id, (db.stock.get(l.variant!.id) ?? 0) - l.quantity);

  const now = new Date().toISOString();
  const order: Order = {
    id: newId('ord'),
    number: `YS-${db.nextOrderNumber++}`,
    createdAt: now,
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    phone: `${input.address.phoneCountry} ${input.address.phone}`,
    lines,
    currency: input.currency,
    rateSnapshot: { ...RATE_SNAPSHOT, rates: { ...RATE_SNAPSHOT.rates } },
    subtotal: totals.subtotal,
    discount: totals.discount,
    couponCode,
    shipping: quote.amount,
    tax: totals.tax,
    taxRate,
    total: totals.total,
    shippingMethod: { id: quote.id, minDays: quote.minDays, maxDays: quote.maxDays },
    address: { ...input.address },
    paymentMethod: input.paymentMethod,
    status: 'placed',
    timeline: [{ status: 'placed', date: now }],
  };
  db.orders.unshift(order);
  db.idempotency.set(input.idempotencyKey, order.id);
  return order;
}

/** Server-calculated preview, shown on the review step right before the customer confirms — the
 *  number they see is the same pipeline that will compute the actual charge, never a client guess. */
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
    if (API_MODE) {
      const { email, address, shippingMethodId, paymentMethod, couponCode, idempotencyKey, lines, currency } = input;
      return placeOrder({ idempotencyKey, lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })), currency, email, address, shippingMethodId, paymentMethod, couponCode }).then(
        (order) => {
          // Guest orders only — see api/checkout.ts. Stashed by id so the confirmation page's lookup
          // (orderService.get, below) can hand it back on refresh without it ever touching the URL.
          if (order.accessToken) storeOrderToken(order.id, order.accessToken);
          return order;
        },
      );
    }
    return mockRequest(() => clone(createOrder(input)), [900, 1400]);
  },

  /** By the order's own id — used right after checkout (confirmation page), including on refresh. An
   *  account order is authorized by the signed-in session; a guest order needs the token stashed by
   *  `place` above (lost if the tab was closed — /track-order is the fallback in that case). */
  get(id: string): Promise<Order> {
    if (API_MODE) return fetchOrderById(id, getOrderToken(id));
    return mockRequest(() => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new ApiError('not_found', 'Order not found');
      return clone(order);
    });
  },

  listForUser(_userId: string): Promise<Order[]> {
    if (API_MODE) return fetchMyOrders();
    return mockRequest(() => clone(db.orders.filter((o) => o.userId === _userId)));
  },

  /** The signed-in customer's own order, by id — used by the account order-detail page. */
  getMine(id: string): Promise<Order> {
    if (API_MODE) return fetchMyOrder(id);
    return mockRequest(() => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new ApiError('not_found', 'Order not found');
      return clone(order);
    });
  },

  track(orderNumber: string, email: string): Promise<Order> {
    if (API_MODE) return trackOrder(orderNumber, email);
    return mockRequest(() => {
      const number = orderNumber.trim().toUpperCase();
      const order = db.orders.find((o) => o.number === number && o.email.toLowerCase() === email.trim().toLowerCase());
      if (!order) throw new ApiError('not_found', 'Order not found');
      return clone(order);
    }, [500, 900]);
  },
};

/** Exposed for unit tests. */
export const __createOrder = createOrder;
