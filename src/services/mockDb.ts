import { DEMO_ACCOUNT } from '@/config/store';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { PRODUCTS, PRODUCT_BY_ID } from '@/data/products';
import type { Address, CurrencyCode, Order, OrderLine, OrderStatus, SavedAddress, ShippingMethodId, User } from '@/types';
import { convertFromBase } from '@/utils/money';
import { calculateTotals } from '@/utils/pricing';
import { getDemoTaxRate, getShippingQuote } from '@/utils/shipping';
import { effectivePrice, variantLabel } from '@/utils/variants';

// In-memory "database" for the Phase 1 demo.
// Personal data (users, addresses, orders) lives only in memory and resets on page refresh by design.

export interface DbUser extends User {
  addresses: SavedAddress[];
}

interface DbState {
  stock: Map<string, number>;
  orders: Order[];
  users: Map<string, DbUser>;
  idempotency: Map<string, string>;
  nextOrderNumber: number;
}

function initialStock(): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of PRODUCTS) for (const v of p.variants) m.set(v.id, v.stock);
  return m;
}

const DEMO_USER_ID = 'u_demo';

const demoAddresses: SavedAddress[] = [
  {
    id: 'addr_home',
    label: 'Home',
    isDefault: true,
    fullName: 'Demo Customer',
    phoneCountry: 'IN',
    phone: '98765 43210',
    country: 'IN',
    line1: '12 Sample Street, Civil Lines',
    line2: 'Flat 3B',
    city: 'Jaipur',
    region: 'Rajasthan',
    postalCode: '302006',
  },
  {
    id: 'addr_friend',
    label: 'Friend (US)',
    isDefault: false,
    fullName: 'Alex Example',
    phoneCountry: 'US',
    phone: '415 555 0100',
    country: 'US',
    line1: '123 Example Avenue',
    line2: 'Apt 4',
    city: 'San Francisco',
    region: 'California',
    postalCode: '94107',
  },
];

function seedLine(productId: string, variantId: string, quantity: number, currency: CurrencyCode): OrderLine {
  const product = PRODUCT_BY_ID[productId];
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const unitPrice = convertFromBase(effectivePrice(variant), currency, RATE_SNAPSHOT);
  return {
    productId,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    variantLabel: variantLabel(product, variant),
    image: variant.images[0],
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
  };
}

function seedOrder(opts: {
  number: string;
  createdAt: string;
  currency: CurrencyCode;
  items: Array<[string, string, number]>;
  address: Address;
  method: ShippingMethodId;
  status: OrderStatus;
  timeline: string[];
  coupon?: string;
}): Order {
  const lines = opts.items.map(([pid, vid, q]) => seedLine(pid, vid, q, opts.currency));
  const quote = getShippingQuote(opts.address.country, opts.method, opts.currency, RATE_SNAPSHOT)!;
  const taxRate = getDemoTaxRate(opts.address.country);
  const totals = calculateTotals({
    lines: opts.items.map(([pid, vid, q]) => {
      const v = PRODUCT_BY_ID[pid].variants.find((x) => x.id === vid)!;
      return { unitBase: effectivePrice(v), quantity: q };
    }),
    currency: opts.currency,
    snapshot: RATE_SNAPSHOT,
    couponCode: opts.coupon,
    shipping: quote.amount,
    taxRate,
  });
  const statuses: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered'];
  return {
    id: `ord_${opts.number.replace('YS-', '')}`,
    number: opts.number,
    createdAt: opts.createdAt,
    userId: DEMO_USER_ID,
    email: DEMO_ACCOUNT.email,
    phone: `${opts.address.phoneCountry} ${opts.address.phone}`,
    lines,
    currency: opts.currency,
    rateSnapshot: RATE_SNAPSHOT,
    subtotal: totals.subtotal,
    discount: totals.discount,
    couponCode: opts.coupon,
    shipping: quote.amount,
    tax: totals.tax,
    taxRate,
    total: totals.total,
    shippingMethod: { id: opts.method, minDays: quote.minDays, maxDays: quote.maxDays },
    address: opts.address,
    paymentMethod: 'card',
    status: opts.status,
    timeline: opts.timeline.map((date, i) => ({ status: statuses[i], date })),
    tracking: opts.status === 'shipped' || opts.status === 'delivered' ? { carrier: 'Demo Post', number: `DP${opts.number.replace('YS-', '')}IN` } : undefined,
  };
}

function seed(): DbState {
  const users = new Map<string, DbUser>();
  users.set(DEMO_USER_ID, {
    id: DEMO_USER_ID,
    name: 'Demo Customer',
    email: DEMO_ACCOUNT.email,
    phone: '+91 98765 43210',
    createdAt: '2025-11-12T10:00:00.000Z',
    isDemoAccount: true,
    addresses: demoAddresses,
  });

  const [home, friend] = demoAddresses;
  const orders: Order[] = [
    seedOrder({
      number: 'YS-240455',
      createdAt: '2026-10-26T09:12:00.000Z',
      currency: 'INR',
      items: [['p-candle', 'p-candle--vetiver', 2], ['p-cushion', 'p-cushion--indigo', 1]],
      address: home,
      method: 'standard',
      status: 'processing',
      timeline: ['2026-10-26T09:12:00.000Z', '2026-10-27T11:30:00.000Z'],
    }),
    seedOrder({
      number: 'YS-240342',
      createdAt: '2026-10-19T15:40:00.000Z',
      currency: 'USD',
      items: [['p-leaf-necklace', 'p-leaf-necklace--18', 1]],
      address: friend,
      method: 'express',
      status: 'shipped',
      timeline: ['2026-10-19T15:40:00.000Z', '2026-10-20T08:05:00.000Z', '2026-10-22T13:20:00.000Z'],
      coupon: 'WELCOME10',
    }),
    seedOrder({
      number: 'YS-240117',
      createdAt: '2026-08-02T06:25:00.000Z',
      currency: 'INR',
      items: [['p-mug', 'p-mug--sand', 2], ['p-bowl', 'p-bowl--oat', 1]],
      address: home,
      method: 'standard',
      status: 'delivered',
      timeline: ['2026-08-02T06:25:00.000Z', '2026-08-03T10:00:00.000Z', '2026-08-05T09:45:00.000Z', '2026-08-09T14:10:00.000Z'],
    }),
  ];

  return { stock: initialStock(), orders, users, idempotency: new Map(), nextOrderNumber: 240501 };
}

export const db: DbState = seed();

/** Test helper: restore the seeded state. */
export function resetDb() {
  const fresh = seed();
  db.stock = fresh.stock;
  db.orders = fresh.orders;
  db.users = fresh.users;
  db.idempotency = fresh.idempotency;
  db.nextOrderNumber = fresh.nextOrderNumber;
}

export const DEMO_TRACKING_EXAMPLE = { orderNumber: 'YS-240342', email: DEMO_ACCOUNT.email };
