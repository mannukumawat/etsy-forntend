import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLocale';
import type { Order } from '@/types';
import { formatRate } from '@/utils/money';
import { TotalsTable } from '../cart/TotalsTable';

export function OrderTotals({ order }: { order: Order }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const rateEntries = Object.entries(order.rateSnapshot ?? {});
  const hasConversion = rateEntries.some(([, rate]) => typeof rate === 'number' && rate !== 1);
  return (
    <div>
      <TotalsTable
        totals={order}
        currency={order.currency}
        couponCode={order.couponCode}
        totalLabel={t('cart.totalCode', { currency: order.currency })}
      />
      {hasConversion && (
        <p className="mt-3 text-xs text-ink-muted">
          {t('order.rateSnapshot', { currency: order.currency, rate: formatRate(order.currency, order.rateSnapshot, lang) })}
        </p>
      )}
    </div>
  );
}
