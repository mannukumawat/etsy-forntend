import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { useLocalized, useMoney } from '@/hooks/useLocale';
import type { useCartDetails } from '@/hooks/useCartDetails';
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
  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {details.lines.map((item) =>
          item.status === 'loading' || !item.product ? (
            <li key={item.line.variantId} className="flex gap-3" aria-hidden>
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ) : (
            <li key={item.line.variantId} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img src={(item.variant ?? item.product).images[0].src} alt="" className="h-16 w-16 rounded-lg border border-sand-200 object-cover" />
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white" aria-hidden>
                  {item.line.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-ink">{loc(item.product.name)}</p>
                {item.variant && variantLabel(item.product, item.variant) && <p className="text-ink-muted">{loc(variantLabel(item.product, item.variant))}</p>}
                <p className="text-ink-muted">{t('order.qty', { count: item.line.quantity })}</p>
                {item.issue && <p className="text-red-700">{t(item.issue === 'insufficient' ? 'cart.issues.insufficient' : `cart.issues.${item.issue}`, { count: item.maxQuantity })}</p>}
              </div>
              <p className="shrink-0 text-sm font-medium">{item.unitBase !== undefined ? money.format(money.convert(item.unitBase) * item.line.quantity) : '—'}</p>
            </li>
          ),
        )}
      </ul>
      {showCoupon && <CouponForm />}
      <TotalsTable
        totals={details.totals}
        currency={details.currency}
        couponCode={details.couponCode}
        shippingPlaceholder={<span className="text-amber-800">{t('cart.notAvailable')}</span>}
        snapshot={RATE_SNAPSHOT}
      />
      <p className="text-xs text-ink-muted">{t('cart.taxNote')}</p>
    </div>
  );
}

/** Sticky sidebar on desktop; collapsible panel on mobile. */
export function OrderSummary({ details, showCoupon = true }: { details: CartDetails; showCoupon?: boolean }) {
  const { t } = useTranslation();
  const money = useMoney();
  const [open, setOpen] = useState(false);

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
            {money.format(details.totals.total)}
          </span>
        </button>
        <div id="mobile-summary" hidden={!open} className="border-t border-sand-200 p-4">
          {open && <SummaryBody details={details} showCoupon={showCoupon} />}
        </div>
      </div>

      <aside aria-labelledby="order-summary-title" className="card hidden p-6 lg:sticky lg:top-36 lg:block">
        <h2 id="order-summary-title" className="mb-5 text-2xl">
          {t('cart.summary')}
        </h2>
        <SummaryBody details={details} showCoupon={showCoupon} />
      </aside>
    </>
  );
}
