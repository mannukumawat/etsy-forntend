import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, PackageSearch } from 'lucide-react';
import { AddressBlock } from '@/components/checkout/AddressBlock';
import { OrderLines, OrderStatusBadge, OrderTimeline, OrderTotals } from '@/components/order/OrderParts';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/session';
import { formatDate } from '@/utils/dates';

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { orderId = '' } = useParams();
  const user = useAuth((s) => s.user)!;
  const { data: order, error, isLoading, reload } = useAsync(`order:${orderId}`, () => orderService.getMine(orderId));
  useDocumentTitle(order ? `${t('order.orderNumber')} ${order.number}` : t('account.orders'));

  if (isLoading) return <Spinner />;
  // Only show orders that belong to the signed-in customer.
  if (!order || order.userId !== user.id) {
    if (!order && !(error instanceof ApiError && error.code === 'not_found')) return <ErrorState onRetry={reload} />;
    return (
      <EmptyState
        icon={<PackageSearch className="h-7 w-7" aria-hidden />}
        title={t('order.notFoundTitle')}
        body={t('order.notFoundBody')}
        actions={<ButtonLink to="/account/orders">{t('account.backToOrders')}</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('account.backToOrders')}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl">
          {t('order.orderNumber')} <span className="font-mono text-2xl">{order.number}</span>
        </h2>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-ink-muted">{t('order.placedOn', { date: formatDate(order.createdAt, lang) })}</p>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section aria-labelledby="od-items" className="card p-5">
          <h3 id="od-items" className="text-2xl">
            {t('order.items')}
          </h3>
          <OrderLines order={order} reviewLinks />
          <div className="mt-4 border-t border-sand-200 pt-4">
            <OrderTotals order={order} />
          </div>
        </section>
        <div className="space-y-6">
          <section aria-labelledby="od-status" className="card p-5">
            <h3 id="od-status" className="mb-4 font-sans text-sm font-semibold">
              {t('order.statusLabel')}
            </h3>
            <OrderTimeline order={order} />
            {order.tracking && (
              <p className="mt-4 text-sm text-ink-soft">
                {order.tracking.carrier} · <span className="font-mono">{order.tracking.number}</span>
              </p>
            )}
          </section>
          <section aria-labelledby="od-address" className="card p-5 text-sm">
            <h3 id="od-address" className="font-sans text-sm font-semibold">
              {t('order.deliveryAddress')}
            </h3>
            <div className="mt-2">
              <AddressBlock address={order.address} />
            </div>
            <h3 className="mt-4 font-sans text-sm font-semibold">{t('order.shippingMethod')}</h3>
            <p className="mt-1 text-ink-soft">{t(`checkout.methods.${order.shippingMethod.id}`)}</p>
            <h3 className="mt-4 font-sans text-sm font-semibold">{t('order.payment')}</h3>
            <p className="mt-1 text-ink-soft">{t(`checkout.paymentMethods.${order.paymentMethod}`)}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
