import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X } from 'lucide-react';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import type { Order, OrderLine } from '@/types';
import { invalidateQueries } from '@/hooks/useAsync';
import { returnsApi } from '@/api/returns';
import { uploadReviewPhoto } from '@/api/reviews';
import { formatMoney } from '@/utils/money';
import { RefundDestinationPicker } from '../refund/RefundDestinationPicker';
import { RETURN_REASONS } from '../order.constants';

export function ReturnItemPanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const navigate = useNavigate();
  const cancelledQty = line.cancelledQty ?? 0;
  const returnedQty = line.returnedQty ?? 0;
  const maxQty = line.quantity - cancelledQty - returnedQty;
  const isCod = order.paymentMethod === 'cod';

  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [refundAccountId, setRefundAccountId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [returnRef, setReturnRef] = useState<string | null>(null);

  const addPhoto = async (file: File) => {
    if (photos.length >= 5) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setErr(t('product.photoTypeError')); return; }
    if (file.size > 3 * 1024 * 1024) { setErr(t('product.photoSizeError')); return; }
    setUploading(true);
    setErr(null);
    try {
      const p = await uploadReviewPhoto(file);
      setPhotos((prev) => [...prev, p]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setUploading(false);
    }
  };

  if (returnRef) {
    return (
      <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm">
        <p className="font-semibold text-emerald-900">{t('returns.requestSubmitted')}</p>
        <p className="mt-1 text-emerald-800">{t('returns.requestRef', { ref: returnRef })}</p>
        <button
          type="button"
          onClick={() => navigate(`/account/returns/${returnRef}`)}
          className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          {t('returns.viewReturn')}
        </button>
      </div>
    );
  }

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await returnsApi.createReturn({
        orderId: order.id,
        lineId: line.id,
        qty,
        reason,
        note: note || undefined,
        photos: photos.map((p) => p.id),
        shippingMethod: 'pickup' as const,
        refundAccountId: refundAccountId ?? undefined,
      });
      setReturnRef(res.reference);
      invalidateQueries(`order:${order.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  const estimatedRefund = Math.round(line.unitPrice * qty);

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-sand-200 bg-sand-50/70 p-4 text-sm">
      <p className="font-semibold text-ink">
        {t('order.returnItem')}: <span className="font-normal text-ink-muted">{loc(line.name)}</span>
      </p>
      {maxQty === 0 ? (
        <p className="text-xs text-ink-muted">{t('returns.noEligibleQty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">{t('returns.returnQty')}</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full rounded-lg border border-sand-300 bg-white px-2.5 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                {t('returns.returnReasonLabel', { defaultValue: 'Reason' })}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-sand-300 bg-white px-2.5 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{t(`returns.reason.${r}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder={t('returns.addNote')}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none resize-none"
          />

          <div>
            <p className="text-xs font-medium text-ink-muted mb-1.5">{t('product.addPhotos')} ({photos.length}/5)</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative h-14 w-14">
                  <img src={p.url} alt="" className="h-14 w-14 rounded-lg object-cover border border-sand-200" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-sand-300 bg-white hover:border-brand-400 transition-colors">
                  <ImagePlus className="h-5 w-5 text-ink-muted" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = ''; }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white border border-sand-200 px-4 py-3">
            <p className="text-xs text-ink-muted">{t('returns.estimatedRefund', { defaultValue: 'Estimated refund' })}</p>
            <p className="mt-1 text-base font-semibold text-ink">{formatMoney(estimatedRefund, order.currency, lang)}</p>
            {isCod && (
              <p className="mt-0.5 text-xs text-ink-muted">
                {t('returns.codRefundMethod', { defaultValue: 'Via bank transfer (COD order)' })}
              </p>
            )}
          </div>

          <RefundDestinationPicker isCod={isCod} selectedAccountId={refundAccountId} onSelect={setRefundAccountId} />

          {err && <p className="text-xs text-red-700">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={submit}
              disabled={loading || uploading}
              className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
            >
              {loading ? t('common.saving') : t('returns.submitReturn')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-sand-300 px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-100"
            >
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
