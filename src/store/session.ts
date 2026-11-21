import { create } from 'zustand';
import type { PaymentMethodPreview, ShippingMethodId, User } from '@/types';
import type { CheckoutDetailsValues } from '@/utils/validation';
import { newId } from '@/services/api';
import { useWishlist } from './wishlist';

// In-memory only (NOT persisted): the signed-in user and checkout form data. In API mode the REAL
// session lives in an httpOnly cookie (restored via authService.me() on app load, see MainLayout);
// this store is just the client-side mirror of "who is currently signed in", never the source of truth.

interface AuthState {
  user: User | null;
  /** True right after an explicit sign-out, so protected pages redirect home instead of to /login. */
  signedOut: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  signedOut: false,
  setUser: (user) => {
    set({ user, signedOut: false });
    useWishlist.getState().setAccount(user?.id ?? null);
  },
  signOut: () => {
    set({ user: null, signedOut: true });
    useWishlist.getState().setAccount(null);
  },
}));

export type CheckoutStep = 'details' | 'shipping' | 'payment' | 'review';

interface CheckoutState {
  step: CheckoutStep;
  details: CheckoutDetailsValues | null;
  shippingMethod: ShippingMethodId;
  paymentMethod: PaymentMethodPreview;
  /** One key per order attempt so double clicks can't create duplicate orders. */
  idempotencyKey: string;
  /** Razorpay order id created for this attempt, if any. Reused on retry (see below). */
  razorpayOrderId: string | null;
  /**
   * True once a payment has been initiated for this attempt — a Razorpay order was created
   * or a full-wallet place() call was started. While true, newAttempt() must NOT rotate the
   * idempotency key: rotating after a successful charge would let a retry create a second
   * order / second charge. The backend returns the original order for a replayed key.
   */
  paymentAttempted: boolean;
  /** Customer's wallet balance in paise; null = not fetched or not signed in. */
  walletBalancePaise: number | null;
  /** True when customer has selected to pay via wallet (full payment). */
  useWallet: boolean;
  /** Paise to deduct from wallet for partial payment; null = not using partial wallet. */
  walletPartialPaise: number | null;
  setStep: (step: CheckoutStep) => void;
  setDetails: (details: CheckoutDetailsValues) => void;
  setShippingMethod: (m: ShippingMethodId) => void;
  setPaymentMethod: (m: PaymentMethodPreview) => void;
  setWalletBalance: (paise: number | null) => void;
  setUseWallet: (use: boolean) => void;
  setWalletPartialPaise: (paise: number | null) => void;
  /** Mark that a payment was initiated for this attempt (optionally with its Razorpay order id). */
  markPaymentAttempted: (razorpayOrderId?: string | null) => void;
  /**
   * Start a fresh attempt. Rotates the idempotency key ONLY when no payment was initiated
   * for the current attempt (e.g. a validation error before payment). Once a Razorpay order
   * exists or a payment was attempted, the key (and the Razorpay order) must be reused on
   * retry, so this becomes a no-op.
   */
  newAttempt: () => void;
  reset: () => void;
}

const initialCheckout = () => ({
  step: 'details' as CheckoutStep,
  details: null,
  shippingMethod: 'standard' as ShippingMethodId,
  paymentMethod: 'card' as PaymentMethodPreview,
  idempotencyKey: newId('idem'),
  razorpayOrderId: null as string | null,
  paymentAttempted: false as boolean,
  walletBalancePaise: null as number | null,
  useWallet: false,
  walletPartialPaise: null as number | null,
});

export const useCheckout = create<CheckoutState>()((set) => ({
  ...initialCheckout(),
  setStep: (step) => set({ step }),
  setDetails: (details) => set({ details }),
  setShippingMethod: (shippingMethod) => set({ shippingMethod }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setWalletBalance: (walletBalancePaise) => set({ walletBalancePaise }),
  setUseWallet: (useWallet) => set({ useWallet }),
  setWalletPartialPaise: (walletPartialPaise) => set({ walletPartialPaise }),
  markPaymentAttempted: (razorpayOrderId) => set({ paymentAttempted: true, ...(razorpayOrderId ? { razorpayOrderId } : {}) }),
  newAttempt: () =>
    set((s) =>
      // Payment already initiated: keep the key so a retry replays the same order instead
      // of creating a second charge. Safe to rotate only before any payment was attempted.
      s.paymentAttempted ? {} : { idempotencyKey: newId('idem') },
    ),
  reset: () => set(initialCheckout()),
}));
