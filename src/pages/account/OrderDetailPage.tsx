import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, CreditCard, MapPin, PackageSearch } from 'lucide-react';
import { AddressBlock } from '@/components/checkout/AddressBlock';
import { OrderLines, OrderStatusBadge, OrderTimeline, OrderTotals } from '@/components/order/OrderParts';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { useAuth } from '@/store/session';
import { formatDate } from '@/utils/dates';
import { paymentMethodLabelKey } from '@/utils/paymentMethod';

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
  const related = useAsync(order ? `order-related:${order.id}` : null, async () => {
    const purchased = await productService.getByIds([...new Set(order!.lines.map((line) => line.productId))]);
    const groups = await Promise.all(purchased.slice(0, 2).map((product) => productService.getRelated(product, 6)));
    const purchasedIds = new Set(purchased.map((product) => product.id));
    return [...new Map(groups.flat().filter((product) => !purchasedIds.has(product.id)).map((product) => [product.id, product])).values()].slice(0, 8);
  });
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
  return (
    <div className="space-y-4 md:space-y-5">
      {/* Back link */}
      <Link
        to="/account/orders"
        className="hidden items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('account.backToOrders')}
      </Link>

      {/* Header */}
      <div className="rounded-xl bg-white px-4 py-3 shadow-sm md:bg-transparent md:p-0 md:shadow-none">
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
      <div className="grid gap-3 md:gap-5 lg:grid-cols-[1fr_280px]">
        {/* Main: items */}
        <div className="min-w-0 space-y-3 md:space-y-5">
          <section aria-labelledby="od-items" className="card -mx-4 rounded-none border-x-0 p-4 md:mx-0 md:rounded-2xl md:border-x md:p-5">
            <h2 id="od-items" className="mb-4 text-sm font-semibold text-ink">
              {t('order.items')}
            </h2>
            <OrderLines order={order} reviewLinks />
          </section>

          {/* Shipment history — always collapsed for delivered orders */}
          {!isCancelled && !isDelivered && (
            <section className="card -mx-4 overflow-hidden rounded-none border-x-0 p-0 md:mx-0 md:rounded-2xl md:border-x">
              {isDelivered ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 text-sm font-semibold text-ink select-none hover:bg-sand-50">
                    {t('order.detailsTitle', { defaultValue: 'Order details' })}
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
        <div className="flex flex-col gap-3 md:gap-5">
          <section aria-labelledby="od-summary" className="card order-2 -mx-4 rounded-none border-x-0 p-5 md:mx-0 md:rounded-2xl md:border-x lg:order-1">
            <h2 id="od-summary" className="mb-3 text-sm font-semibold text-ink">
              {t('order.summary', { defaultValue: 'Order summary' })}
            </h2>
            <OrderTotals order={order} />
          </section>

          <section aria-labelledby="od-payment" className="card order-3 -mx-4 rounded-none border-x-0 p-5 text-sm md:mx-0 md:rounded-2xl md:border-x lg:order-2">
            <h2 id="od-payment" className="mb-3 text-sm font-semibold text-ink">
              <CreditCard className="mr-2 inline h-4 w-4 text-brand-700" aria-hidden />
              {t('order.payment')}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-ink-muted">{t('order.paymentMethod', { defaultValue: 'Method' })}</p>
                <p className="mt-0.5 text-ink">{t(paymentMethodLabelKey(order.paymentMethod))}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">{t('order.shippingMethod')}</p>
                <p className="mt-0.5 text-ink">{t(`checkout.methods.${order.shippingMethod.id}`)}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="od-address" className="card order-1 -mx-4 rounded-none border-x-0 p-5 text-sm md:mx-0 md:rounded-2xl md:border-x lg:order-3">
            <h2 id="od-address" className="mb-2 text-sm font-semibold text-ink">
              <MapPin className="mr-2 inline h-4 w-4 text-brand-700" aria-hidden />
              {t('order.deliveryAddress')}
            </h2>
            <AddressBlock address={order.address} />
          </section>
        </div>
      </div>

      <section aria-labelledby="order-related-title" className="-mx-4 border-t border-sand-200 bg-white py-5 md:mx-0 md:rounded-2xl md:border md:p-5">
        <h2 id="order-related-title" className="mb-3 px-4 font-sans text-base font-semibold text-ink md:px-0">
          {t('product.relatedTitle', { defaultValue: 'Related products' })}
        </h2>
        {related.data ? (
          related.data.length > 0 && (
            <ul className="scrollbar-none flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4">
              {related.data.map((product) => (
                <li key={product.id} className="w-[44vw] max-w-48 shrink-0 snap-start md:w-auto md:max-w-none">
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )
        ) : !related.isError ? (
          <div className="flex gap-3 overflow-hidden px-4 md:grid md:grid-cols-4 md:px-0">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-[44vw] shrink-0 md:w-auto"><ProductCardSkeleton /></div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
