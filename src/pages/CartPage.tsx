import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { CouponForm } from '@/components/cart/CouponForm';
import { TotalsTable } from '@/components/cart/TotalsTable';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { SelectField } from '@/components/ui/Form';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { useCartDetails } from '@/hooks/useCartDetails';
import { useCountries } from '@/hooks/useCountries';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePreferences } from '@/store/preferences';

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle(t('cart.title'));
  const country = usePreferences((s) => s.deliveryCountry);
  const setCountry = usePreferences((s) => s.setDeliveryCountry);
  const { list } = useCountries();
  const { lines, totals, quote, couponCode, currency, isEmpty, isLoading, isError, hasIssues, reload } = useCartDetails({ country });

  if (isEmpty) {
    return (
      <div className="container-site py-10">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" aria-hidden />}
          title={t('cart.empty')}
          body={t('cart.emptyBody')}
          actions={<ButtonLink to="/shop">{t('cart.startShopping')}</ButtonLink>}
          className="py-20"
        />
      </div>
    );
  }

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-4xl lg:text-5xl">{t('cart.title')}</h1>
        <p className="text-ink-muted">{t('common.items', { count: totals.itemCount })}</p>
      </div>

      {isError ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          <section aria-labelledby="cart-items" className="card px-4 sm:px-6">
            <h2 id="cart-items" className="sr-only">
              {t('checkout.items')}
            </h2>
            <ul className="divide-y divide-sand-200">
              {lines.map((item, i) => (
                <CartLineItem key={`${item.line.productId}-${item.line.variantId}`} item={item} index={i} />
              ))}
            </ul>
          </section>

          <aside aria-labelledby="summary-title" className="card space-y-5 p-5 lg:sticky lg:top-36">
            <h2 id="summary-title" className="text-2xl">
              {t('cart.summary')}
            </h2>
            <SelectField label={t('cart.shippingTo')} value={country} onChange={(e) => setCountry(e.target.value)} className="h-10 py-2 text-sm" required>
              {list.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.zone ? c.label : t('address.notShipping', { country: c.label })}
                </option>
              ))}
            </SelectField>
            <CouponForm />
            {isLoading ? (
              <div className="space-y-2" aria-hidden>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ) : (
              <TotalsTable
                totals={totals}
                currency={currency}
                couponCode={couponCode}
                shippingPlaceholder={quote === null ? <span className="text-amber-800">{t('cart.notAvailable')}</span> : undefined}
                totalLabel={`${t('cart.total')} (${currency})`}
                snapshot={RATE_SNAPSHOT}
              />
            )}
            {hasIssues && (
              <Notice tone="warning" role="alert">
                {t('cart.fixIssues')}
              </Notice>
            )}
            <Button size="lg" fullWidth disabled={hasIssues || isLoading} onClick={() => navigate('/checkout')} icon={<Lock className="h-4 w-4" aria-hidden />}>
              {t('cart.checkout')}
            </Button>
            <ButtonLink to="/shop" variant="ghost" fullWidth icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              {t('cart.continueShopping')}
            </ButtonLink>
            <p className="text-xs text-ink-muted">{t('cart.taxNote')}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
