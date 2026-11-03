import type { Address, CurrencyCode, Order, ShippingMethodId } from "@/types";
import { apiClient } from "./client";

export interface CheckoutLineInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CheckoutTotalsRequest {
  lines: CheckoutLineInput[];
  currency: CurrencyCode;
  country: string;
  shippingMethodId: ShippingMethodId;
  couponCode?: string;
}

export interface CheckoutTotalsResponse {
  lines: Array<{ productId: string; variantId: string; quantity: number; unitPrice: number; lineTotal: number }>;
  shippingQuotes: Array<{ id: "standard" | "express"; label: string; amount: number; minDays: number; maxDays: number }>;
  shippingSupported: boolean;
  taxRate: number;
  couponValid: boolean;
  couponError: string | null;
  stockIssues: Array<{ productId: string; variantId: string; requested: number; available: number }>;
  totals: { subtotal: number; discount: number; taxable: number; tax: number; shipping: number; total: number };
}

/** Server-calculated preview — never trusted for the actual charge, only for showing the customer an
 *  accurate number before they place the order. The order itself recomputes everything independently. */
export function fetchCheckoutTotals(input: CheckoutTotalsRequest, signal?: AbortSignal): Promise<CheckoutTotalsResponse> {
  return apiClient.post<CheckoutTotalsResponse>("/api/checkout/totals", input, { signal });
}

export interface PlaceOrderRequest {
  idempotencyKey: string;
  lines: CheckoutLineInput[];
  currency: CurrencyCode;
  email: string;
  address: Address;
  shippingMethodId: ShippingMethodId;
  paymentMethod: "cod" | "card" | "upi" | "wallet";
  couponCode?: string;
}

/** Guest orders only: a one-time access token, returned once here and never again — it's the guest's
 *  only way back into GET /api/orders/:id (see fetchOrderById below). Absent for account orders, which
 *  are authorized by the signed-in customer's session instead. */
export type PlaceOrderResponse = Order & { accessToken?: string };

export function placeOrder(input: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  return apiClient.post<PlaceOrderResponse>("/api/checkout/orders", input);
}

/** By the order's own (unguessable) id — the confirmation-page lookup. An account order needs the
 *  caller to be signed in as its owner; a guest order needs its one-time `token` (see placeOrder),
 *  sent as a header — never a query string, so it can't end up in a log, analytics event, or a
 *  Referer header. */
export function fetchOrderById(id: string, token?: string | null, signal?: AbortSignal): Promise<Order> {
  return apiClient.get<Order>(`/api/orders/${encodeURIComponent(id)}`, {
    signal,
    headers: token ? { "x-order-token": token } : undefined,
  });
}

/** By the human-readable order number + email — the "track my order" lookup. Returns a trimmed view
 *  (no full address/phone/email): number+email is a much weaker proof of ownership than the id+token
 *  pair `fetchOrderById` requires, so this endpoint doesn't hand back that much detail. */
export function trackOrder(number: string, email: string, signal?: AbortSignal): Promise<Order> {
  return apiClient.get<Order>("/api/orders/track", { query: { number, email }, signal });
}

export async function fetchMyOrders(signal?: AbortSignal): Promise<Order[]> {
  const { items } = await apiClient.get<{ items: Order[] }>("/api/customer/orders", { signal });
  return items;
}

export function fetchMyOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return apiClient.get<Order>(`/api/customer/orders/${encodeURIComponent(id)}`, { signal });
}

export interface ValidateCouponResponse {
  valid: boolean;
  error: string | null;
  discount: number;
}

/** Lightweight check for the bare cart page (no destination yet) — the authoritative check happens
 *  again at /api/checkout/totals and /api/checkout/orders. */
export function validateCartCoupon(code: string, lines: CheckoutLineInput[], currency: CurrencyCode, signal?: AbortSignal): Promise<ValidateCouponResponse> {
  return apiClient.post<ValidateCouponResponse>('/api/checkout/validate-coupon', { code, lines, currency }, { signal });
}
