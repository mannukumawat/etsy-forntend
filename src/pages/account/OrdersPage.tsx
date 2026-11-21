import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Package, Search, SlidersHorizontal, Star } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((order) => {
      const matchesStatus = status === 'all' || (status === 'active'
        ? ['placed', 'processing', 'shipped'].includes(order.status)
        : order.status === status);
      const matchesQuery = !q || order.number.toLowerCase().includes(q) || order.lines.some((line) => loc(line.name).toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [data, loc, query, status]);

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="hidden text-2xl font-semibold text-ink md:block">
        {t('account.orders')}
      </h2>

      <div className="md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-sand-200 pb-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('account.searchOrders', { defaultValue: 'Search orders' })}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white pl-10 pr-3 text-base text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none" />
          </label>
          <label className="relative flex h-11 items-center gap-2 rounded-xl border border-sand-300 bg-white px-3 font-semibold text-ink">
            <SlidersHorizontal className="h-4 w-4 text-brand-700" aria-hidden />
            <span>{t('shop.filters')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('shop.filters')} className="absolute inset-0 cursor-pointer opacity-0">
              <option value="all">{t('common.all', { defaultValue: 'All' })}</option>
              <option value="active">{t('order.active', { defaultValue: 'Active' })}</option>
              <option value="delivered">{t('order.status.delivered')}</option>
              <option value="cancelled">{t('order.status.cancelled')}</option>
            </select>
          </label>
        </div>

        <Link to="/account/payments" className="my-3 flex items-center gap-2 rounded-xl bg-sand-100 px-4 py-3 text-sm font-medium text-ink">
          <span className="flex-1">{t('account.viewBillDetails', { defaultValue: 'View payment and refund details' })}</span>
          <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden />
        </Link>

        {isError ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Package className="h-7 w-7" aria-hidden />} title={t('account.noOrders')} />
        ) : (
          <ul className="-mx-4 divide-y-8 divide-sand-100 border-y border-sand-200 bg-sand-100">
            {filtered.flatMap((order) => order.lines.map((line) => ({ order, line }))).map(({ order, line }) => (
              <li key={`${order.id}-${line.id}`} className="bg-white px-4 py-4">
                <Link to={`/account/orders/${order.id}`} className="block">
                  <div className="flex items-start gap-3">
                    <img src={line.image.src} alt={loc(line.image.alt)} className="h-24 w-20 shrink-0 rounded-lg border border-sand-200 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink">{t(`order.status.${order.status}`)}</p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{loc(line.name)}</p>
                        </div>
                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
                      </div>
                      <p className="mt-2 text-xs text-ink-muted">{loc(line.variantLabel ?? { en: '' }) || t('order.qty', { count: line.quantity })} · {t('order.qty', { count: line.quantity })}</p>
                      <p className="mt-1 text-xs font-medium text-ink">{formatDate(order.createdAt, lang)} · {formatMoney(line.lineTotal, order.currency, lang)}</p>
                    </div>
                  </div>
                  {order.status === 'delivered' && line.returnsAllowed !== false && (
                    <div className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-xs text-ink-soft">
                      {t('returns.available', { defaultValue: 'Return / exchange options are available in order details.' })}
                    </div>
                  )}
                </Link>
                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-sand-200 pt-3">
                    <div>
                      <p className="text-xs text-ink-muted">{t('product.reviewThis')}</p>
                      <div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Link key={star} to={`/account/orders/${order.id}/review/${line.productId}?rating=${star}`} aria-label={t('a11y.stars', { count: star })}><Star className="h-6 w-6 text-ink-muted" /></Link>)}</div>
                    </div>
                    <Link to={`/account/orders/${order.id}/review/${line.productId}`} className="rounded-lg border border-ink px-3 py-2 text-xs font-semibold text-ink">
                      {t('product.writeTitle', { defaultValue: 'Write a review' })}
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 hidden md:block">
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
                  className="card block p-4 transition hover:border-sand-300 hover:shadow-lift sm:p-5"
                  aria-label={`${t('order.orderNumber')} ${o.number}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold text-ink">{o.number}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">{formatDate(o.createdAt, lang)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">
                        <span className="mr-1 text-xs font-medium text-ink-muted">{o.currency}</span>
                        {formatMoney(o.total, o.currency, lang)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 border-t border-sand-200 pt-3">
                    <ul className="flex shrink-0 gap-1.5" aria-hidden>
                      {o.lines.slice(0, 4).map((l) => (
                        <li key={l.variantId}>
                          <img src={l.image.src} alt="" title={loc(l.name)} className="h-11 w-11 rounded-lg border border-sand-200 object-cover" loading="lazy" />
                        </li>
                      ))}
                      {o.lines.length > 4 && (
                        <li className="flex h-11 w-11 items-center justify-center rounded-lg border border-sand-200 bg-sand-100 text-xs font-semibold text-ink-muted">+{o.lines.length - 4}</li>
                      )}
                    </ul>
                    <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug text-ink-soft">{o.lines.map((l) => loc(l.name)).join(', ')}</p>
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
