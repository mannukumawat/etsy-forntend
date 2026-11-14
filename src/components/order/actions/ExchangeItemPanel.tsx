import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import type { Order, OrderLine, Product } from '@/types';
import { invalidateQueries } from '@/hooks/useAsync';
import { exchangesApi } from '@/api/exchanges';
import { fetchProductBySlug } from '@/api/products';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/cn';
import { EXCHANGE_REASONS } from '../order.constants';

export function ExchangeItemPanel({ line, order, onClose }: { line: OrderLine; order: Order; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const navigate = useNavigate();

  const cancelledQty = line.cancelledQty ?? 0;
  const returnedQty = line.returnedQty ?? 0;
  const exchangedQty = line.exchangedQty ?? 0;
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
    setProductLoading(true);
    setProductErr(null);
    try {
      const p = await fetchProductBySlug(line.slug);
      setProduct(p);
      const other = p.variants.find((v) => v.id !== line.variantId && v.stock > 0);
      if (other) setSelectedVariantId(other.id);
    } catch (e: unknown) {
      setProductErr(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setProductLoading(false);
    }
  };

  if (exchangeRef) {
    return (
      <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm">
        <p className="font-semibold text-emerald-900">
          {t('exchange.requestSubmitted', { defaultValue: 'Exchange request submitted!' })}
        </p>
        <p className="mt-1 text-emerald-800">
          {t('exchange.requestRef', { ref: exchangeRef, defaultValue: `Reference: ${exchangeRef}` })}
        </p>
        <button
          type="button"
          onClick={() => navigate(`/account/exchanges/${exchangeRef}`)}
          className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          {t('exchange.viewExchange', { defaultValue: 'View exchange status' })}
        </button>
      </div>
    );
  }

  const submit = async () => {
    if (!selectedVariantId) {
      setErr(t('exchange.selectReplacement', { defaultValue: 'Please select a replacement variant.' }));
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await exchangesApi.createExchange({
        orderId: order.id,
        lineId: line.id,
        qty,
        reason,
        note: note || undefined,
        replacementVariantId: selectedVariantId,
      });
      setExchangeRef(res.reference);
      invalidateQueries(`order:${order.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId);
  const priceDiff = selectedVariant ? (selectedVariant.salePrice ?? selectedVariant.price) - line.unitPrice : 0;

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-sand-200 bg-sand-50/70 p-4 text-sm">
      <div className="flex items-start justify-between">
        <p className="font-semibold text-ink">
          {t('order.exchangeItem')}: <span className="font-normal text-ink-muted">{loc(line.name)}</span>
        </p>
        {line.variantLabel && <p className="text-xs text-ink-muted">{loc(line.variantLabel)}</p>}
      </div>

      {maxQty === 0 ? (
        <p className="text-xs text-ink-muted">
          {t('exchange.noEligibleQty', { defaultValue: 'No items eligible for exchange.' })}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                {t('exchange.qty', { defaultValue: 'Qty to exchange' })}
              </label>
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
              <label className="block text-xs font-medium text-ink mb-1">
                {t('exchange.reasonLabel', { defaultValue: 'Reason' })}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs"
              >
                {EXCHANGE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {t(`exchange.reason.${r}`, { defaultValue: r.replace(/_/g, ' ') })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-ink">
                {t('exchange.replacement', { defaultValue: 'Select replacement' })}
              </p>
              {!product && !productLoading && (
                <button
                  type="button"
                  onClick={loadProduct}
                  className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900"
                >
                  {t('exchange.loadVariants', { defaultValue: 'Load variants' })}
                </button>
              )}
            </div>
            {productLoading && <p className="text-xs text-ink-muted">{t('common.loading', { defaultValue: 'Loading…' })}</p>}
            {productErr && <p className="text-xs text-red-700">{productErr}</p>}
            {product && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {product.variants.map((v) => {
                  const price = v.salePrice ?? v.price;
                  const diff = (price - line.unitPrice) * qty;
                  const outOfStock = v.stock < qty;
                  const isCurrent = v.id === line.variantId;
                  const label = product.options
                    .map((o) => {
                      const valId = v.options[o.id];
                      return valId ? loc(o.values.find((ov) => ov.id === valId)?.label ?? { en: valId }) : null;
                    })
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <label
                      key={v.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs',
                        outOfStock || isCurrent
                          ? 'opacity-50 cursor-not-allowed border-sand-200'
                          : selectedVariantId === v.id
                            ? 'border-brand-600 bg-brand-100 cursor-pointer'
                            : 'border-sand-300 hover:border-brand-400 cursor-pointer',
                      )}
                    >
                      <input
                        type="radio"
                        name="exchangeVariant"
                        value={v.id}
                        disabled={outOfStock || isCurrent}
                        checked={selectedVariantId === v.id}
                        onChange={() => setSelectedVariantId(v.id)}
                        className="sr-only"
                      />
                      <span className="flex-1">
                        {label || v.sku}
                        {isCurrent && (
                          <span className="ml-1 text-ink-muted">
                            {t('exchange.currentItem', { defaultValue: '(current)' })}
                          </span>
                        )}
                        {outOfStock && (
                          <span className="ml-1 text-red-600">
                            {t('product.outOfStock', { defaultValue: 'Out of stock' })}
                          </span>
                        )}
                      </span>
                      <span className={cn('shrink-0', diff > 0 ? 'text-red-700' : diff < 0 ? 'text-emerald-700' : 'text-ink-muted')}>
                        {diff === 0
                          ? t('exchange.samePrice', { defaultValue: 'Same price' })
                          : diff > 0
                            ? `+${formatMoney(diff, order.currency, lang)}`
                            : formatMoney(diff, order.currency, lang)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedVariant && priceDiff !== 0 && (
            <div className="rounded-md bg-white border border-sand-200 px-3 py-2 text-xs">
              <p className="text-ink-muted">{t('exchange.priceDifference', { defaultValue: 'Price difference' })}</p>
              <p className={cn('mt-0.5 font-semibold', priceDiff > 0 ? 'text-red-700' : 'text-emerald-700')}>
                {priceDiff > 0
                  ? t('exchange.priceDiffExtra', {
                      amount: formatMoney(priceDiff * qty, order.currency, lang),
                      defaultValue: `+${formatMoney(priceDiff * qty, order.currency, lang)} additional charge`,
                    })
                  : t('exchange.priceDiffCredit', {
                      amount: formatMoney(Math.abs(priceDiff * qty), order.currency, lang),
                      defaultValue: `${formatMoney(Math.abs(priceDiff * qty), order.currency, lang)} credit`,
                    })}
              </p>
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder={t('returns.addNote')}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs resize-none"
          />

          {err && <p className="text-xs text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={loading || !selectedVariantId}
              className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
            >
              {loading ? t('common.saving') : t('exchange.submitExchange', { defaultValue: 'Submit exchange request' })}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100"
            >
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
