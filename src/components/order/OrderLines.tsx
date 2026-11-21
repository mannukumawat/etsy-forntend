import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, RotateCcw, RotateCw, Star } from 'lucide-react';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import type { Order, OrderLine } from '@/types';
import { getMaxQtyPerLine } from '@/config/store';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import { formatMoney } from '@/utils/money';
import { cn } from '@/utils/cn';
import { CancelItemPanel } from './actions/CancelItemPanel';
import { ReturnItemPanel } from './actions/ReturnItemPanel';
import { ExchangeItemPanel } from './actions/ExchangeItemPanel';

type LineAction = 'cancel' | 'return' | 'exchange';

function LineActionPanel({ line, action, order, onClose }: {
  line: OrderLine; action: LineAction; order: Order; onClose: () => void;
}) {
  if (action === 'cancel') return <CancelItemPanel line={line} order={order} onClose={onClose} />;
  if (action === 'return') return <ReturnItemPanel line={line} order={order} onClose={onClose} />;
  return <ExchangeItemPanel line={line} order={order} onClose={onClose} />;
}

/** Items in an order, priced in the order's own currency snapshot. */
export function OrderLines({ order, reviewLinks = false }: { order: Order; reviewLinks?: boolean }) {
  const loc = useLocalized();
  const lang = useLanguage();
  const { t } = useTranslation();
  const [activeAction, setActiveAction] = useState<{ variantId: string; action: LineAction } | null>(null);

  const canCancel = order.status === 'placed' || order.status === 'processing';
  const canReturn = order.status === 'delivered';
  const canReview = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <ul className="divide-y divide-sand-200">
      {order.lines.map((l) => {
        const active = activeAction?.variantId === l.variantId ? activeAction.action : null;
        const cancelledQty: number = l.cancelledQty ?? 0;
        const returnedQty: number = l.returnedQty ?? 0;
        const exchangedQty: number = l.exchangedQty ?? 0;
        const fullyCancelled = cancelledQty >= l.quantity;
        const returnsAllowed: boolean = l.returnsAllowed !== false;
        const exchangeAllowed: boolean = l.exchangeAllowed !== false;
        return (
          <li key={l.variantId} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3 sm:gap-4">
              <img src={l.image.src} alt={loc(l.image.alt)} className="h-16 w-16 shrink-0 rounded-lg border border-sand-200 object-cover sm:h-20 sm:w-20" loading="lazy" />
              <div className="min-w-0 flex-1 text-sm">
                <Link to={`/product/${l.slug}`} className="text-sm font-medium text-ink hover:underline leading-snug">
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
                    {l.returnRef ? (
                      <Link to={`/account/returns/${l.returnRef}`} className="underline underline-offset-2 hover:text-amber-900">
                        {t('returns.returnRequested', { count: returnedQty, defaultValue: `${returnedQty} return requested` })}
                      </Link>
                    ) : (
                      t('returns.returnedQty', { count: returnedQty, defaultValue: `${returnedQty} returned` })
                    )}
                  </p>
                )}
                {exchangedQty > 0 && (
                  <p className="mt-0.5 text-xs font-medium text-indigo-700">
                    {l.exchangeRef ? (
                      <Link to={`/account/exchanges/${l.exchangeRef}`} className="underline underline-offset-2 hover:text-indigo-900">
                        {t('exchange.exchangeRequested', { count: exchangedQty, defaultValue: `${exchangedQty} exchange requested` })}
                      </Link>
                    ) : (
                      t('exchange.exchangedQty', { count: exchangedQty, defaultValue: `${exchangedQty} exchange requested` })
                    )}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-sm font-semibold text-ink">{formatMoney(l.lineTotal, order.currency, lang)}</p>
            </div>
            {fullyCancelled && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    useCart.getState().addItem(l.productId, l.variantId, l.quantity, getMaxQtyPerLine());
                    useUi.getState().openCart();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand-600 px-2.5 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  {t('order.buyAgain', { defaultValue: 'Buy again' })}
                </button>
              </div>
            )}
            {(((canCancel || canReturn) && !fullyCancelled) || (reviewLinks && canReview && l.productId)) && (
              <div className="mt-4 border-t border-sand-200 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setActiveAction(active === 'cancel' ? null : { variantId: l.variantId, action: 'cancel' })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                      active === 'cancel'
                        ? 'border-ink bg-ink text-white'
                        : 'border-sand-300 bg-white text-ink hover:border-ink',
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    {t('order.cancelItem')}
                  </button>
                )}
                {canReturn && returnsAllowed && (
                  <button
                    type="button"
                    onClick={() => setActiveAction(active === 'return' ? null : { variantId: l.variantId, action: 'return' })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                      active === 'return'
                        ? 'border-ink bg-ink text-white'
                        : 'border-sand-300 bg-white text-ink hover:border-ink',
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    {t('order.returnItem')}
                  </button>
                )}
                {canReturn && exchangeAllowed && (
                  <button
                    type="button"
                    onClick={() => setActiveAction(active === 'exchange' ? null : { variantId: l.variantId, action: 'exchange' })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                      active === 'exchange'
                        ? 'border-ink bg-ink text-white'
                        : 'border-sand-300 bg-white text-ink hover:border-ink',
                    )}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                    {t('order.exchangeItem')}
                  </button>
                )}
                {canReturn && !returnsAllowed && (
                  <span className="text-xs text-ink-muted">
                    {t('returns.notAllowed', { defaultValue: 'Returns not accepted for this item' })}
                  </span>
                )}
                {reviewLinks && canReview && l.productId && (
                  <Link to={`/account/orders/${order.id}/review/${l.productId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 py-2 text-xs font-semibold text-ink">
                    <Star className="h-3.5 w-3.5 text-star" fill="currentColor" strokeWidth={0} />
                    {t('product.reviewThis')}
                  </Link>
                )}
                </div>
              </div>
            )}
            {active && (
              <LineActionPanel
                line={l}
                action={active}
                order={order}
                onClose={() => setActiveAction(null)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
