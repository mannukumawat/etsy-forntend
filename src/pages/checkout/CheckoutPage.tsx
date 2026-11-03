import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ShoppingBag } from 'lucide-react';
import { API_MODE } from '@/api';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Notice, Spinner } from '@/components/ui/Feedback';
import { invalidateQueries } from '@/hooks/useAsync';
import { useCartDetails } from '@/hooks/useCartDetails';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMoney } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { orderService, PaymentError, type StockIssue } from '@/services/orderService';
import { useCart } from '@/store/cart';
import { usePreferences } from '@/store/preferences';
import { useAuth, useCheckout, type CheckoutStep } from '@/store/session';
import { cn } from '@/utils/cn';
import { DetailsStep } from './DetailsStep';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import { ShippingStep } from './ShippingStep';

const STEPS: CheckoutStep[] = ['details', 'shipping', 'payment', 'review'];

function Stepper({ current, onGo }: { current: CheckoutStep; onGo: (s: CheckoutStep) => void }) {
  const { t } = useTranslation();
  const index = STEPS.indexOf(current);
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {STEPS.map((s, i) => {
        const done = i < index;
        const active = i === index;
        const content = (
          <>
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                active ? 'bg-brand-600 text-white' : done ? 'bg-ink text-white' : 'border border-sand-300 bg-white text-ink-muted',
              )}
              aria-hidden
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(active ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-muted', 'hidden sm:inline')}>{t(`checkout.steps.${s}`)}</span>
            <span className="sr-only sm:hidden">{t(`checkout.steps.${s}`)}</span>
            {(done || active) && <span className="sr-only">({done ? t('a11y.stepCompleted') : t('a11y.stepCurrent')})</span>}
          </>
        );
        return (
          <li key={s} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            {done ? (
              <button type="button" onClick={() => onGo(s)} className="flex items-center gap-2 rounded-full pr-1 hover:underline">
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-2">{content}</span>
            )}
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-sand-300 sm:w-8" aria-hidden />}
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
  const user = useAuth((s) => s.user);
  const checkout = useCheckout();
  const prefCountry = usePreferences((s) => s.deliveryCountry);
  const clearCart = useCart((s) => s.clear);
  const setQuantity = useCart((s) => s.setQuantity);

  const country = checkout.details?.country ?? prefCountry;
  const cart = useCartDetails({ country, shippingMethod: checkout.shippingMethod });

  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const step: CheckoutStep = checkout.step !== 'details' && !checkout.details ? 'details' : checkout.step;
  const stepIndex = STEPS.indexOf(step);

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
    if (lock.current || !checkout.details) return; // duplicate-click guard
    if (cart.hasIssues) {
      setError(t('checkout.cartIssues'));
      return;
    }
    lock.current = true;
    setSubmitting(true);
    setError(null);
    const { email, marketing: _marketing, ...address } = checkout.details;
    const { lines, couponCode } = useCart.getState();
    try {
      const order = await orderService.place({
        idempotencyKey: checkout.idempotencyKey,
        lines,
        couponCode: couponCode ?? undefined,
        currency: money.currency,
        email,
        address,
        shippingMethodId: checkout.shippingMethod,
        paymentMethod: checkout.paymentMethod,
        paymentScenario: checkout.paymentScenario,
        userId: user?.id,
      });
      // Only now — after the (simulated) server confirmed the order — is the cart cleared.
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
      if (API_MODE && e instanceof ApiError) {
        // The server's own message is already client-ready prose (e.g. "We do not ship to this
        // destination yet.", "Some items in your cart no longer have enough stock."). A stock conflict
        // means the catalogue itself has changed, so refresh it rather than guessing new quantities.
        if (e.code === 'conflict') {
          invalidateQueries('catalog:');
          cart.reload();
        }
        setError(e.message || t('checkout.genericError'));
      } else if (e instanceof ApiError && e.code === 'stock') {
        for (const issue of (e.details as StockIssue[]) ?? []) {
          if (issue.available > 0) setQuantity(issue.productId, issue.variantId, Math.min(issue.requested, issue.available));
        }
        invalidateQueries('catalog:');
        cart.reload();
        setError(t('checkout.stockError'));
      } else if (e instanceof ApiError && e.code === 'shipping_unsupported') {
        setError(t('checkout.shippingError'));
      } else {
        setError(t('checkout.genericError'));
      }
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  };

  if (placed) return <Spinner label={API_MODE ? t('checkout.placingReal') : t('checkout.placing')} className="py-32" />;

  if (cart.isEmpty) {
    return (
      <div className="container-site py-10">
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

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl">{t('checkout.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('checkout.stepOf', { current: stepIndex + 1, total: STEPS.length })}</p>
        </div>
        <nav aria-label={t('checkout.title')}>
          <Stepper current={step} onGo={goTo} />
        </nav>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="lg:order-last">
          <OrderSummary details={cart} />
        </div>

        <div ref={contentRef} tabIndex={-1} className="min-w-0 scroll-mt-32 focus:outline-none">
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
              {step === 'shipping' && <ShippingStep onBack={() => goTo('details')} onDone={() => goTo('payment')} />}
              {step === 'payment' && <PaymentStep onBack={() => goTo('shipping')} onDone={() => goTo('review')} />}
              {step === 'review' && (
                <ReviewStep
                  total={money.format(cart.totals.total)}
                  submitting={submitting}
                  error={error}
                  blocked={cart.hasIssues || cart.isLoading || cart.totals.shipping === null}
                  onEdit={goTo}
                  onPlace={placeOrder}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
