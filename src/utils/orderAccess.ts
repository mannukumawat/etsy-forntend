// A guest order's one-time access token (see api/checkout.ts placeOrder/fetchOrderById) is kept out of
// the URL entirely — sessionStorage instead, keyed by order id, so a refresh of the confirmation page
// still works but the token never appears in the address bar, browser history, server logs, analytics,
// or a Referer header. It does not survive closing the tab; that's an accepted tradeoff (the customer
// can still find the order later via /track-order with their order number + email).

const PREFIX = 'ys_order_token:';

export function storeOrderToken(orderId: string, token: string): void {
  try {
    sessionStorage.setItem(PREFIX + orderId, token);
  } catch {
    // Storage can throw (private browsing, quota, disabled) — losing the token just means the guest
    // falls back to /track-order instead of the direct confirmation link on refresh.
  }
}

export function getOrderToken(orderId: string): string | null {
  try {
    return sessionStorage.getItem(PREFIX + orderId);
  } catch {
    return null;
  }
}
