import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, PackageSearch } from 'lucide-react';
import { AddressBlock } from '@/components/checkout/AddressBlock';
import { OrderLines, OrderTotals } from '@/components/order/OrderParts';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/session';
import { deliveryWindow, formatDate, formatShortDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export default function OrderSuccessPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { orderId = '' } = useParams();
  const user = useAuth((s) => s.user);
  const { data: order, error, isLoading, reload } = useAsync(`order:${orderId}`, () => orderService.get(orderId));
  useDocumentTitle(order ? `${t('order.orderNumber')} ${order.number}` : t('order.successTitle'));

  if (isLoading) return <Spinner className="py-32" />;
  if (!order) {
    if (error instanceof ApiError && error.code === 'not_found') {
      return (
        <EmptyState
          icon={<PackageSearch className="h-7 w-7" aria-hidden />}
          title={t('order.notFoundTitle')}
          body={t('order.notFoundBody')}
          actions={
            <>
              <ButtonLink to="/shop">{t('order.continueShopping')}</ButtonLink>
              <ButtonLink to="/track-order" variant="outline">
                {t('order.trackOrder')}
              </ButtonLink>
            </>
          }
          className="py-24"
        />
      );
    }
    return <ErrorState onRetry={reload} />;
  }

  const eta = deliveryWindow(order.shippingMethod.minDays, order.shippingMethod.maxDays, new Date(order.createdAt));
  const trackHref = `/track-order?order=${encodeURIComponent(order.number)}&email=${encodeURIComponent(order.email)}`;

  return (
    <div className="container-site max-w-4xl py-10 lg:py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" aria-hidden />
        <h1 className="mt-4 text-4xl lg:text-5xl">{t('order.successTitle')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">{t('order.successBody')}</p>
        <dl className="mx-auto mt-6 inline-flex flex-wrap justify-center gap-x-8 gap-y-2 rounded-xl border border-sand-200 bg-white px-6 py-4 text-left">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">{t('order.orderNumber')}</dt>
            <dd className="font-mono text-lg font-semibold">{order.number}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">{t('common.total')}</dt>
            <dd className="text-lg font-semibold">
              {order.currency} {formatMoney(order.total, order.currency, lang)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">{t('order.estimatedDelivery')}</dt>
            <dd className="text-lg font-semibold">
              {formatShortDate(eta.start, lang)} – {formatShortDate(eta.end, lang)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink-muted">{t('order.placedOn', { date: formatDate(order.createdAt, lang) })}</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
        <section aria-labelledby="items-title" className="card p-5">
          <h2 id="items-title" className="text-2xl">
            {t('order.items')}
          </h2>
          <OrderLines order={order} />
          <div className="mt-4 border-t border-sand-200 pt-4">
            <h3 className="sr-only">{t('order.summary')}</h3>
            <OrderTotals order={order} />
          </div>
        </section>
        <div className="space-y-6">
          <section aria-labelledby="addr-title" className="card p-5">
            <h2 id="addr-title" className="font-sans text-sm font-semibold">
              {t('order.deliveryAddress')}
            </h2>
            <div className="mt-2 text-sm">
              <AddressBlock address={order.address} />
            </div>
          </section>
          <section aria-labelledby="ship-title" className="card p-5 text-sm">
            <h2 id="ship-title" className="font-sans text-sm font-semibold">
              {t('order.shippingMethod')}
            </h2>
            <p className="mt-2 text-ink-soft">
              {t(`checkout.methods.${order.shippingMethod.id}`)} · {t('checkout.businessDays', { min: order.shippingMethod.minDays, max: order.shippingMethod.maxDays })}
            </p>
            <h2 className="mt-4 font-sans text-sm font-semibold">{t('order.payment')}</h2>
            <p className="mt-2 text-ink-soft">{t(`checkout.paymentMethods.${order.paymentMethod}`)}</p>
          </section>
        </div>
      </div>

      <section aria-labelledby="next-title" className="mt-10 text-center">
        <h2 id="next-title" className="text-3xl">
          {t('order.next')}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-ink-muted">{t('order.nextBody')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to={trackHref} variant="outline">
            {t('order.trackOrder')}
          </ButtonLink>
          {user ? (
            <ButtonLink to="/account/orders" variant="outline">
              {t('order.viewOrders')}
            </ButtonLink>
          ) : (
            <ButtonLink to="/register" variant="outline">
              {t('order.createAccount')}
            </ButtonLink>
          )}
          <ButtonLink to="/shop">{t('order.continueShopping')}</ButtonLink>
        </div>
      </section>
    </div>
  );
}
