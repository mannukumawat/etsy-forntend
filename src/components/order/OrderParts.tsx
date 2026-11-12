import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Circle, ImagePlus, RotateCw, X } from 'lucide-react';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import type { BankAccount, Order, OrderLine, OrderStatus, Product } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';
import { formatMoney, formatRate } from '@/utils/money';
import { invalidateQueries } from '@/hooks/useAsync';
import { MAX_QTY_PER_LINE } from '@/config/store';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import { returnsApi } from '@/api/returns';
import { exchangesApi } from '@/api/exchanges';
import { bankAccountsApi } from '@/api/bankAccounts';
import { fetchProductBySlug } from '@/api/products';
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
const EXCHANGE_REASONS = ['wrong_size', 'wrong_color', 'damaged', 'not_as_described', 'changed_mind', 'other'] as const;

// ---- Cancel panel ----
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

// ---- Refund destination picker (used in ReturnPanel for COD orders) ----
function RefundDestinationPicker({
  isCod,
  selectedAccountId,
  onSelect,
}: {
  isCod: boolean;
  selectedAccountId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ accountHolderName: '', accountNumber: '', accountNumberConfirm: '', ifscCode: '' });
  const [addErr, setAddErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadAccounts = async () => {
    if (accounts !== null) return;
    setLoading(true);
    try {
      const res = await bankAccountsApi.list();
      setAccounts(res.items);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  };

  if (!isCod) {
    return (
      <div className="rounded-md bg-sand-50 border border-sand-200 px-3 py-2 text-xs text-ink-muted">
        {t('returns.refundToOriginal', { defaultValue: 'Refund will be issued to your original payment method.' })}
      </div>
    );
  }

  if (accounts === null) {
    return (
      <button type="button" onClick={loadAccounts} disabled={loading}
        className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900 disabled:opacity-50">
        {loading ? t('common.loading', { defaultValue: 'Loading…' }) : t('returns.selectBankAccount', { defaultValue: 'Select bank account for refund' })}
      </button>
    );
  }

  const addAccount = async () => {
    if (!addForm.accountHolderName || !addForm.accountNumber || !addForm.ifscCode) {
      setAddErr(t('validation.required')); return;
    }
    if (addForm.accountNumber !== addForm.accountNumberConfirm) {
      setAddErr(t('returns.accountNumberMismatch', { defaultValue: 'Account numbers do not match.' })); return;
    }
    setAdding(true); setAddErr(null);
    try {
      const acct = await bankAccountsApi.add(addForm);
      setAccounts(prev => [acct, ...(prev ?? [])]);
      onSelect(acct.id);
      setShowAdd(false);
    } catch (e: any) { setAddErr(e.message); }
    finally { setAdding(false); }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink">{t('returns.refundDestination', { defaultValue: 'Refund destination (bank transfer)' })}</p>
      {accounts.map(a => (
        <label key={a.id} className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer',
          selectedAccountId === a.id ? 'border-brand-600 bg-brand-50' : 'border-sand-300 hover:border-brand-400',
        )}>
          <input type="radio" name="refundAccount" value={a.id} checked={selectedAccountId === a.id}
            onChange={() => onSelect(a.id)} className="sr-only" />
          <span className="flex-1">
            <span className="font-medium">{a.accountHolderName}</span>
            <span className="ml-2 text-ink-muted">{a.accountNumberMasked}</span>
            <span className="ml-2 text-ink-muted">· {a.ifscCode}</span>
          </span>
          {selectedAccountId === a.id && <Check className="h-3.5 w-3.5 text-brand-700" />}
        </label>
      ))}
      {accounts.length === 0 && !showAdd && (
        <p className="text-xs text-ink-muted">{t('returns.noBankAccounts', { defaultValue: 'No saved bank accounts.' })}</p>
      )}
      {!showAdd && (
        <button type="button" onClick={() => setShowAdd(true)}
          className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900">
          {t('returns.addBankAccount', { defaultValue: '+ Add bank account' })}
        </button>
      )}
      {showAdd && (
        <div className="rounded-md border border-sand-200 p-3 space-y-2 text-xs">
          <p className="font-medium text-ink">{t('returns.newBankAccount', { defaultValue: 'New bank account' })}</p>
          <input value={addForm.accountHolderName} onChange={e => setAddForm(f => ({ ...f, accountHolderName: e.target.value }))}
            placeholder={t('returns.accountHolderName', { defaultValue: 'Account holder name' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs" />
          <input value={addForm.accountNumber} onChange={e => setAddForm(f => ({ ...f, accountNumber: e.target.value }))}
            placeholder={t('returns.accountNumber', { defaultValue: 'Account number' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs" />
          <input value={addForm.accountNumberConfirm} onChange={e => setAddForm(f => ({ ...f, accountNumberConfirm: e.target.value }))}
            placeholder={t('returns.confirmAccountNumber', { defaultValue: 'Confirm account number' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs" />
          <input value={addForm.ifscCode} onChange={e => setAddForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
            placeholder={t('returns.ifscCode', { defaultValue: 'IFSC code' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs font-mono uppercase" />
          {addErr && <p className="text-red-700">{addErr}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={addAccount} disabled={adding}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50">
              {adding ? t('common.saving') : t('returns.saveAccount', { defaultValue: 'Save account' })}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="rounded-md border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Return panel ----
function ReturnPanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const navigate = useNavigate();
  const cancelledQty = (line as any).cancelledQty ?? 0;
  const returnedQty = (line as any).returnedQty ?? 0;
  const maxQty = line.quantity - cancelledQty - returnedQty;
  const isCod = order.paymentMethod === 'cod';

  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [note, setNote] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'self_ship' | 'pickup'>('self_ship');
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
        refundAccountId: refundAccountId ?? undefined,
      });
      setReturnRef(res.reference);
      invalidateQueries(`order:${order.id}`);
    } catch (e: any) { setErr(e.message ?? t('toast.error')); }
    finally { setLoading(false); }
  };

  // Estimated refund
  const estimatedRefund = Math.round(line.unitPrice * qty);

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

          {/* Estimated refund */}
          <div className="rounded-md bg-white border border-sand-200 px-3 py-2 text-xs">
            <p className="text-ink-muted">{t('returns.estimatedRefund', { defaultValue: 'Estimated refund' })}</p>
            <p className="mt-0.5 font-semibold text-ink">{formatMoney(estimatedRefund, order.currency, lang)}</p>
            {isCod && <p className="mt-0.5 text-ink-muted">{t('returns.codRefundMethod', { defaultValue: 'Via bank transfer (COD order)' })}</p>}
          </div>

          {/* Refund destination for COD */}
          <RefundDestinationPicker isCod={isCod} selectedAccountId={refundAccountId} onSelect={setRefundAccountId} />

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

// ---- Exchange panel (real replacement selection) ----
function ExchangePanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const navigate = useNavigate();

  const cancelledQty = (line as any).cancelledQty ?? 0;
  const returnedQty = (line as any).returnedQty ?? 0;
  const exchangedQty = (line as any).exchangedQty ?? 0;
  const maxQty = line.quantity - cancelledQty - returnedQty - exchangedQty;

  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const [reason, setReason] = useState<string>(EXCHANGE_REASONS[0]);
  const [note, setNote] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productErr, setProductErr] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exchangeRef, setExchangeRef] = useState<string | null>(null);

  const loadProduct = async () => {
    if (product) return;
    setProductLoading(true); setProductErr(null);
    try {
      const p = await fetchProductBySlug(line.slug);
      setProduct(p);
      // Pre-select a different variant if available
      const other = p.variants.find(v => v.id !== line.variantId && v.stock > 0);
      if (other) setSelectedVariantId(other.id);
    } catch (e: any) { setProductErr(e.message); }
    finally { setProductLoading(false); }
  };

  if (exchangeRef) return (
    <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm">
      <p className="font-semibold text-emerald-900">{t('exchange.requestSubmitted', { defaultValue: 'Exchange request submitted!' })}</p>
      <p className="mt-1 text-emerald-800">{t('exchange.requestRef', { ref: exchangeRef, defaultValue: `Reference: ${exchangeRef}` })}</p>
      <button type="button" onClick={() => navigate(`/account/exchanges/${exchangeRef}`)}
        className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
        {t('exchange.viewExchange', { defaultValue: 'View exchange status' })}
      </button>
    </div>
  );

  const submit = async () => {
    if (!selectedVariantId) { setErr(t('exchange.selectReplacement', { defaultValue: 'Please select a replacement variant.' })); return; }
    setErr(null); setLoading(true);
    try {
      const res = await exchangesApi.createExchange({
        orderId: order.id,
        lineId: line.id,
        qty, reason, note: note || undefined,
        replacementVariantId: selectedVariantId,
      });
      setExchangeRef(res.reference);
      invalidateQueries(`order:${order.id}`);
    } catch (e: any) { setErr(e.message ?? t('toast.error')); }
    finally { setLoading(false); }
  };

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId);
  const priceDiff = selectedVariant ? (selectedVariant.salePrice ?? selectedVariant.price) - line.unitPrice : 0;

  return (
    <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-3 text-sm space-y-3">
      <div className="flex items-start justify-between">
        <p className="font-medium text-brand-900">{t('order.exchangeItem')}: <span className="font-normal">{loc(line.name)}</span></p>
        {line.variantLabel && <p className="text-xs text-ink-muted">{loc(line.variantLabel)}</p>}
      </div>

      {maxQty === 0 ? (
        <p className="text-xs text-ink-muted">{t('exchange.noEligibleQty', { defaultValue: 'No items eligible for exchange.' })}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">{t('exchange.qty', { defaultValue: 'Qty to exchange' })}</label>
              <select value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs">
                {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">{t('exchange.reason', { defaultValue: 'Reason' })}</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs">
                {EXCHANGE_REASONS.map(r => <option key={r} value={r}>{t(`exchange.reason.${r}`, { defaultValue: r.replace(/_/g, ' ') })}</option>)}
              </select>
            </div>
          </div>

          {/* Replacement selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-ink">{t('exchange.replacement', { defaultValue: 'Select replacement' })}</p>
              {!product && !productLoading && (
                <button type="button" onClick={loadProduct}
                  className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900">
                  {t('exchange.loadVariants', { defaultValue: 'Load variants' })}
                </button>
              )}
            </div>
            {productLoading && <p className="text-xs text-ink-muted">{t('common.loading', { defaultValue: 'Loading…' })}</p>}
            {productErr && <p className="text-xs text-red-700">{productErr}</p>}
            {product && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {product.variants.map(v => {
                  const price = v.salePrice ?? v.price;
                  const diff = (price - line.unitPrice) * qty;
                  const outOfStock = v.stock < qty;
                  const isCurrent = v.id === line.variantId;
                  const label = product.options.map(o => {
                    const valId = v.options[o.id];
                    return valId ? loc(o.values.find(ov => ov.id === valId)?.label ?? { en: valId }) : null;
                  }).filter(Boolean).join(' · ');
                  return (
                    <label key={v.id} className={cn(
                      'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs',
                      outOfStock || isCurrent ? 'opacity-50 cursor-not-allowed border-sand-200' :
                        selectedVariantId === v.id ? 'border-brand-600 bg-brand-100 cursor-pointer' :
                          'border-sand-300 hover:border-brand-400 cursor-pointer',
                    )}>
                      <input type="radio" name="exchangeVariant" value={v.id}
                        disabled={outOfStock || isCurrent}
                        checked={selectedVariantId === v.id}
                        onChange={() => setSelectedVariantId(v.id)}
                        className="sr-only" />
                      <span className="flex-1">
                        {label || v.sku}
                        {isCurrent && <span className="ml-1 text-ink-muted">{t('exchange.currentItem', { defaultValue: '(current)' })}</span>}
                        {outOfStock && <span className="ml-1 text-red-600">{t('product.outOfStock', { defaultValue: 'Out of stock' })}</span>}
                      </span>
                      <span className={cn('shrink-0', diff > 0 ? 'text-red-700' : diff < 0 ? 'text-emerald-700' : 'text-ink-muted')}>
                        {diff === 0 ? t('exchange.samePrice', { defaultValue: 'Same price' }) :
                          diff > 0 ? `+${formatMoney(diff, order.currency, lang)}` :
                            formatMoney(diff, order.currency, lang)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price difference summary */}
          {selectedVariant && priceDiff !== 0 && (
            <div className="rounded-md bg-white border border-sand-200 px-3 py-2 text-xs">
              <p className="text-ink-muted">{t('exchange.priceDifference', { defaultValue: 'Price difference' })}</p>
              <p className={cn('mt-0.5 font-semibold', priceDiff > 0 ? 'text-red-700' : 'text-emerald-700')}>
                {priceDiff > 0
                  ? t('exchange.priceDiffExtra', { amount: formatMoney(priceDiff * qty, order.currency, lang), defaultValue: `+${formatMoney(priceDiff * qty, order.currency, lang)} additional charge` })
                  : t('exchange.priceDiffCredit', { amount: formatMoney(Math.abs(priceDiff * qty), order.currency, lang), defaultValue: `${formatMoney(Math.abs(priceDiff * qty), order.currency, lang)} credit` })}
              </p>
            </div>
          )}

          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000} rows={2}
            placeholder={t('returns.addNote')}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs resize-none" />

          {err && <p className="text-xs text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={loading || !selectedVariantId}
              className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50">
              {loading ? t('common.saving') : t('exchange.submitExchange', { defaultValue: 'Submit exchange request' })}
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

function LineActionPanel({ line, action, order, onClose }: {
  line: OrderLine; action: LineAction; order: Order; onClose: () => void;
}) {
  if (action === 'cancel') return <CancelPanel line={line} order={order} onClose={onClose} />;
  if (action === 'return') return <ReturnPanel line={line} order={order} onClose={onClose} />;
  return <ExchangePanel line={line} order={order} onClose={onClose} />;
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
        const cancelledQty: number = (l as any).cancelledQty ?? 0;
        const returnedQty: number = (l as any).returnedQty ?? 0;
        const exchangedQty: number = (l as any).exchangedQty ?? 0;
        const fullyCancelled = cancelledQty >= l.quantity;
        const returnsAllowed: boolean = (l as any).returnsAllowed !== false;
        const exchangeAllowed: boolean = (l as any).exchangeAllowed !== false;
        return (
          <li key={l.variantId} className="py-4">
            <div className="flex items-start gap-3">
              <img src={l.image.src} alt={loc(l.image.alt)} className="h-16 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1 text-sm">
                <Link to={`/product/${l.slug}`} className="font-medium text-ink hover:underline">
                  {loc(l.name)}
                </Link>
                {l.variantLabel && <p className="text-xs text-ink-muted mt-0.5">{loc(l.variantLabel)}</p>}
                <p className="text-xs text-ink-muted mt-0.5">
                  {t('order.qty', { count: l.quantity })} · {formatMoney(l.unitPrice, order.currency, lang)}
                </p>
                {cancelledQty > 0 && (
                  <p className="mt-1 text-xs font-medium text-red-700">
                    {t('order.status.cancelled')}{!fullyCancelled ? ` · ${cancelledQty} / ${l.quantity}` : ''}
                  </p>
                )}
                {returnedQty > 0 && (
                  <p className="mt-0.5 text-xs font-medium text-amber-700">
                    {t('returns.returnedQty', { count: returnedQty, defaultValue: `${returnedQty} returned` })}
                  </p>
                )}
                {exchangedQty > 0 && (
                  <p className="mt-0.5 text-xs font-medium text-indigo-700">
                    {t('exchange.exchangedQty', { count: exchangedQty, defaultValue: `${exchangedQty} exchange requested` })}
                  </p>
                )}
                {fullyCancelled && (
                  <button
                    type="button"
                    onClick={() => {
                      useCart.getState().addItem(l.productId, l.variantId, l.quantity, MAX_QTY_PER_LINE);
                      useUi.getState().openCart();
                    }}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-brand-600 px-2.5 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden />
                    {t('order.buyAgain', { defaultValue: 'Buy again' })}
                  </button>
                )}
                {(canCancel || canReturn) && !fullyCancelled && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setActiveAction(active === 'cancel' ? null : { variantId: l.variantId, action: 'cancel' })}
                        className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', active === 'cancel' ? 'border-red-300 bg-red-50 text-red-700' : 'border-sand-300 text-ink-muted hover:border-red-300 hover:text-red-700')}
                      >
                        {t('order.cancelItem')}
                      </button>
                    )}
                    {canReturn && returnsAllowed && (
                      <button
                        type="button"
                        onClick={() => setActiveAction(active === 'return' ? null : { variantId: l.variantId, action: 'return' })}
                        className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', active === 'return' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-sand-300 text-ink-muted hover:border-brand-400 hover:text-brand-700')}
                      >
                        {t('order.returnItem')}
                      </button>
                    )}
                    {canReturn && exchangeAllowed && (
                      <button
                        type="button"
                        onClick={() => setActiveAction(active === 'exchange' ? null : { variantId: l.variantId, action: 'exchange' })}
                        className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', active === 'exchange' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-sand-300 text-ink-muted hover:border-brand-400 hover:text-brand-700')}
                      >
                        {t('order.exchangeItem')}
                      </button>
                    )}
                    {canReturn && !returnsAllowed && (
                      <span className="text-xs text-ink-muted">{t('returns.notAllowed', { defaultValue: 'Returns not accepted for this item' })}</span>
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
              />
            )}
            {/* Write a review — visually secondary */}
            {reviewLinks && order.status === 'delivered' && l.productId && (
              <div className="mt-2">
                <InlineReview productId={l.productId} productName={loc(l.name)} />
              </div>
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

  if (order.status === 'cancelled') {
    const fmt = (d: string) => formatDate(d, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const placedAt = order.timeline.find((e) => e.status === 'placed')?.date ?? order.createdAt;
    const cancelledAt = order.timeline.find((e) => e.status === 'cancelled')?.date;
    return (
      <ol className="relative space-y-6">
        <li className="relative flex gap-4">
          <span className="absolute left-[13px] top-7 h-[calc(100%+0.5rem)] w-0.5 bg-red-200" aria-hidden />
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden>
            <Check className="h-4 w-4" />
          </span>
          <div className="pt-0.5">
            <p className="font-medium text-ink">{t('order.status.placed')}</p>
            <p className="text-sm text-ink-muted">{fmt(placedAt)}</p>
          </div>
        </li>
        <li className="relative flex gap-4" aria-current="step">
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white" aria-hidden>
            <X className="h-4 w-4" />
          </span>
          <div className="pt-0.5">
            <p className="font-medium text-red-700">{t('order.status.cancelled')}</p>
            {cancelledAt && <p className="text-sm text-ink-muted">{fmt(cancelledAt)}</p>}
            <p className="mt-1 text-sm text-ink-muted">{t('order.cancelledNote', { defaultValue: 'This order was cancelled and will not be shipped.' })}</p>
          </div>
        </li>
      </ol>
    );
  }

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
