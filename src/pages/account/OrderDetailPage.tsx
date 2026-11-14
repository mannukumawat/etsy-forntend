import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, PackageSearch } from 'lucide-react';
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

/** True only when the carrier and tracking number look like real data, not a placeholder. */
function hasRealTracking(tracking: { carrier: string; number: string } | undefined): tracking is { carrier: string; number: string } {
  if (!tracking) return false;
  const lc = `${tracking.carrier} ${tracking.number}`.toLowerCase();
  // Reject values that are clearly test/placeholder entries.
  return !/(^|\s)test(\s|$)/.test(lc) && tracking.carrier.trim().length > 1 && tracking.number.trim().length > 1;
}

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

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const deliveredEntry = order.timeline.find((e) => e.status === 'delivered');
  const showTracking = hasRealTracking(order.tracking);
  const isCod = order.paymentMethod === 'cod';
  const codCollected = (order as any).codCollectedAt != null;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('account.backToOrders')}
      </Link>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-ink">
            {t('order.orderNumber')} <span className="font-mono">{order.number}</span>
          </h1>
          {!isDelivered && <OrderStatusBadge status={order.status} />}
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {t('order.placedOn', { date: formatDate(order.createdAt, lang) })}
        </p>

        {/* Prominent delivered line */}
        {isDelivered && deliveredEntry && (
          <p className="mt-2 text-base font-semibold text-emerald-700">
            {t('order.deliveredOn', {
              date: formatDate(deliveredEntry.date, lang, { day: 'numeric', month: 'long', year: 'numeric' }),
              defaultValue: `Delivered on ${formatDate(deliveredEntry.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}`,
            })}
          </p>
        )}
      </div>

      {/* Two-column on desktop */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Main: items */}
        <div className="space-y-5 min-w-0">
          <section aria-labelledby="od-items" className="card p-5">
            <h2 id="od-items" className="mb-4 text-sm font-semibold text-ink">
              {t('order.items')}
            </h2>
            <OrderLines order={order} reviewLinks />
          </section>

          {/* Shipment history — always collapsed for delivered orders */}
          {!isCancelled && (
            <section className="card overflow-hidden p-0">
              {isDelivered ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 text-sm font-semibold text-ink select-none hover:bg-sand-50">
                    {t('order.viewShipmentHistory', { defaultValue: 'View shipment history' })}
                    <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-sand-100 px-5 pb-5 pt-4">
                    <OrderTimeline order={order} />
                    {showTracking && (
                      <p className="mt-4 text-sm text-ink-soft">
                        {order.tracking!.carrier}{' '}
                        <span className="text-ink-muted">·</span>{' '}
                        <span className="font-mono">{order.tracking!.number}</span>
                      </p>
                    )}
                  </div>
                </details>
              ) : (
                <div className="p-5">
                  <h2 className="mb-4 text-sm font-semibold text-ink">
                    {showTracking ? t('order.tracking', { defaultValue: 'Shipment tracking' }) : t('order.statusLabel')}
                  </h2>
                  <OrderTimeline order={order} />
                  {showTracking && (
                    <p className="mt-4 text-sm text-ink-soft">
                      {order.tracking!.carrier}{' '}
                      <span className="text-ink-muted">·</span>{' '}
                      <span className="font-mono">{order.tracking!.number}</span>
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Cancelled timeline */}
          {isCancelled && (
            <section aria-labelledby="od-status" className="card p-5">
              <h2 id="od-status" className="mb-4 text-sm font-semibold text-ink">
                {t('order.statusLabel')}
              </h2>
              <OrderTimeline order={order} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <section aria-labelledby="od-summary" className="card p-5">
            <h2 id="od-summary" className="mb-3 text-sm font-semibold text-ink">
              {t('order.summary', { defaultValue: 'Order summary' })}
            </h2>
            <OrderTotals order={order} />
          </section>

          <section aria-labelledby="od-payment" className="card p-5 text-sm">
            <h2 id="od-payment" className="mb-3 text-sm font-semibold text-ink">
              {t('order.payment')}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-ink-muted">{t('order.paymentMethod', { defaultValue: 'Method' })}</p>
                <p className="mt-0.5 text-ink">{t(`checkout.paymentMethods.${order.paymentMethod}`)}</p>
              </div>
              {isCod && (
                <div>
                  <p className="text-xs text-ink-muted">{t('order.paymentStatus', { defaultValue: 'Payment status' })}</p>
                  <p className={`mt-0.5 font-medium ${codCollected ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {codCollected
                      ? t('order.codCollected', { defaultValue: 'Collected' })
                      : t('order.codPending', { defaultValue: 'Due on delivery' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-ink-muted">{t('order.shippingMethod')}</p>
                <p className="mt-0.5 text-ink">{t(`checkout.methods.${order.shippingMethod.id}`)}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="od-address" className="card p-5 text-sm">
            <h2 id="od-address" className="mb-2 text-sm font-semibold text-ink">
              {t('order.deliveryAddress')}
            </h2>
            <AddressBlock address={order.address} />
          </section>
        </div>
      </div>
    </div>
  );
}
