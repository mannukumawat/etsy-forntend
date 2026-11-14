import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useLocalized } from '@/hooks/useLocale';
import type { Order, OrderLine } from '@/types';
import { invalidateQueries } from '@/hooks/useAsync';
import { returnsApi } from '@/api/returns';
import { CANCEL_REASONS } from '../order.constants';

export function CancelItemPanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const maxQty = line.quantity - (line.cancelledQty ?? 0);
  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
        <span>{t('order.cancelDone', { name: loc(line.name) })}</span>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="ml-2">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await returnsApi.cancelItem(order.id, line.id, { qty, reason, note: note || undefined });
      invalidateQueries(`order:${order.id}`);
      invalidateQueries(`orders:`);
      setDone(true);
      setTimeout(onClose, 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-sand-200 bg-sand-50/70 p-4 text-sm">
      <p className="font-semibold text-ink">
        {t('order.cancelItem')}: <span className="font-normal text-ink-muted">{loc(line.name)}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink mb-1">{t('returns.cancelQty')}</label>
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink mb-1">{t('returns.cancelReasonLabel')}</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>{t(`returns.cancelReason.${r}`)}</option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder={t('returns.addNote')}
        className="w-full resize-none rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none"
      />
      {err && <p className="text-xs text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={loading || maxQty === 0}
          className="rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {loading ? t('common.saving') : t('common.confirm')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-sand-100"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
