import { beforeEach, describe, expect, it } from 'vitest';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { queryProducts } from './productService';
import { ApiError } from './api';
import { db, resetDb } from './mockDb';
import { __createOrder, PaymentError, type PlaceOrderInput } from './orderService';

const now = new Date().toISOString();

function input(over: Partial<PlaceOrderInput> = {}): PlaceOrderInput {
  return {
    idempotencyKey: 'key-1',
    lines: [{ productId: 'p-mug', variantId: 'p-mug--blush', quantity: 2, addedAt: now }],
    couponCode: 'welcome10',
    currency: 'GBP',
    email: 'Guest@Example.com',
    address: { fullName: 'Guest', phoneCountry: 'GB', phone: '07700 900000', country: 'GB', line1: '1 Test Road', city: 'Leeds', postalCode: 'LS1 4AP' },
    shippingMethodId: 'standard',
    paymentMethod: 'card',
    paymentScenario: 'success',
    ...over,
  };
}

describe('mock order service', () => {
  beforeEach(() => resetDb());

  it('creates one order per idempotency key and decrements stock once', () => {
    const before = db.stock.get('p-mug--blush')!;
    const a = __createOrder(input());
    const b = __createOrder(input());
    expect(b.id).toBe(a.id);
    expect(db.stock.get('p-mug--blush')).toBe(before - 2);
    expect(db.orders.filter((o) => o.id === a.id)).toHaveLength(1);
  });

  it('recomputes totals server-side and snapshots currency + rate', () => {
    const order = __createOrder(input());
    expect(order.currency).toBe('GBP');
    expect(order.rateSnapshot.rates.GBP).toBe(RATE_SNAPSHOT.rates.GBP);
    expect(order.subtotal).toBe(2184 * 2);
    expect(order.discount).toBe(437);
    expect(order.couponCode).toBe('WELCOME10');
    expect(order.total).toBe(order.subtotal - order.discount + order.shipping + order.tax);
    expect(order.email).toBe('guest@example.com');
    expect(order.number).toMatch(/^YS-\d{6}$/);
  });

  it('declined or cancelled payments create no order and keep stock', () => {
    const before = db.stock.get('p-mug--blush')!;
    const count = db.orders.length;
    expect(() => __createOrder(input({ paymentScenario: 'decline' }))).toThrow(PaymentError);
    expect(() => __createOrder(input({ paymentScenario: 'cancel', idempotencyKey: 'k2' }))).toThrow(PaymentError);
    expect(db.orders.length).toBe(count);
    expect(db.stock.get('p-mug--blush')).toBe(before);
  });

  it('rejects quantities above stock and unsupported destinations', () => {
    expect(() => __createOrder(input({ lines: [{ productId: 'p-mug', variantId: 'p-mug--blush', quantity: 4, addedAt: now }] }))).toThrow(ApiError);
    try {
      __createOrder(input({ idempotencyKey: 'k3', address: { ...input().address, country: 'BR' } }));
    } catch (e) {
      expect((e as ApiError).code).toBe('shipping_unsupported');
    }
  });
});

describe('product query', () => {
  beforeEach(() => resetDb());

  it('combines search, category, price, availability and sorting', () => {
    const r = queryProducts({ q: 'mug', currency: 'USD' });
    expect(r.items.map((p) => p.id)).toContain('p-mug');

    const jewellery = queryProducts({ categories: ['jewellery'], availability: ['in_stock'], sort: 'price_asc', currency: 'USD' });
    expect(jewellery.items.every((p) => p.categoryId === 'jewellery')).toBe(true);
    expect(jewellery.items.find((p) => p.id === 'p-jhumka')).toBeUndefined();
    const prices = jewellery.items.map((p) => Math.min(...p.variants.map((v) => v.salePrice ?? v.price)));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const cheapInr = queryProducts({ maxPrice: 2500, currency: 'INR' });
    expect(cheapInr.items.length).toBeGreaterThan(0);
    expect(cheapInr.facets.categories.ceramics).toBeGreaterThanOrEqual(0);
  });

  it('finds products by search term and paginates', () => {
    expect(queryProducts({ q: 'mug', currency: 'USD' }).items.map((p) => p.id)).toContain('p-mug');
    const page2 = queryProducts({ currency: 'USD', pageSize: 12, page: 2 });
    expect(page2.page).toBe(2);
    expect(page2.items.length).toBe(page2.total - 12);
  });
});
