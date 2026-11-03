import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Circle, ImagePlus, X } from 'lucide-react';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import type { Order, OrderLine, OrderStatus } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';
import { formatMoney, formatRate } from '@/utils/money';
import { invalidateQueries } from '@/hooks/useAsync';
import { returnsApi } from '@/api/returns';
import { uploadReviewPhoto } from '@/api/reviews';
import { TotalsTable } from '../cart/TotalsTable';
import { InlineReview } from './InlineReview';

const STATUSES: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered'];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const styles: Record<OrderStatus, string> = {
    placed: 'bg-sky-50 text-sky-900 border-sky-200',
    processing: 'bg-amber-50 text-amber-900 border-amber-200',
    shipped: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    delivered: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    cancelled: 'bg-red-50 text-red-900 border-red-200',
  };
  return <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', styles[status])}>{t(`order.status.${status}`)}</span>;
}

type LineAction = 'cancel' | 'return' | 'exchange';

const CANCEL_REASONS = ['changed_mind', 'duplicate_order', 'wrong_item_ordered', 'price_issue', 'other'] as const;
const RETURN_REASONS = ['damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'quality_issue', 'other'] as const;

function CancelPanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const maxQty = line.quantity - ((line as any).cancelledQty ?? 0);
  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return (
    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
      <span>{t('order.cancelDone', { name: loc(line.name) })}</span>
      <button type="button" onClick={onClose} aria-label={t('common.close')} className="ml-2"><X className="h-4 w-4" /></button>
    </div>
  );

  const submit = async () => {
    setErr(null); setLoading(true);
    try {
      await returnsApi.cancelItem(order.id, line.id, { qty, reason, note: note || undefined });
      invalidateQueries(`order:${order.id}`);
      invalidateQueries(`orders:`);
      setDone(true);
      setTimeout(onClose, 2500);
    } catch (e: any) { setErr(e.message ?? t('toast.error')); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-sm space-y-3">
      <p className="font-medium text-red-900">{t('order.cancelItem')}: <span className="font-normal text-red-800">{loc(line.name)}</span></p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink mb-1">{t('returns.cancelQty')}</label>
          <select value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs">
            {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink mb-1">{t('returns.cancelReasonLabel')}</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs">
            {CANCEL_REASONS.map(r => <option key={r} value={r}>{t(`returns.cancelReason.${r}`)}</option>)}
          </select>
        </div>
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
        placeholder={t('returns.addNote')}
        className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs resize-none" />
      {err && <p className="text-xs text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={loading || maxQty === 0}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50">
          {loading ? t('common.saving') : t('common.confirm')}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100">
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

function ReturnPanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const cancelledQty = (line as any).cancelledQty ?? 0;
  const returnedQty = (line as any).returnedQty ?? 0;
  const maxQty = line.quantity - cancelledQty - returnedQty;
  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [note, setNote] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'self_ship' | 'pickup'>('self_ship');
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [returnRef, setReturnRef] = useState<string | null>(null);

  const addPhoto = async (file: File) => {
    if (photos.length >= 5) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setErr(t('product.photoTypeError')); return; }
    if (file.size > 3 * 1024 * 1024) { setErr(t('product.photoSizeError')); return; }
    setUploading(true); setErr(null);
    try {
      const p = await uploadReviewPhoto(file);
      setPhotos(prev => [...prev, p]);
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); }
  };

  if (returnRef) return (
    <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm">
      <p className="font-semibold text-emerald-900">{t('returns.requestSubmitted')}</p>
      <p className="mt-1 text-emerald-800">{t('returns.requestRef', { ref: returnRef })}</p>
      <button type="button" onClick={() => navigate(`/account/returns/${returnRef}`)}
        className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
        {t('returns.viewReturn')}
      </button>
    </div>
  );

  const submit = async () => {
    setErr(null); setLoading(true);
    try {
      const res = await returnsApi.createReturn({
        orderId: order.id,
        lineId: line.id,
        qty, reason, note: note || undefined,
        photos: photos.map(p => p.id),
        shippingMethod,
      });
      setReturnRef(res.reference);
      invalidateQueries(`order:${order.id}`);
    } catch (e: any) { setErr(e.message ?? t('toast.error')); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-3 text-sm space-y-3">
      <p className="font-medium text-brand-900">{t('order.returnItem')}: <span className="font-normal">{loc(line.name)}</span></p>
      {maxQty === 0 ? (
        <p className="text-xs text-ink-muted">{t('returns.noEligibleQty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">{t('returns.returnQty')}</label>
              <select value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs">
                {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">{t('returns.returnReason')}</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs">
                {RETURN_REASONS.map(r => <option key={r} value={r}>{t(`returns.reason.${r}`)}</option>)}
              </select>
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000} rows={2}
            placeholder={t('returns.addNote')}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs resize-none" />
          <div>
            <p className="text-xs font-medium text-ink mb-1">{t('returns.shippingMethod')}</p>
            <div className="flex gap-2">
              {(['self_ship', 'pickup'] as const).map(m => (
                <button key={m} type="button" onClick={() => setShippingMethod(m)}
                  className={cn('rounded-md border px-2.5 py-1 text-xs font-medium', shippingMethod === m ? 'border-brand-600 bg-brand-100 text-brand-800' : 'border-sand-300 text-ink-muted hover:border-brand-400')}>
                  {t(`returns.${m === 'self_ship' ? 'selfShip' : 'pickup'}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-ink mb-1">{t('product.addPhotos')} ({photos.length}/5)</p>
            <div className="flex flex-wrap gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative h-14 w-14">
                  <img src={p.url} alt="" className="h-14 w-14 rounded object-cover" />
                  <button type="button" onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded border-2 border-dashed border-sand-300 hover:border-brand-400">
                  <ImagePlus className="h-5 w-5 text-ink-muted" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = ''; }} />
                </label>
              )}
            </div>
          </div>
          {err && <p className="text-xs text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={loading || uploading}
              className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50">
              {loading ? t('common.saving') : t('returns.submitReturn')}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100">
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ExchangePanel({ onSwitchToReturn, onClose }: { onSwitchToReturn: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-3 text-sm">
      <p className="font-medium text-ink">{t('order.exchangeItem')}</p>
      <p className="mt-1 text-xs text-ink-muted">{t('returns.exchangeNote')}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onSwitchToReturn}
          className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90">
          {t('order.returnItem')}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100">
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

function LineActionPanel({ line, action, order, onClose, onSwitchAction }: {
  line: OrderLine; action: LineAction; order: Order; onClose: () => void; onSwitchAction: (a: LineAction) => void;
}) {
  if (action === 'cancel') return <CancelPanel line={line} order={order} onClose={onClose} />;
  if (action === 'return') return <ReturnPanel line={line} order={order} onClose={onClose} />;
  return <ExchangePanel onSwitchToReturn={() => onSwitchAction('return')} onClose={onClose} />;
}

/** Items in an order, priced in the order's own currency snapshot. */
export function OrderLines({ order, reviewLinks = false }: { order: Order; reviewLinks?: boolean }) {
  const loc = useLocalized();
  const lang = useLanguage();
  const { t } = useTranslation();
  const [activeAction, setActiveAction] = useState<{ variantId: string; action: LineAction } | null>(null);

  const canCancel = order.status === 'placed' || order.status === 'processing';
  const canReturn = order.status === 'delivered';

  return (
    <ul className="divide-y divide-sand-200">
      {order.lines.map((l) => {
        const active = activeAction?.variantId === l.variantId ? activeAction.action : null;
        return (
          <li key={l.variantId} className="py-3">
            <div className="flex items-center gap-4">
              <img src={l.image.src} alt={loc(l.image.alt)} className="h-16 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1 text-sm">
                <Link to={`/product/${l.slug}`} className="font-medium text-ink hover:underline">
                  {loc(l.name)}
                </Link>
                {l.variantLabel && <p className="text-ink-muted">{loc(l.variantLabel)}</p>}
                <p className="text-ink-muted">
                  {t('order.qty', { count: l.quantity })} · {formatMoney(l.unitPrice, order.currency, lang)}
                </p>
                {(canCancel || canReturn) && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setActiveAction(active === 'cancel' ? null : { variantId: l.variantId, action: 'cancel' })}
                        className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', active === 'cancel' ? 'border-red-300 bg-red-50 text-red-700' : 'border-sand-300 text-ink-muted hover:border-red-300 hover:text-red-700')}
                      >
                        {t('order.cancelItem')}
                      </button>
                    )}
                    {canReturn && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveAction(active === 'return' ? null : { variantId: l.variantId, action: 'return' })}
                          className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', active === 'return' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-sand-300 text-ink-muted hover:border-brand-400 hover:text-brand-700')}
                        >
                          {t('order.returnItem')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAction(active === 'exchange' ? null : { variantId: l.variantId, action: 'exchange' })}
                          className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', active === 'exchange' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-sand-300 text-ink-muted hover:border-brand-400 hover:text-brand-700')}
                        >
                          {t('order.exchangeItem')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="shrink-0 text-sm font-semibold">{formatMoney(l.lineTotal, order.currency, lang)}</p>
            </div>
            {active && (
              <LineActionPanel
                line={l}
                action={active}
                order={order}
                onClose={() => setActiveAction(null)}
                onSwitchAction={(a) => setActiveAction({ variantId: l.variantId, action: a })}
              />
            )}
            {/* Inline review widget — server re-checks eligibility on submit. */}
            {reviewLinks && order.status === 'delivered' && l.productId && (
              <InlineReview productId={l.productId} productName={loc(l.name)} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function OrderTotals({ order }: { order: Order }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  return (
    <div>
      <TotalsTable totals={order} currency={order.currency} couponCode={order.couponCode} totalLabel={t('cart.totalCode', { currency: order.currency })} />
      <p className="mt-3 text-xs text-ink-muted">
        {t('order.rateSnapshot', { currency: order.currency, rate: formatRate(order.currency, order.rateSnapshot, lang) })}
      </p>
    </div>
  );
}

/** Placed → processing → shipped → delivered. */
export function OrderTimeline({ order }: { order: Order }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const reached = STATUSES.indexOf(order.status);
  return (
    <ol className="relative space-y-6">
      {STATUSES.map((s, i) => {
        const entry = order.timeline.find((e) => e.status === s);
        const done = i <= reached;
        return (
          <li key={s} className="relative flex gap-4" aria-current={i === reached ? 'step' : undefined}>
            {i < STATUSES.length - 1 && <span className={cn('absolute left-[13px] top-7 h-[calc(100%+0.5rem)] w-0.5', i < reached ? 'bg-emerald-600' : 'bg-sand-200')} aria-hidden />}
            <span
              className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', done ? 'bg-emerald-600 text-white' : 'border-2 border-sand-300 bg-white text-sand-300')}
              aria-hidden
            >
              {done ? <Check className="h-4 w-4" /> : <Circle className="h-2 w-2" fill="currentColor" />}
            </span>
            <div className="pt-0.5">
              <p className={cn('font-medium', done ? 'text-ink' : 'text-ink-muted')}>
                {t(`order.status.${s}`)}
                <span className="sr-only">{done ? ` (${t('a11y.stepCompleted')})` : ''}</span>
              </p>
              {entry && <p className="text-sm text-ink-muted">{formatDate(entry.date, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
