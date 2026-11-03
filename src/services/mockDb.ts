import { PRODUCTS } from '@/data/products';
import type { Order, OrderLine, SavedAddress, User } from '@/types';

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

function seed(): DbState {
  return { stock: initialStock(), orders: [], users: new Map(), idempotency: new Map(), nextOrderNumber: 100001 };
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
