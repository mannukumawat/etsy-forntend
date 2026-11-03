import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLocale';
import type { CartTotals, CurrencyCode, RateSnapshot } from '@/types';
import { formatMoney, formatRate, localeFor } from '@/utils/money';

interface TotalsTableProps {
  totals: Pick<CartTotals, 'subtotal' | 'discount' | 'shipping' | 'tax' | 'taxRate' | 'total'>;
  currency: CurrencyCode;
  couponCode?: string | null;
  /** Shown instead of the shipping amount when shipping is unknown. */
  shippingPlaceholder?: ReactNode;
  showTax?: boolean;
  totalLabel?: string;
  snapshot?: RateSnapshot;
}

/** Subtotal / discount / shipping / tax / total, always labelled with the currency code. */
export function TotalsTable({ totals, currency, couponCode, shippingPlaceholder, showTax = true, totalLabel, snapshot }: TotalsTableProps) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const fmt = (n: number) => formatMoney(n, currency, lang);
  const pct = new Intl.NumberFormat(localeFor(lang), { style: 'percent', maximumFractionDigits: 1 }).format(totals.taxRate);
  const row = 'flex items-baseline justify-between gap-4 py-1.5';

  return (
    <div className="text-sm">
      <dl>
        <div className={row}>
          <dt className="text-ink-soft">{t('cart.subtotal')}</dt>
          <dd className="font-medium">{fmt(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className={row}>
            <dt className="text-emerald-800">{t('cart.discount', { code: couponCode ?? '' })}</dt>
            <dd className="font-medium text-emerald-800">−{fmt(totals.discount)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-ink-soft">{t('cart.shipping')}</dt>
          <dd className="text-right font-medium">{totals.shipping === null ? (shippingPlaceholder ?? t('cart.calculatedAtCheckout')) : fmt(totals.shipping)}</dd>
        </div>
        {showTax && (
          <div className={row}>
            <dt className="text-ink-soft">{t('cart.tax', { rate: pct })}</dt>
            <dd className="font-medium">{fmt(totals.tax)}</dd>
          </div>
        )}
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-sand-200 pt-3">
          <dt className="font-semibold text-ink">{totalLabel ?? t('cart.totalCode', { currency })}</dt>
          <dd className="font-serif text-2xl font-semibold">
            <span className="mr-1.5 font-sans text-xs font-medium text-ink-muted">{currency}</span>
            {fmt(totals.total)}
          </dd>
        </div>
      </dl>
      {snapshot && currency !== snapshot.base && (
        <p className="mt-3 text-xs text-ink-muted">{t('cart.ratesNote', { rate: formatRate(currency, snapshot, lang), currency })}</p>
      )}
    </div>
  );
}
