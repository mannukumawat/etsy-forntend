import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { openRazorpayModal, PaymentError } from './orderService';

/** Minimal stand-in for the Razorpay checkout.js global: captures the
 * options it was constructed with and the subscribed event handlers. */
class MockRazorpay {
  static last: MockRazorpay | null = null;
  options: {
    handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
    modal?: { ondismiss?: () => void };
  };
  handlers = new Map<string, (response: { error: { code: string; description: string } }) => void>();

  constructor(options: MockRazorpay['options']) {
    this.options = options;
    MockRazorpay.last = this;
  }

  on(event: string, handler: (response: { error: { code: string; description: string } }) => void): void {
    this.handlers.set(event, handler);
  }

  open(): void {
    /* modal opens; the test drives the outcome via the captured handlers */
  }
}

const input = {
  keyId: 'rzp_test_key',
  amount: 150000,
  currency: 'INR',
  razorpayOrderId: 'order_test123',
  name: 'Your Store',
  email: 'buyer@example.com',
};

/** openRazorpayModal constructs the modal after an awaited script load, so
 * let its microtasks run before reading the captured mock instance. */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

beforeEach(() => {
  MockRazorpay.last = null;
  (globalThis as unknown as { window: unknown }).window = { Razorpay: MockRazorpay };
});

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe('openRazorpayModal', () => {
  it('rejects with PaymentError(declined) on payment.failed', async () => {
    const promise = openRazorpayModal(input);
    await tick();
    const modal = MockRazorpay.last;
    expect(modal).not.toBeNull();
    const failed = modal?.handlers.get('payment.failed');
    expect(failed).toBeDefined();
    failed?.({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment failed' } });
    await expect(promise).rejects.toMatchObject({ reason: 'declined' });
  });

  it('rejects with PaymentError(cancelled) when the modal is dismissed', async () => {
    const promise = openRazorpayModal(input);
    await tick();
    MockRazorpay.last?.options.modal?.ondismiss?.();
    await expect(promise).rejects.toMatchObject({ reason: 'cancelled' });
  });

  it('keeps the first outcome: a failure followed by a dismiss stays declined', async () => {
    const promise = openRazorpayModal(input);
    await tick();
    const modal = MockRazorpay.last;
    modal?.handlers.get('payment.failed')?.({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment failed' } });
    modal?.options.modal?.ondismiss?.();
    await expect(promise).rejects.toMatchObject({ reason: 'declined' });
  });

  it('resolves with the payment details on handler success', async () => {
    const promise = openRazorpayModal(input);
    await tick();
    MockRazorpay.last?.options.handler({
      razorpay_order_id: 'order_test123',
      razorpay_payment_id: 'pay_test456',
      razorpay_signature: 'sig_test789',
    });
    await expect(promise).resolves.toEqual({
      razorpayOrderId: 'order_test123',
      razorpayPaymentId: 'pay_test456',
      razorpaySignature: 'sig_test789',
    });
  });

  it('PaymentError carries the declined reason', () => {
    const err = new PaymentError('declined');
    expect(err.reason).toBe('declined');
    expect(err.code).toBe('payment_declined');
  });
});
