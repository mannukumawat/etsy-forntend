import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ChevronRight, Heart, Lock, MapPin, ShoppingBag } from 'lucide-react';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { CouponForm } from '@/components/cart/CouponForm';
import { TotalsTable } from '@/components/cart/TotalsTable';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { SelectField } from '@/components/ui/Form';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { useCartDetails } from '@/hooks/useCartDetails';
import { useCountries } from '@/hooks/useCountries';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLocale';
import { authService } from '@/services/authService';
import { usePreferences } from '@/store/preferences';
import { useAuth } from '@/store/session';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/cn';

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = useLanguage();
  const user = useAuth((s) => s.user);
  const addresses = useAsync(user ? `addresses:cart:${user.id}` : null, () => authService.listAddresses());
  const [addressOpen, setAddressOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(() => localStorage.getItem('etcy:delivery-address'));
  useDocumentTitle(t('cart.title'));
  const country = usePreferences((s) => s.deliveryCountry);
  const setCountry = usePreferences((s) => s.setDeliveryCountry);
  const { list } = useCountries();
  const { lines, totals, quote, couponCode, currency, isEmpty, isLoading, isError, hasIssues, reload } = useCartDetails({ country });
  const selectedAddress = addresses.data?.find((address) => address.id === selectedAddressId) ?? addresses.data?.find((address) => address.isDefault) ?? addresses.data?.[0];
  const deliveryLabel = selectedAddress ? `${selectedAddress.city}${selectedAddress.postalCode ? ` - ${selectedAddress.postalCode}` : ''}` : country;
  const selectAddress = (id: string) => {
    const address = addresses.data?.find((item) => item.id === id);
    setSelectedAddressId(id);
    localStorage.setItem('etcy:delivery-address', id);
    if (address) setCountry(address.country);
    setAddressOpen(false);
  };

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
    <div className="container-site py-0 md:py-8 lg:py-12">
      <div className="hidden flex-wrap items-baseline justify-between gap-3 md:flex">
        <h1 className="text-3xl lg:text-4xl">{t('cart.title')}</h1>
        <p className="text-ink-muted">{t('common.items', { count: totals.itemCount })}</p>
      </div>

      {isError ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="grid items-start gap-0 md:mt-6 md:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0">
            <button type="button" onClick={() => setAddressOpen(true)} className="-mx-4 flex min-h-16 w-[calc(100%+2rem)] items-center gap-3 border-y border-sand-200 bg-white px-4 text-left md:mx-0 md:hidden md:w-full">
              <MapPin className="h-5 w-5 text-brand-700" aria-hidden /><span className="flex-1 font-semibold text-ink">{t('cart.deliveryAt', { defaultValue: 'Delivery at' })} {deliveryLabel}</span><span className="rounded-lg border border-ink px-3 py-1.5 text-sm font-semibold">{t('common.change', { defaultValue: 'Change' })}</span>
            </button>
          <section aria-labelledby="cart-items" className="card -mx-4 mt-2 rounded-none border-x-0 px-4 md:mx-0 md:mt-0 md:rounded-2xl md:border-x sm:px-6">
            <h2 id="cart-items" className="sr-only">
              {t('checkout.items')}
            </h2>
            <ul className="divide-y divide-sand-200">
              {lines.map((item, i) => (
                <CartLineItem key={`${item.line.productId}-${item.line.variantId}`} item={item} index={i} />
              ))}
            </ul>
          </section>
          <Link to="/wishlist" className="-mx-4 mt-2 flex min-h-16 items-center gap-3 border-y border-sand-200 bg-white px-4 text-ink md:mx-0 md:rounded-xl md:border"><Heart className="h-6 w-6" aria-hidden /><span className="flex-1 font-semibold">{t('common.wishlist')}</span><ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden /></Link>

          <section className="-mx-4 mt-2 border-y border-sand-200 bg-white p-4 md:hidden">
            <h2 className="mb-3 font-sans text-lg font-semibold">{t('cart.priceDetails', { defaultValue: `Price Details (${totals.itemCount} Items)` })}</h2>
            <TotalsTable totals={totals} currency={currency} couponCode={couponCode} shippingPlaceholder={quote === null ? <span className="text-amber-800">{t('cart.notAvailable')}</span> : undefined} totalLabel={t('cart.total')} snapshot={RATE_SNAPSHOT} />
            <button type="button" onClick={() => setPriceOpen(true)} className="mt-3 text-sm font-semibold text-brand-700">{t('cart.viewPriceDetails', { defaultValue: 'View price details' })}</button>
          </section>
          </div>

          <aside aria-labelledby="summary-title" className="card hidden space-y-5 p-5 md:block lg:sticky lg:top-36">
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

      {!isError && <div className="mobile-action-bar fixed inset-x-0 bottom-0 z-50 grid grid-cols-[minmax(0,1fr)_1.4fr] items-center gap-3 border-t border-sand-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(45,37,29,0.08)] md:hidden"><button type="button" onClick={() => setPriceOpen(true)} className="min-w-0 text-left"><span className="block truncate text-lg font-semibold">{formatMoney(totals.total, currency, lang)}</span><span className="block truncate text-[11px] font-semibold uppercase text-brand-700">{t('cart.viewPriceDetails', { defaultValue: 'View price details' })}</span></button><Button fullWidth disabled={hasIssues || isLoading} onClick={() => navigate('/checkout')} icon={<Lock className="h-4 w-4" aria-hidden />}>{t('common.continue', { defaultValue: 'Continue' })}</Button></div>}

      <Modal open={priceOpen} onClose={() => setPriceOpen(false)} title={t('cart.priceDetails', { defaultValue: 'Price details' })}>
        <TotalsTable totals={totals} currency={currency} couponCode={couponCode} shippingPlaceholder={quote === null ? <span className="text-amber-800">{t('cart.notAvailable')}</span> : undefined} totalLabel={t('cart.total')} snapshot={RATE_SNAPSHOT} />
        <p className="mt-4 text-xs text-ink-muted">{t('cart.taxNote')}</p>
      </Modal>

      <Modal open={addressOpen} onClose={() => setAddressOpen(false)} title={t('account.changeDeliveryLocation', { defaultValue: 'Change delivery location' })}>
        {user && addresses.data?.length ? <ul className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">{addresses.data.map((address) => { const active = selectedAddress?.id === address.id; return <li key={address.id}><button type="button" onClick={() => selectAddress(address.id)} className={cn('relative min-h-36 w-full rounded-xl border p-3 text-left min-[390px]:min-h-40', active ? 'border-brand-600 ring-1 ring-brand-600' : 'border-sand-300')}>{active && <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white"><Check className="h-4 w-4" /></span>}<span className="font-semibold">{address.label}</span><span className="mt-2 line-clamp-4 block text-sm text-ink-soft">{address.fullName}<br />{address.line1}<br />{address.city}, {address.region} {address.postalCode}</span></button></li>; })}</ul> : <div className="py-6 text-center"><p className="text-sm text-ink-muted">{user ? t('account.noAddresses') : t('auth.loginSubtitle')}</p><Link to={user ? '/account/addresses' : '/login'} className="mt-4 inline-flex rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white">{user ? t('account.addAddress') : t('auth.submitLogin')}</Link></div>}
      </Modal>
    </div>
  );
}
