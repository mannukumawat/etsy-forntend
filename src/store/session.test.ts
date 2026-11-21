import { beforeEach, describe, expect, it } from 'vitest';
import { useCheckout } from './session';

describe('checkout idempotency (H3)', () => {
  beforeEach(() => useCheckout.getState().reset());

  it('rotates the idempotency key on a fresh attempt (no payment initiated)', () => {
    const before = useCheckout.getState().idempotencyKey;
    useCheckout.getState().newAttempt();
    expect(useCheckout.getState().idempotencyKey).not.toBe(before);
  });

  it('keeps the same idempotency key once a Razorpay order exists', () => {
    const before = useCheckout.getState().idempotencyKey;
    useCheckout.getState().markPaymentAttempted('order_test123');
    expect(useCheckout.getState().paymentAttempted).toBe(true);
    expect(useCheckout.getState().razorpayOrderId).toBe('order_test123');
    useCheckout.getState().newAttempt();
    expect(useCheckout.getState().idempotencyKey).toBe(before);
  });

  it('keeps the same idempotency key once a full-wallet payment was attempted', () => {
    const before = useCheckout.getState().idempotencyKey;
    useCheckout.getState().markPaymentAttempted();
    useCheckout.getState().newAttempt();
    expect(useCheckout.getState().idempotencyKey).toBe(before);
  });

  it('rotates again after reset (new checkout)', () => {
    useCheckout.getState().markPaymentAttempted('order_test123');
    useCheckout.getState().reset();
    expect(useCheckout.getState().paymentAttempted).toBe(false);
    expect(useCheckout.getState().razorpayOrderId).toBeNull();
    const before = useCheckout.getState().idempotencyKey;
    useCheckout.getState().newAttempt();
    expect(useCheckout.getState().idempotencyKey).not.toBe(before);
  });
});
