import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { returnsApi } from '@/api/returns';
import { exchangesApi } from '@/api/exchanges';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { useLanguage } from '@/hooks/useLocale';
import { formatDate } from '@/utils/dates';
import { cn } from '@/utils/cn';

const STATUS_STYLES: Record<string, string> = {
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
  if (returnsErr && exchangesErr) return <ErrorState onRetry={() => { reloadReturns(); reloadExchanges(); }} />;

  const returns = returnsData?.items ?? [];
  const exchanges = exchangesData?.items ?? [];

  // Merge and sort by date descending
  type ListItem =
    | { kind: 'return'; ref: string; status: string; requestedAt: string; reason: string; qty: number; refundStatus?: string }
    | { kind: 'exchange'; ref: string; status: string; requestedAt: string; reason: string; qty: number };

  const items: ListItem[] = [
    ...returns.map(r => ({
      kind: 'return' as const,
      ref: r.reference,
      status: r.status,
      requestedAt: r.requestedAt,
      reason: r.reason,
      qty: r.requestedQty,
      refundStatus: r.refund?.status,
    })),
    ...exchanges.map(e => ({
      kind: 'exchange' as const,
      ref: e.reference,
      status: e.status,
      requestedAt: e.requestedAt,
      reason: e.reason,
      qty: e.requestedQty,
    })),
  ].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">{t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' })}</h2>
      {items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="h-7 w-7" aria-hidden />}
          title={t('returns.empty')}
          actions={<Link to="/account/orders" className="btn btn-secondary text-sm">{t('account.backToOrders')}</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.kind}:${item.ref}`}>
              <Link
                to={item.kind === 'return' ? `/account/returns/${item.ref}` : `/account/exchanges/${item.ref}`}
                className="card block p-4 transition hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-ink">{item.ref}</span>
                    <span className={cn(
                      'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      item.kind === 'return'
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    )}>
                      {item.kind === 'return'
                        ? t('returns.typeReturn', { defaultValue: 'Return' })
                        : t('returns.typeExchange', { defaultValue: 'Exchange' })}
                    </span>
                  </div>
                  <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[item.status] ?? STATUS_STYLES.closed)}>
                    {item.kind === 'return'
                      ? t(`returns.status.${item.status}`, { defaultValue: item.status })
                      : t(`exchange.status.${item.status}`, { defaultValue: item.status.replace(/_/g, ' ') })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {t('returns.requestedOn', { date: formatDate(item.requestedAt, lang) })}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {item.kind === 'return'
                    ? t(`returns.reason.${item.reason}`, { defaultValue: item.reason })
                    : t(`exchange.reason.${item.reason}`, { defaultValue: item.reason.replace(/_/g, ' ') })}
                  {' '}· {t('returns.qty', { count: item.qty })}
                </p>
                {item.kind === 'return' && item.refundStatus && (
                  <p className={cn('mt-1 text-xs font-medium', item.refundStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700')}>
                    {t(`returns.refundStatus.${item.refundStatus}`, { defaultValue: item.refundStatus })}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
