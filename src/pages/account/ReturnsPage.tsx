import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { returnsApi } from '@/api/returns';
import { exchangesApi } from '@/api/exchanges';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { useLanguage } from '@/hooks/useLocale';
import { formatDate } from '@/utils/dates';
import { cn } from '@/utils/cn';

const REQUEST_STATUS_STYLES: Record<string, string> = {
  requested: 'bg-sky-50 text-sky-900 border-sky-200',
  approved: 'bg-amber-50 text-amber-900 border-amber-200',
  rejected: 'bg-red-50 text-red-900 border-red-200',
  shipping_arranged: 'bg-purple-50 text-purple-900 border-purple-200',
  in_transit: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  received: 'bg-teal-50 text-teal-900 border-teal-200',
  inspected: 'bg-orange-50 text-orange-900 border-orange-200',
  refunded: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  shipped: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  closed: 'bg-sand-100 text-ink-muted border-sand-200',
  withdrawn: 'bg-sand-100 text-ink-muted border-sand-200',
};

/** Is this request still active (not yet closed/completed)? */
function isActive(kind: 'return' | 'exchange', status: string): boolean {
  if (kind === 'return') return !['withdrawn', 'closed', 'refunded'].includes(status);
  return !['withdrawn', 'closed', 'delivered'].includes(status);
}

export default function ReturnsPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle(t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' }));

  const { data: returnsData, error: returnsErr, isLoading: returnsLoading, reload: reloadReturns } =
    useAsync(`returns:list:${user.id}`, returnsApi.listReturns);

  const { data: exchangesData, error: exchangesErr, isLoading: exchangesLoading, reload: reloadExchanges } =
    useAsync(`exchanges:list:${user.id}`, exchangesApi.listExchanges);

  if (returnsLoading || exchangesLoading) return <Spinner />;
  if (returnsErr && exchangesErr)
    return <ErrorState onRetry={() => { reloadReturns(); reloadExchanges(); }} />;

  const returns = returnsData?.items ?? [];
  const exchanges = exchangesData?.items ?? [];

  type ListItem = {
    kind: 'return' | 'exchange';
    ref: string;
    status: string;
    requestedAt: string;
    reason: string;
    qty: number;
    refundStatus?: string;
  };

  const all: ListItem[] = [
    ...returns.map((r) => ({
      kind: 'return' as const,
      ref: r.reference,
      status: r.status,
      requestedAt: r.requestedAt,
      reason: r.reason,
      qty: r.requestedQty,
      refundStatus: r.refund?.status,
    })),
    ...exchanges.map((e) => ({
      kind: 'exchange' as const,
      ref: e.reference,
      status: e.status,
      requestedAt: e.requestedAt,
      reason: e.reason,
      qty: e.requestedQty,
    })),
  ].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const active = all.filter((i) => isActive(i.kind, i.status));
  const past = all.filter((i) => !isActive(i.kind, i.status));

  const renderItem = (item: ListItem) => {
    const to = item.kind === 'return' ? `/account/returns/${item.ref}` : `/account/exchanges/${item.ref}`;
    const reasonKey = item.kind === 'return'
      ? `returns.reason.${item.reason}`
      : `exchange.reason.${item.reason}`;
    const statusKey = item.kind === 'return'
      ? `returns.status.${item.status}`
      : `exchange.status.${item.status}`;

    return (
      <li key={`${item.kind}:${item.ref}`}>
        <div className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            {/* Left: ref + type tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-ink">{item.ref}</span>
              <span className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                item.kind === 'return'
                  ? 'border-brand-200 bg-brand-50 text-brand-700'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700',
              )}>
                {item.kind === 'return'
                  ? t('returns.typeReturn', { defaultValue: 'Return' })
                  : t('returns.typeExchange', { defaultValue: 'Exchange' })}
              </span>
            </div>

            {/* Status */}
            <span className={cn(
              'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              REQUEST_STATUS_STYLES[item.status] ?? REQUEST_STATUS_STYLES.closed,
            )}>
              {t(statusKey, { defaultValue: item.status.replace(/_/g, ' ') })}
            </span>
          </div>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="text-sm text-ink-soft">
              <p>
                {t(reasonKey, { defaultValue: item.reason.replace(/_/g, ' ') })}
                {' · '}
                {t('returns.qty', { count: item.qty })}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {t('returns.requestedOn', { date: formatDate(item.requestedAt, lang) })}
              </p>
              {item.kind === 'return' && item.refundStatus && (
                <p className={cn('mt-1 text-xs font-medium', item.refundStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700')}>
                  {t(`returns.refundStatus.${item.refundStatus}`, { defaultValue: item.refundStatus })}
                </p>
              )}
            </div>

            <Link
              to={to}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink-muted hover:bg-sand-50"
            >
              {t('returns.viewRequest', { defaultValue: 'View request' })}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </li>
    );
  };

  if (all.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-ink">
          {t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' })}
        </h1>
        <EmptyState
          icon={<RotateCcw className="h-7 w-7" aria-hidden />}
          title={t('returns.empty')}
          actions={
            <Link to="/account/orders" className="btn btn-secondary text-sm">
              {t('account.backToOrders')}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-ink">
        {t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' })}
      </h1>

      {active.length > 0 && (
        <section aria-labelledby="active-section">
          <h2 id="active-section" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {t('returns.activeRequests', { defaultValue: 'Active' })}
          </h2>
          <ul className="space-y-3">{active.map(renderItem)}</ul>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-section">
          <h2 id="past-section" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {t('returns.pastRequests', { defaultValue: 'Past' })}
          </h2>
          <ul className="space-y-3">{past.map(renderItem)}</ul>
        </section>
      )}
    </div>
  );
}
