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
  newAttempt: () => void;
  reset: () => void;
}

const initialCheckout = () => ({
  step: 'details' as CheckoutStep,
  details: null,
  shippingMethod: 'standard' as ShippingMethodId,
  paymentMethod: 'card' as PaymentMethodPreview,
  idempotencyKey: newId('idem'),
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
  newAttempt: () => set({ idempotencyKey: newId('idem') }),
  reset: () => set(initialCheckout()),
}));
