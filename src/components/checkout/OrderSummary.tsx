import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { useLocalized, useMoney } from '@/hooks/useLocale';
import type { useCartDetails } from '@/hooks/useCartDetails';
import type { CheckoutTotalsResponse } from '@/api/checkout';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import { cn } from '@/utils/cn';
import { variantLabel } from '@/utils/variants';
import { CouponForm } from '../cart/CouponForm';
import { TotalsTable } from '../cart/TotalsTable';
import { Skeleton } from '../ui/Feedback';

type CartDetails = ReturnType<typeof useCartDetails>;

function SummaryBody({ details, showCoupon }: { details: CartDetails; showCoupon: boolean }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const money = useMoney();
  const removeItem = useCart((s) => s.removeItem);
  const restoreLine = useCart((s) => s.restoreLine);
  const toast = useUi((s) => s.toast);
  return (
    <div className="space-y-5">
      <ul className="divide-y divide-sand-200">
        {details.lines.map((item, index) =>
          item.status === 'loading' || !item.product ? (
            <li key={item.line.variantId} className="flex gap-3 py-3" aria-hidden>
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ) : (
            <li key={item.line.variantId} className="flex items-start gap-3 py-3 first:pt-0">
              <div className="relative shrink-0">
                {(item.variant?.images[0] ?? item.product.images[0]) ? (
                  <img src={(item.variant?.images[0] ?? item.product.images[0])!.src} alt="" width={56} height={56} loading="lazy" decoding="async" className="h-14 w-14 rounded-lg border border-sand-200 object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-lg border border-sand-200 bg-sand-100" aria-hidden />
                )}
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white" aria-hidden>
                  {item.line.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-[13px] leading-snug">
                <p className="line-clamp-2 font-medium text-ink" title={loc(item.product.name)}>
                  {loc(item.product.name)}
                </p>
                {item.variant && variantLabel(item.product, item.variant) && (
                  <p className="mt-1 inline-block rounded bg-sand-100 px-1.5 py-0.5 text-xs font-medium text-ink-soft">{loc(variantLabel(item.product, item.variant))}</p>
                )}
                {item.issue && <p className="mt-1 text-xs text-red-700">{t(item.issue === 'insufficient' ? 'cart.issues.insufficient' : `cart.issues.${item.issue}`, { count: item.maxQuantity })}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <p className="text-[13px] font-medium">{item.unitBase !== undefined ? money.format(money.convert(item.unitBase) * item.line.quantity) : '—'}</p>
                <button
                  type="button"
                  onClick={() => {
                    const name = loc(item.product!.name);
                    removeItem(item.line.productId, item.line.variantId);
                    toast(t('cart.removed', { name }), 'info', { label: t('cart.undo'), onClick: () => restoreLine(item.line, index) });
                  }}
                  className="flex items-center gap-1 rounded text-xs text-ink-muted hover:text-red-700"
                  aria-label={t('a11y.removeItem', { name: loc(item.product.name) })}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t('common.remove')}
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:underline">
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t('checkout.addMoreItems', { defaultValue: 'Add more items' })}
      </Link>
      {showCoupon && <CouponForm />}
      <TotalsTable
        totals={details.totals}
        currency={details.currency}
        couponCode={details.couponCode}
        shippingPlaceholder={<span className="text-amber-800">{t('cart.notAvailable')}</span>}
        snapshot={RATE_SNAPSHOT}
        size="sm"
      />
      <p className="text-xs text-ink-muted">{t('cart.taxNote')}</p>
    </div>
  );
}

/** Sticky sidebar on desktop; collapsible panel on mobile. */
export function OrderSummary({ details, serverTotals, showCoupon = true }: { details: CartDetails; serverTotals?: CheckoutTotalsResponse | null; showCoupon?: boolean }) {
  const { t } = useTranslation();
  const money = useMoney();
  const [open, setOpen] = useState(false);

  // Server total is authoritative when available; fall back to client estimate.
  const displayTotal = serverTotals ? serverTotals.totals.total : details.totals.total;

  return (
    <>
      <div className="rounded-xl border border-sand-200 bg-white lg:hidden">
        <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" aria-expanded={open} aria-controls="mobile-summary" onClick={() => setOpen((v) => !v)}>
          <span className="flex items-center gap-2 text-sm font-medium text-brand-700">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {open ? t('checkout.summaryHide') : t('checkout.summaryShow')}
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </span>
          <span className="font-semibold">
            <span className="mr-1 text-xs font-medium text-ink-muted">{details.currency}</span>
            {money.format(displayTotal)}
          </span>
        </button>
        <div id="mobile-summary" hidden={!open} className="border-t border-sand-200 p-4">
          {open && <SummaryBody details={details} showCoupon={showCoupon} />}
        </div>
      </div>

      <aside aria-labelledby="order-summary-title" className="card hidden p-5 lg:sticky lg:top-36 lg:block">
        <h2 id="order-summary-title" className="mb-4 border-b border-sand-200 pb-3 text-lg sm:text-xl">
          {t('cart.summary')}
        </h2>
        <SummaryBody details={details} showCoupon={showCoupon} />
      </aside>
    </>
  );
}
