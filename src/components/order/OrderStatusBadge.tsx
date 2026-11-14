import { useTranslation } from 'react-i18next';
import type { OrderStatus } from '@/types';
import { cn } from '@/utils/cn';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const styles: Record<OrderStatus, string> = {
    placed: 'bg-sky-50 text-sky-900 border-sky-200',
    processing: 'bg-amber-50 text-amber-900 border-amber-200',
    shipped: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    delivered: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    cancelled: 'bg-red-50 text-red-900 border-red-200',
  };
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', styles[status])}>
      {t(`order.status.${status}`)}
    </span>
  );
}
