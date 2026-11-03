import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useLocalized, useMoney } from '@/hooks/useLocale';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import type { ResolvedLine } from '@/utils/cart';
import { cn } from '@/utils/cn';
import { variantLabel } from '@/utils/variants';
import { Skeleton } from '../ui/Feedback';
import { QuantityInput } from '../ui/QuantityInput';

export function CartLineItem({ item, index, compact, onNavigate }: { item: ResolvedLine; index: number; compact?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const money = useMoney();
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const restoreLine = useCart((s) => s.restoreLine);
  const toast = useUi((s) => s.toast);

  if (item.status === 'loading') {
    return (
      <li className="flex gap-4 py-4" aria-hidden>
        <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-8 w-28" />
        </div>
      </li>
    );
  }

  const { product, variant, line, issue } = item;
  const name = product ? loc(product.name) : line.productId;
  const label = product && variant ? variantLabel(product, variant) : null;
  const unit = item.unitBase !== undefined ? money.convert(item.unitBase) : 0;
  const image = variant?.images[0] ?? product?.images[0];

  const remove = () => {
    removeItem(line.productId, line.variantId);
    toast(t('cart.removed', { name }), 'info', { label: t('cart.undo'), onClick: () => restoreLine(line, index) });
  };

  const issueText =
    issue === 'unavailable'
      ? t('cart.issues.unavailable')
      : issue === 'out_of_stock'
        ? t('cart.issues.out_of_stock')
        : issue === 'insufficient'
          ? t('cart.issues.insufficient', { count: item.maxQuantity })
          : null;
  const issueId = `line-issue-${line.variantId}`;

  return (
    <li className="flex gap-4 py-4">
      <div className={cn('shrink-0 overflow-hidden rounded-lg bg-sand-100', compact ? 'h-20 w-20' : 'h-24 w-24 sm:h-28 sm:w-28')}>
        {image && <img src={image.src} alt={loc(image.alt)} className={cn('h-full w-full object-cover', issue && issue !== 'insufficient' && 'opacity-60 grayscale')} loading="lazy" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product ? (
              <Link to={`/product/${product.slug}${variant ? `?variant=${encodeURIComponent(variant.id)}` : ''}`} onClick={onNavigate} className="font-medium leading-snug text-ink hover:underline">
                {name}
              </Link>
            ) : (
              <span className="font-medium text-ink-muted">{name}</span>
            )}
            {label && <p className="mt-0.5 text-sm text-ink-muted">{loc(label)}</p>}
            {item.unitBase !== undefined && !compact && <p className="mt-0.5 text-sm text-ink-muted">{t('cart.each', { price: money.format(unit) })}</p>}
          </div>
          {item.unitBase !== undefined && <p className="shrink-0 font-semibold text-ink">{money.format(unit * line.quantity)}</p>}
        </div>
        {issueText && (
          <p id={issueId} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {issueText}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          {variant && issue !== 'out_of_stock' && issue !== 'unavailable' ? (
            <QuantityInput
              value={line.quantity}
              max={Math.max(item.maxQuantity, 1)}
              onChange={(q) => setQuantity(line.productId, line.variantId, q)}
              label={t('a11y.quantityFor', { name })}
              hideLabel
              size="sm"
              describedBy={issueText ? issueId : undefined}
            />
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={remove}
            className="flex items-center gap-1.5 rounded px-1 text-sm text-ink-muted underline-offset-2 hover:text-red-700 hover:underline"
            aria-label={t('a11y.removeItem', { name })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className={compact ? 'sr-only' : ''}>{t('common.remove')}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
