import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Circle } from 'lucide-react';
import { exchangesApi } from '@/api/exchanges';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { useLanguage } from '@/hooks/useLocale';
import { formatDate } from '@/utils/dates';
import type { ExchangeRequest } from '@/types';
import { cn } from '@/utils/cn';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-sky-50 text-sky-900 border-sky-200',
  approved: 'bg-amber-50 text-amber-900 border-amber-200',
  rejected: 'bg-red-50 text-red-900 border-red-200',
  shipped: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  closed: 'bg-sand-100 text-ink-muted border-sand-200',
  withdrawn: 'bg-sand-100 text-ink-muted border-sand-200',
};

const TIMELINE_STEPS = ['requested', 'approved', 'shipped', 'delivered', 'closed'] as const;

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[status] ?? STATUS_STYLES.closed)}>
      {t(`exchange.status.${status}`, { defaultValue: status.replace(/_/g, ' ') })}
    </span>
  );
}

function WithdrawSection({ exc }: { exc: ExchangeRequest }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (exc.status !== 'requested') return null;

  const withdraw = async () => {
    setLoading(true); setErr(null);
    try {
      await exchangesApi.withdrawExchange(exc.reference);
      invalidateQueries(`exchange:${exc.reference}`);
      invalidateQueries('returns:list:');
      navigate('/account/returns');
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };

  return (
    <div className="card p-4 border-red-100 mt-4">
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)}
          className="text-sm text-red-600 hover:text-red-800 underline underline-offset-2">
          {t('exchange.withdraw', { defaultValue: 'Withdraw exchange request' })}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{t('exchange.confirmWithdraw', { defaultValue: 'Withdraw this exchange request?' })}</p>
          {err && <p className="text-xs text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={withdraw} disabled={loading}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50">
              {loading ? t('common.saving') : t('exchange.confirmWithdrawBtn', { defaultValue: 'Yes, withdraw' })}
            </button>
            <button type="button" onClick={() => setConfirm(false)}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExchangeDetailPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const { ref = '' } = useParams();
  useAuth((s) => s.user);
  useDocumentTitle(ref ? `${t('exchange.title', { defaultValue: 'Exchange' })} ${ref}` : t('account.title'));

  const { data: exc, error, isLoading, reload } = useAsync(
    `exchange:${ref}`,
    () => exchangesApi.getExchange(ref),
  );

  if (isLoading) return <Spinner />;
  if (error || !exc) return <ErrorState onRetry={reload} />;

  const fmt = (d: string) => formatDate(d, lang, { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtFull = (d: string) => formatDate(d, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const reachedStep = TIMELINE_STEPS.indexOf(exc.status as typeof TIMELINE_STEPS[number]);

  return (
    <div className="space-y-6">
      <Link to="/account/returns" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('account.backToReturns', { defaultValue: 'Back to returns & exchanges' })}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold font-mono">{exc.reference}</h2>
        <StatusBadge status={exc.status} />
      </div>
      <p className="text-sm text-ink-muted">{t('exchange.requestedOn', { date: fmt(exc.requestedAt), defaultValue: `Requested ${fmt(exc.requestedAt)}` })}</p>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* Main */}
        <div className="space-y-5">
          {/* Details */}
          <section className="card p-5 text-sm space-y-2">
            <h3 className="font-semibold">{t('exchange.details', { defaultValue: 'Exchange details' })}</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-ink-muted">{t('exchange.qty', { defaultValue: 'Quantity' })}</dt>
              <dd>{exc.requestedQty}</dd>
              <dt className="text-ink-muted">{t('exchange.reasonLabel', { defaultValue: 'Reason' })}</dt>
              <dd>{t(`exchange.reason.${exc.reason}`, { defaultValue: exc.reason.replace(/_/g, ' ') })}</dd>
              {exc.priceDifference !== 0 && (
                <>
                  <dt className="text-ink-muted">{t('exchange.priceDifference', { defaultValue: 'Price difference' })}</dt>
                  <dd className={exc.priceDifference > 0 ? 'text-red-700' : 'text-emerald-700'}>
                    {exc.priceDifference > 0 ? `+${exc.priceDifference}` : exc.priceDifference}
                  </dd>
                </>
              )}
              {exc.approvedQty && (
                <>
                  <dt className="text-ink-muted">{t('exchange.approvedQty', { defaultValue: 'Approved qty' })}</dt>
                  <dd>{exc.approvedQty}</dd>
                </>
              )}
              {exc.replacementCarrier && (
                <>
                  <dt className="text-ink-muted">{t('exchange.carrier', { defaultValue: 'Carrier' })}</dt>
                  <dd>{exc.replacementCarrier}</dd>
                  <dt className="text-ink-muted">{t('order.tracking', { defaultValue: 'Tracking' })}</dt>
                  <dd className="font-mono">{exc.replacementTracking}</dd>
                </>
              )}
              {exc.customerNote && (
                <>
                  <dt className="text-ink-muted">{t('returns.note', { defaultValue: 'Note' })}</dt>
                  <dd>{exc.customerNote}</dd>
                </>
              )}
            </dl>
          </section>

          {/* Timeline */}
          <section className="card p-5">
            <h3 className="mb-4 font-semibold text-sm">{t('returns.timeline')}</h3>
            <ol className="relative space-y-5">
              {exc.events.map((ev, i) => (
                <li key={ev.id} className="relative flex gap-3">
                  {i < exc.events.length - 1 && (
                    <span className="absolute left-[11px] top-6 h-[calc(100%+0.25rem)] w-0.5 bg-sand-200" aria-hidden />
                  )}
                  <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{t(`exchange.event.${ev.type}`, { defaultValue: ev.type.replace(/_/g, ' ') })}</p>
                    {ev.message && <p className="text-xs text-ink-muted mt-0.5">{ev.message}</p>}
                    <p className="text-xs text-ink-muted mt-0.5">{fmtFull(ev.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <WithdrawSection exc={exc} />
        </div>

        {/* Sidebar: status steps */}
        <div>
          <section className="card p-5">
            <h3 className="mb-4 font-semibold text-sm">{t('order.statusLabel')}</h3>
            <ol className="relative space-y-5">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= reachedStep;
                const rejected = exc.status === 'rejected' && step === 'approved';
                return (
                  <li key={step} className="relative flex gap-3">
                    {i < TIMELINE_STEPS.length - 1 && (
                      <span className={cn('absolute left-[11px] top-6 h-[calc(100%+0.25rem)] w-0.5', done ? 'bg-emerald-600' : 'bg-sand-200')} aria-hidden />
                    )}
                    <span className={cn('relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      rejected ? 'bg-red-600 text-white' : done ? 'bg-emerald-600 text-white' : 'border-2 border-sand-300 bg-white text-sand-300',
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" fill="currentColor" />}
                    </span>
                    <p className={cn('mt-0.5 text-sm', done ? 'font-medium text-ink' : 'text-ink-muted')}>
                      {t(`exchange.status.${step}`, { defaultValue: step.replace(/_/g, ' ') })}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
