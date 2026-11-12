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

  const deliveredEntry = order.timeline.find((e) => e.status === 'delivered');

  return (
    <div className="space-y-5">
      {/* Header */}
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('account.backToOrders')}
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">
              {t('order.orderNumber')} <span className="font-mono">{order.number}</span>
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">{t('order.placedOn', { date: formatDate(order.createdAt, lang) })}</p>
          {deliveredEntry && (
            <p className="mt-0.5 text-sm text-emerald-700 font-medium">
              {t('order.deliveredOn', { date: formatDate(deliveredEntry.date, lang), defaultValue: `Delivered ${formatDate(deliveredEntry.date, lang)}` })}
            </p>
          )}
        </div>
      </div>

      {/* Two-column on desktop, stacked on mobile */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Main: items + tracking */}
        <div className="space-y-5 min-w-0">
          <section aria-labelledby="od-items" className="card p-5">
            <h3 id="od-items" className="mb-4 text-base font-semibold">{t('order.items')}</h3>
            <OrderLines order={order} reviewLinks />
          </section>

          {(order.tracking || order.status === 'shipped' || order.status === 'delivered') && (
            <section aria-labelledby="od-tracking" className="card p-5">
              <h3 id="od-tracking" className="mb-3 text-base font-semibold">{t('order.tracking', { defaultValue: 'Shipment tracking' })}</h3>
              <OrderTimeline order={order} />
              {order.tracking && (
                <p className="mt-4 text-sm text-ink-soft">
                  {order.tracking.carrier} · <span className="font-mono">{order.tracking.number}</span>
                </p>
              )}
            </section>
          )}

          {!order.tracking && order.status !== 'shipped' && order.status !== 'delivered' && (
            <section aria-labelledby="od-status" className="card p-5">
              <h3 id="od-status" className="mb-3 text-base font-semibold">{t('order.statusLabel')}</h3>
              <OrderTimeline order={order} />
            </section>
          )}
        </div>

        {/* Sidebar: summary + payment + address */}
        <div className="space-y-5">
          <section aria-labelledby="od-summary" className="card p-5">
            <h3 id="od-summary" className="mb-3 text-base font-semibold">{t('order.summary', { defaultValue: 'Order summary' })}</h3>
            <OrderTotals order={order} />
          </section>

          <section aria-labelledby="od-payment" className="card p-5 text-sm space-y-4">
            <div>
              <h3 id="od-payment" className="font-semibold text-sm">{t('order.payment')}</h3>
              <p className="mt-1 text-ink-soft">{t(`checkout.paymentMethods.${order.paymentMethod}`)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{t('order.shippingMethod')}</h3>
              <p className="mt-1 text-ink-soft">{t(`checkout.methods.${order.shippingMethod.id}`)}</p>
            </div>
          </section>

          <section aria-labelledby="od-address" className="card p-5 text-sm">
            <h3 id="od-address" className="font-semibold text-sm">{t('order.deliveryAddress')}</h3>
            <div className="mt-2">
              <AddressBlock address={order.address} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
