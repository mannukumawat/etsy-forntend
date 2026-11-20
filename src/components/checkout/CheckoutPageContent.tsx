import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ShoppingBag } from 'lucide-react';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Notice, Spinner } from '@/components/ui/Feedback';
import { invalidateQueries } from '@/hooks/useAsync';
import { useCartDetails } from '@/hooks/useCartDetails';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMoney } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { openRazorpayModal, orderService, PaymentError, previewTotals } from '@/services/orderService';
import { createRazorpayOrder } from '@/api';
import type { CheckoutTotalsResponse } from '@/api/checkout';
import { useCart } from '@/store/cart';
import { usePreferences } from '@/store/preferences';
import { useCheckout, type CheckoutStep } from '@/store/session';
import { cn } from '@/utils/cn';
import { DetailsStep } from './steps/DetailsStep';
import { PaymentStep } from './steps/PaymentStep';
import { ReviewStep } from './steps/ReviewStep';
import { ShippingStep } from './steps/ShippingStep';

const STEPS: CheckoutStep[] = ['details', 'shipping', 'review', 'payment'];

function Stepper({ current, onGo }: { current: CheckoutStep; onGo: (s: CheckoutStep) => void }) {
  const { t } = useTranslation();
  const index = STEPS.indexOf(current);
  return (
    <ol className="flex w-full items-center text-sm">
      {STEPS.map((s, i) => {
        const done = i < index;
        const active = i === index;
        const content = (
          <>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                active ? 'bg-brand-600 text-white ring-4 ring-brand-100' : done ? 'bg-ink text-white' : 'border border-sand-300 bg-white text-ink-muted',
              )}
              aria-hidden
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(active ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-muted', active ? 'inline' : 'hidden sm:inline')}>{t(`checkout.steps.${s}`)}</span>
            {!active && <span className="sr-only sm:hidden">{t(`checkout.steps.${s}`)}</span>}
            {(done || active) && <span className="sr-only">({done ? t('a11y.stepCompleted') : t('a11y.stepCurrent')})</span>}
          </>
        );
        return (
          <li key={s} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
            {done ? (
              <button type="button" onClick={() => onGo(s)} className="flex items-center gap-2.5 rounded-full pr-1 hover:underline">
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-2.5">{content}</span>
            )}
            {i < STEPS.length - 1 && <span className={cn('mx-2 h-0.5 min-w-3 flex-1 rounded-full sm:mx-4', done ? 'bg-ink' : 'bg-sand-300')} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('checkout.title'));
  const navigate = useNavigate();
  const money = useMoney();
  const checkout = useCheckout();
  const prefCountry = usePreferences((s) => s.deliveryCountry);
  const clearCart = useCart((s) => s.clear);

  const country = checkout.details?.country ?? prefCountry;
  const cart = useCartDetails({ country, shippingMethod: checkout.shippingMethod });

  // Server-computed quote — fetched whenever we have a complete destination + shipping method.
  // Used for the sidebar totals, the review total, and the Razorpay/wallet amount.
  const [serverTotals, setServerTotals] = useState<CheckoutTotalsResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const step: CheckoutStep = checkout.step !== 'details' && !checkout.details ? 'details' : checkout.step;
  const stepIndex = STEPS.indexOf(step);

  // Refresh the server quote whenever destination, shipping method, coupon, or currency changes
  // and we're past the details step. The displayed total must always match what will be charged.
  useEffect(() => {
    const { details, shippingMethod } = checkout;
    if (!details || step === 'details') { setServerTotals(null); return; }
    const { lines, couponCode } = useCart.getState();
    if (!lines.length) return;
    const ctrl = new AbortController();
    previewTotals({
      lines,
      currency: money.currency,
      country: details.country,
      region: details.region,
      shippingMethodId: shippingMethod,
      couponCode: couponCode ?? undefined,
    }).then(setServerTotals).catch(() => { /* non-fatal — sidebar falls back to client totals */ });
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout.details, checkout.shippingMethod, money.currency, step]);

  // Move focus to the step content when the step changes (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    contentRef.current?.focus({ preventScroll: true });
    contentRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [step]);

  const goTo = (s: CheckoutStep) => {
    setError(null);
    checkout.setStep(s);
  };

  const placeOrder = async () => {
    if (lock.current || !checkout.details) return;
    if (cart.hasIssues) {
      setError(t('checkout.cartIssues'));
      return;
    }
    lock.current = true;
    setSubmitting(true);
    setError(null);
    const { email, marketing: _marketing, ...address } = checkout.details;
    const { lines, couponCode } = useCart.getState();

    // Always fetch a fresh server quote immediately before payment so the amount is never stale
    // (e.g. FX rate changed, admin changed a shipping fee, coupon was invalidated).
    const checkoutParams = {
      lines,
      currency: money.currency,
      country: checkout.details.country,
      region: checkout.details.region,
      shippingMethodId: checkout.shippingMethod,
      couponCode: couponCode ?? undefined,
    };

    try {
      const freshTotals = await previewTotals(checkoutParams);
      // Show updated total to the customer before proceeding; they already confirmed once in the
      // review step, so only interrupt if the amount changed since they last saw it.
      if (serverTotals && freshTotals.totals.total !== serverTotals.totals.total) {
        setServerTotals(freshTotals);
        setError(t('checkout.totalChanged', { defaultValue: 'The order total has changed. Please review and confirm.' }));
        setSubmitting(false);
        lock.current = false;
        return;
      }
      setServerTotals(freshTotals);

      if (checkout.paymentMethod === 'cod') {
        const order = await orderService.place({
          idempotencyKey: checkout.idempotencyKey,
          lines,
          couponCode: couponCode ?? undefined,
          currency: money.currency,
          email,
          address,
          shippingMethodId: checkout.shippingMethod,
          paymentMethod: 'cod',
        });
        setPlaced(true);
        invalidateQueries('catalog:');
        invalidateQueries('orders:');
        navigate(`/order/success/${order.id}`, { replace: true });
        clearCart();
        checkout.reset();
        return;
      }

      if (checkout.useWallet) {
        // Full wallet payment — skip Razorpay entirely.
        const order = await orderService.place({
          idempotencyKey: checkout.idempotencyKey,
          lines,
          couponCode: couponCode ?? undefined,
          currency: money.currency,
          email,
          address,
          shippingMethodId: checkout.shippingMethod,
          paymentMethod: 'wallet',
          walletAmountPaise: freshTotals.totals.total,
        });
        setPlaced(true);
        invalidateQueries('catalog:');
        invalidateQueries('orders:');
        navigate(`/order/success/${order.id}`, { replace: true });
        clearCart();
        checkout.reset();
        return;
      }

      // Razorpay payment path (full or partial-wallet).
      const keyId = (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)?.trim();
      if (!keyId) throw new Error('Razorpay not configured.');

      const walletPartialPaise = checkout.walletPartialPaise ?? 0;
      // For partial wallet, Razorpay only charges the shortfall.
      // Pass walletPartialPaise in the create-order request so the server computes the reduced amount.
      const rzpOrder = await createRazorpayOrder({
        ...checkoutParams,
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
        receipt: checkout.idempotencyKey.slice(0, 40),
        ...(walletPartialPaise > 0 ? { walletPartialPaise } : {}),
      });

      const razorpayResult = await openRazorpayModal({
        keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        razorpayOrderId: rzpOrder.id,
        name: 'Your Store',
        email,
      });

      const order = await orderService.place({
        idempotencyKey: checkout.idempotencyKey,
        lines,
        couponCode: couponCode ?? undefined,
        currency: money.currency,
        email,
        address,
        shippingMethodId: checkout.shippingMethod,
        paymentMethod: checkout.paymentMethod,
        razorpayResult,
        ...(walletPartialPaise > 0 ? { walletPartialPaise } : {}),
      });

      setPlaced(true);
      invalidateQueries('catalog:');
      invalidateQueries('orders:');
      navigate(`/order/success/${order.id}`, { replace: true });
      clearCart();
      checkout.reset();
    } catch (e) {
      checkout.newAttempt();
      if (e instanceof PaymentError) {
        navigate(`/order/payment-failed?reason=${e.reason}`);
        return;
      }
      if (e instanceof ApiError) {
        if (e.code === 'conflict') {
          invalidateQueries('catalog:');
          cart.reload();
        }
        setError(e.message || t('checkout.genericError'));
      } else {
        setError(t('checkout.genericError'));
      }
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  };

  if (placed) return <Spinner label={t('checkout.placingReal')} className="py-32" />;

  if (cart.isEmpty) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" aria-hidden />}
          title={t('cart.empty')}
          body={t('checkout.emptyCart')}
          actions={<ButtonLink to="/shop">{t('cart.startShopping')}</ButtonLink>}
          className="py-20"
        />
      </div>
    );
  }

  // The displayed total uses the server quote when available; falls back to client estimate.
  const displayTotal = serverTotals ? money.format(serverTotals.totals.total) : money.format(cart.totals.total);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-3 sm:px-6 sm:py-8 md:max-w-6xl lg:px-8 lg:py-12">
      <div className="hidden items-end justify-between gap-4 md:flex">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl">{t('checkout.title')}</h1>
        <p className="pb-1 text-sm text-ink-muted">{t('checkout.stepOf', { current: stepIndex + 1, total: STEPS.length })}</p>
      </div>
      <nav aria-label={t('checkout.title')} className="sticky top-16 z-30 -mx-4 border-y border-sand-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:mx-0 sm:rounded-xl sm:border md:static md:mt-5 md:shadow-card md:px-6">
        <Stepper current={step} onGo={goTo} />
      </nav>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="lg:order-last">
          <OrderSummary details={cart} serverTotals={serverTotals} />
        </div>

        <div ref={contentRef} tabIndex={-1} className="card -mx-4 min-w-0 scroll-mt-32 rounded-none border-x-0 p-4 focus:outline-none sm:mx-0 sm:rounded-xl sm:border-x sm:p-6">
          {cart.isError ? (
            <ErrorState onRetry={cart.reload} />
          ) : (
            <>
              {cart.hasIssues && (
                <Notice tone="warning" role="alert" className="mb-6">
                  {t('checkout.cartIssues')}{' '}
                  <Link to="/cart" className="font-semibold underline">
                    {t('cart.viewCart')}
                  </Link>
                </Notice>
              )}
              {step === 'details' && <DetailsStep onDone={() => goTo('shipping')} />}
              {step === 'shipping' && <ShippingStep onBack={() => goTo('details')} onDone={() => goTo('review')} />}
              {step === 'review' && (
                <ReviewStep
                  onEdit={goTo}
                  onDone={() => goTo('payment')}
                />
              )}
              {step === 'payment' && (
                <PaymentStep
                  onBack={() => goTo('review')}
                  onPlace={placeOrder}
                  walletInfo={serverTotals?.wallet ?? null}
                  total={displayTotal}
                  submitting={submitting}
                  error={error}
                  blocked={cart.hasIssues || cart.isLoading || cart.totals.shipping === null}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
