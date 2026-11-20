import { useTranslation } from 'react-i18next';
import { IndianRupee, RotateCcw } from 'lucide-react';
import { returnsApi } from '@/api/returns';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { useLanguage } from '@/hooks/useLocale';
import { formatDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/cn';
import type { LanguageCode, ReturnRequest } from '@/types';

const REFUND_STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-800 border-amber-200',
  processing: 'bg-sky-50 text-sky-800 border-sky-200',
  completed:  'bg-emerald-50 text-emerald-800 border-emerald-200',
  failed:     'bg-red-50 text-red-800 border-red-200',
};

function RefundCard({ ret, lang }: { ret: ReturnRequest; lang: LanguageCode }) {
  const { t } = useTranslation();
  const refund = ret.refund;
  const amount = refund?.amount ?? ret.refundAmount ?? ret.refundableAmount;
  const status = refund?.status ?? (ret.status === 'refunded' ? 'completed' : 'pending');
  const method = refund?.method ?? (ret.shippingMethod ? 'bank' : '—');

  const methodLabel: Record<string, string> = {
    original: 'Original payment method',
    manual_bank: 'Bank transfer',
    manual_upi: 'UPI',
    store_credit: 'Store credit',
  };

  return (
    <div className="rounded-xl border border-sand-200 bg-white px-5 py-4 space-y-3">
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-ink">{ret.reference}</span>
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            Return
          </span>
        </div>
        <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', REFUND_STATUS_STYLES[status] ?? REFUND_STATUS_STYLES.pending)}>
          {t(`returns.refundStatus.${status}`, { defaultValue: status })}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <IndianRupee className="h-4 w-4 text-emerald-700" aria-hidden />
        <span className="text-xl font-bold text-emerald-700">
          {formatMoney(amount, 'INR', lang)}
        </span>
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <dt className="text-ink-muted">Method</dt>
        <dd className="text-ink">{methodLabel[method] ?? method}</dd>

        <dt className="text-ink-muted">Requested</dt>
        <dd className="text-ink">{formatDate(ret.requestedAt, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</dd>

        {refund?.completedAt && (
          <>
            <dt className="text-ink-muted">Refunded on</dt>
            <dd className="text-ink">{formatDate(refund.completedAt, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
          </>
        )}

        {refund?.reference && (
          <>
            <dt className="text-ink-muted">Reference</dt>
            <dd className="font-mono text-ink">{refund.reference}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

export default function MyPaymentsPage() {
  const lang = useLanguage();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle('My Payments');

  const { data, error, isLoading, reload } = useAsync(`returns:list:${user.id}`, returnsApi.listReturns);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState onRetry={reload} />;

  const returns = data?.items ?? [];
  // Show only returns that have a refund or are past the requested stage
  const refundable = returns.filter((r) =>
    r.refund !== null || ['refunded', 'inspected', 'received'].includes(r.status),
  );
  const pending = returns.filter((r) =>
    r.refund === null && ['requested', 'approved', 'shipping_arranged', 'in_transit'].includes(r.status),
  );

  const totalRefunded = returns
    .filter((r) => r.refund?.status === 'completed')
    .reduce((sum, r) => sum + (r.refund?.amount ?? 0), 0);

  if (returns.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-ink">My Payments</h1>
        <EmptyState
          icon={<RotateCcw className="h-7 w-7" aria-hidden />}
          title="No refunds yet"
          body="Refunds from returns will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">My Payments</h1>
        {totalRefunded > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
            <p className="text-xs text-emerald-700">Total refunded</p>
            <p className="font-bold text-emerald-800">{formatMoney(totalRefunded, 'INR', lang)}</p>
          </div>
        )}
      </div>

      {refundable.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Refunds</h2>
          {refundable.map((r) => <RefundCard key={r.id} ret={r} lang={lang} />)}
        </section>
      )}

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Pending Refunds</h2>
          {pending.map((r) => <RefundCard key={r.id} ret={r} lang={lang} />)}
        </section>
      )}
    </div>
  );
}
