import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MapPin, Package, RotateCcw } from 'lucide-react';
import { OrderStatusBadge } from '@/components/order/OrderParts';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { orderService } from '@/services/orderService';
import { returnsApi } from '@/api/returns';
import { exchangesApi } from '@/api/exchanges';
import { useAuth } from '@/store/session';
import { formatDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export default function AccountPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const loc = useLocalized();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle(t('account.title'));

  const orders = useAsync(`orders:${user.id}`, () => orderService.listForUser(user.id));
  const returnsData = useAsync(`returns:list:${user.id}`, returnsApi.listReturns);
  const exchangesData = useAsync(`exchanges:list:${user.id}`, exchangesApi.listExchanges);

  const latestOrder = orders.data?.[0];
  const activeReturns = (returnsData.data?.items ?? []).filter(
    (r) => !['withdrawn', 'closed', 'refunded'].includes(r.status),
  );
  const activeExchanges = (exchangesData.data?.items ?? []).filter(
    (e) => !['withdrawn', 'closed', 'delivered'].includes(e.status),
  );
  const activeRequests = [...activeReturns, ...activeExchanges];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {t('account.welcome', { name: user.name.split(' ')[0] })}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t('account.memberSince', { date: formatDate(user.createdAt, lang, { month: 'long', year: 'numeric' }) })}
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { to: '/account/orders', label: t('nav.orders'), icon: Package },
          { to: '/account/returns', label: t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' }), icon: RotateCcw },
          { to: '/account/addresses', label: t('nav.addresses'), icon: MapPin },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2.5 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm transition hover:border-sand-300 hover:shadow"
          >
            <Icon className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      {/* Latest order */}
      <section aria-labelledby="latest-order-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="latest-order-title" className="text-base font-semibold text-ink">
            {t('account.latestOrder', { defaultValue: 'Latest order' })}
          </h2>
          <Link
            to="/account/orders"
            className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            {t('common.viewAll')} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {orders.isError ? (
          <ErrorState onRetry={orders.reload} />
        ) : !orders.data ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : !latestOrder ? (
          <div className="rounded-xl border border-sand-200 bg-white px-5 py-4 text-sm text-ink-muted">
            {t('account.noOrders')}
          </div>
        ) : (
          <Link
            to={`/account/orders/${latestOrder.id}`}
            className="card block p-4 transition hover:shadow-lift sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-ink">{latestOrder.number}</span>
                  <OrderStatusBadge status={latestOrder.status} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">{formatDate(latestOrder.createdAt, lang)}</p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-ink">
                {formatMoney(latestOrder.total, latestOrder.currency, lang)}
              </span>
            </div>
            {latestOrder.lines.length > 0 && (
              <div className="mt-3 flex items-center gap-2 border-t border-sand-200 pt-3">
                <ul className="flex gap-1.5" aria-hidden>
                  {latestOrder.lines.slice(0, 4).map((l) => (
                    <li key={l.variantId}>
                      <img
                        src={l.image.src}
                        alt=""
                        title={loc(l.name)}
                        className="h-10 w-10 rounded-lg border border-sand-200 object-cover"
                        loading="lazy"
                      />
                    </li>
                  ))}
                  {latestOrder.lines.length > 4 && (
                    <li className="flex h-10 w-10 items-center justify-center rounded-lg border border-sand-200 bg-sand-100 text-xs font-semibold text-ink-muted">
                      +{latestOrder.lines.length - 4}
                    </li>
                  )}
                </ul>
                <p className="line-clamp-1 min-w-0 flex-1 text-xs text-ink-soft">
                  {latestOrder.lines.map((l) => loc(l.name)).join(', ')}
                </p>
              </div>
            )}
          </Link>
        )}
      </section>

      {/* Active return / exchange requests */}
      {(returnsData.data || exchangesData.data) && activeRequests.length > 0 && (
        <section aria-labelledby="active-requests-title">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="active-requests-title" className="text-base font-semibold text-ink">
              {t('account.activeRequests', { defaultValue: 'Active requests' })}
            </h2>
            <Link
              to="/account/returns"
              className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {activeRequests.slice(0, 3).map((req) => {
              const isReturn = 'refund' in req;
              const ref = req.reference;
              const to = isReturn ? `/account/returns/${ref}` : `/account/exchanges/${ref}`;
              return (
                <li key={ref}>
                  <Link to={to} className="card flex items-center gap-3 p-4 transition hover:shadow-lift">
                    <RotateCcw className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold text-ink">{ref}</span>
                      <span className={`ml-2 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isReturn ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                        {isReturn ? t('returns.typeReturn', { defaultValue: 'Return' }) : t('returns.typeExchange', { defaultValue: 'Exchange' })}
                      </span>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {t(`returns.status.${req.status}`, { defaultValue: req.status.replace(/_/g, ' ') })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
