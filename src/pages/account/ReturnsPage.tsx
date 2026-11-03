import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { returnsApi } from '@/api/returns';
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
  withdrawn: 'bg-sand-100 text-ink-muted border-sand-200',
  closed: 'bg-sand-100 text-ink-muted border-sand-200',
};

export default function ReturnsPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle(t('returns.title'));

  const { data, error, isLoading, reload } = useAsync(`returns:list:${user.id}`, returnsApi.listReturns);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState onRetry={reload} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl">{t('returns.title')}</h2>
      {items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="h-7 w-7" aria-hidden />}
          title={t('returns.empty')}
          actions={<Link to="/account/orders" className="btn btn-secondary text-sm">{t('account.backToOrders')}</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                to={`/account/returns/${r.reference}`}
                className="card block p-4 transition hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-ink">{r.reference}</span>
                  <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[r.status] ?? STATUS_STYLES.closed)}>
                    {t(`returns.status.${r.status}`, { defaultValue: r.status })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{t('returns.requestedOn', { date: formatDate(r.requestedAt, lang) })}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {t(`returns.reason.${r.reason}`, { defaultValue: r.reason })} · {t('returns.qty', { count: r.requestedQty })}
                </p>
                {r.refund && (
                  <p className={cn('mt-1 text-xs font-medium', r.refund.status === 'completed' ? 'text-emerald-700' : 'text-amber-700')}>
                    {t(`returns.refundStatus.${r.refund.status}`, { defaultValue: r.refund.status })}
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
