import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Package } from 'lucide-react';
import { OrderStatusBadge } from '@/components/order/OrderParts';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/session';
import { formatDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export default function OrdersPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const loc = useLocalized();
  useDocumentTitle(t('account.orders'));
  const user = useAuth((s) => s.user)!;
  const { data, isError, reload } = useAsync(`orders:${user.id}`, () => orderService.listForUser(user.id));

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="text-3xl font-semibold text-ink">
        {t('account.orders')}
      </h2>
      <div className="mt-6">
        {isError ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="space-y-3" role="status" aria-label={t('common.loading')}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState icon={<Package className="h-7 w-7" aria-hidden />} title={t('account.noOrders')} actions={<ButtonLink to="/shop">{t('cart.startShopping')}</ButtonLink>} />
        ) : (
          <ul className="space-y-4">
            {data.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/account/orders/${o.id}`}
                  className="card block p-4 transition hover:shadow-md sm:p-5"
                  aria-label={`${t('order.orderNumber')} ${o.number}`}
                >
                  {/* Header: order number + status badge + chevron */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-ink">{o.number}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  </div>

                  {/* Date + total */}
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-0.5 text-sm text-ink-muted">
                    <span>{formatDate(o.createdAt, lang)}</span>
                    <span className="font-medium text-ink">
                      {o.currency} {formatMoney(o.total, o.currency, lang)}
                    </span>
                  </div>

                  {/* Product thumbnails + names */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <ul className="flex -space-x-2" aria-hidden>
                      {o.lines.slice(0, 5).map((l) => (
                        <li key={l.variantId}>
                          <img
                            src={l.image.src}
                            alt=""
                            title={loc(l.name)}
                            className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm"
                            loading="lazy"
                          />
                        </li>
                      ))}
                      {o.lines.length > 5 && (
                        <li className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-sand-100 text-xs font-semibold text-ink-muted shadow-sm">
                          +{o.lines.length - 5}
                        </li>
                      )}
                    </ul>
                    <p className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                      {o.lines.map((l) => loc(l.name)).join(', ')}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
