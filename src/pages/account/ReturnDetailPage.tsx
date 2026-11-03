import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Circle } from 'lucide-react';
import { returnsApi } from '@/api/returns';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { useLanguage } from '@/hooks/useLocale';
import { formatDate } from '@/utils/dates';
import type { ReturnRequest } from '@/types';
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

const TIMELINE_STEPS = ['requested', 'approved', 'shipping_arranged', 'received', 'inspected', 'refunded'] as const;

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[status] ?? STATUS_STYLES.closed)}>
      {t(`returns.status.${status}`, { defaultValue: status })}
    </span>
  );
}

function WithdrawSection({ ret }: { ret: ReturnRequest }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (ret.status !== 'requested') return null;

  const withdraw = async () => {
    setLoading(true); setErr(null);
    try {
      await returnsApi.withdrawReturn(ret.reference);
      invalidateQueries(`return:${ret.reference}`);
      invalidateQueries('returns:list:');
      navigate('/account/returns');
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };

  return (
    <div className="card p-4 border-red-100 mt-4">
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="text-sm font-medium text-red-700 hover:text-red-800 underline underline-offset-2">
          {t('returns.withdraw')}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-ink">{t('returns.withdrawConfirm')}</p>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={withdraw} disabled={loading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {loading ? '…' : t('common.confirm')}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-semibold">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReturnDetailPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  useAuth((s) => s.user);
  const { ref = '' } = useParams();
  useDocumentTitle(ref || t('returns.title'));

  const { data: ret, error, isLoading, reload } = useAsync(
    `return:${ref}`,
    () => returnsApi.getReturn(ref),
  );

  if (isLoading) return <Spinner />;
  if (error || !ret) return <ErrorState onRetry={reload} />;

  const stepIndex = TIMELINE_STEPS.indexOf(ret.status as any);
  const isRejected = ret.status === 'rejected';
  const isWithdrawn = ret.status === 'withdrawn';

  return (
    <div className="space-y-6">
      <Link to="/account/returns" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('account.backToReturns')}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-2xl font-bold">{ret.reference}</h2>
        <StatusBadge status={ret.status} />
      </div>
      <p className="text-sm text-ink-muted">{t('returns.requestedOn', { date: formatDate(ret.requestedAt, lang) })}</p>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Item info */}
          <section className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t('order.items')}</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-ink">{t(`returns.reason.${ret.reason}`, { defaultValue: ret.reason })}</p>
              {ret.customerNote && <p className="text-ink-muted">{ret.customerNote}</p>}
              <p className="text-ink-muted">{t('returns.qty', { count: ret.requestedQty })}</p>
              {ret.approvedQty != null && ret.approvedQty !== ret.requestedQty && (
                <p className="text-amber-700 text-xs">Approved qty: {ret.approvedQty}</p>
              )}
            </div>
            {ret.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ret.photos.map((id) => (
                  <img
                    key={id}
                    src={`${import.meta.env.VITE_API_BASE_URL ?? ''}/media/${id}`}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover border border-sand-200"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Return progress */}
          {!isWithdrawn && (
            <section className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-ink">{t('returns.timeline')}</h3>
              {isRejected ? (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-800">
                  <p className="font-medium">Request rejected</p>
                  {ret.rejectionReason && <p className="mt-1 text-red-700">{ret.rejectionReason}</p>}
                </div>
              ) : (
                <ol className="space-y-4">
                  {TIMELINE_STEPS.map((step, i) => {
                    const reached = i <= stepIndex;
                    const current = i === stepIndex;
                    return (
                      <li key={step} className="flex gap-3">
                        <span className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                          reached ? 'bg-emerald-600 text-white' : 'border-2 border-sand-300 text-sand-300',
                        )} aria-current={current ? 'step' : undefined}>
                          {reached ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" fill="currentColor" />}
                        </span>
                        <div className="pt-0.5 text-sm">
                          <p className={cn('font-medium', reached ? 'text-ink' : 'text-ink-muted')}>
                            {t(`returns.status.${step}`, { defaultValue: step })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}

          {/* Shipping info */}
          {ret.status === 'shipping_arranged' && ret.shippingMethod === 'pickup' && ret.pickupAddress && (
            <section className="card p-5 text-sm">
              <h3 className="mb-2 font-semibold text-ink">Pickup address</h3>
              <p className="text-ink-soft whitespace-pre-wrap">{ret.pickupAddress}</p>
            </section>
          )}
          {ret.shippingMethod === 'self_ship' && (
            <section className="card p-5 text-sm">
              <h3 className="mb-2 font-semibold text-ink">Self-ship</h3>
              <p className="text-ink-muted">{t('returns.selfShipNote')}</p>
              {ret.customerCarrier && (
                <p className="mt-2 text-ink-soft">
                  {ret.customerCarrier} · <span className="font-mono">{ret.customerTracking}</span>
                </p>
              )}
            </section>
          )}

          {/* Refund panel */}
          {ret.refund && (
            <section className="card p-5 text-sm">
              <h3 className="mb-3 font-semibold text-ink">{t('returns.refund')}</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Amount</span>
                  <span className="font-semibold">{ret.refund.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Method</span>
                  <span>{ret.refund.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Status</span>
                  <span className={cn('font-medium', ret.refund.status === 'completed' ? 'text-emerald-700' : 'text-amber-700')}>
                    {t(`returns.refundStatus.${ret.refund.status}`, { defaultValue: ret.refund.status })}
                  </span>
                </div>
                {ret.refund.reference && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">{t('returns.refundReference')}</span>
                    <span className="font-mono text-xs">{ret.refund.reference}</span>
                  </div>
                )}
                {ret.refund.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Completed</span>
                    <span>{formatDate(ret.refund.completedAt, lang)}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar — events */}
        <div className="space-y-5">
          {ret.events.length > 0 && (
            <section className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t('returns.timeline')}</h3>
              <ol className="space-y-3">
                {[...ret.events].reverse().map((ev) => (
                  <li key={ev.id} className="text-xs text-ink-muted">
                    <p className="font-medium text-ink">{ev.type.replace(/_/g, ' ')}</p>
                    {ev.message && <p>{ev.message}</p>}
                    <p className="mt-0.5">{formatDate(ev.createdAt, lang)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <WithdrawSection ret={ret} />
        </div>
      </div>
    </div>
  );
}
