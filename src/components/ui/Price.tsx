import { useTranslation } from 'react-i18next';
import { useMoney } from '@/hooks/useLocale';
import type { Minor, ProductVariant } from '@/types';
import { cn } from '@/utils/cn';
import { priceRange } from '@/utils/variants';

/** Price for a set of variants (range, sale price + original). Base amounts are converted to the active currency. */
export function VariantPrice({ variants, size = 'md', className }: { variants: ProductVariant[]; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation();
  const money = useMoney();
  if (!variants.length) return null;
  const range = priceRange(variants);
  const text = { sm: 'text-[15px]', md: 'text-base', lg: 'text-3xl' }[size];
  const onSale = range.compareAt !== undefined;
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
      {range.min === range.max ? (
        <>
          <span className={cn('font-semibold', text, onSale && 'text-brand-700')}>
            {onSale && <span className="sr-only">{t('product.salePrice')}: </span>}
            {money.formatBase(range.min)}
          </span>
          {onSale && (
            <s className="text-sm text-ink-muted">
              <span className="sr-only">{t('product.originalPrice')}: </span>
              {money.formatBase(range.compareAt!)}
            </s>
          )}
        </>
      ) : (
        <span className={cn('font-semibold', text)}>
          {money.formatBase(range.min)} – {money.formatBase(range.max)}
        </span>
      )}
    </p>
  );
}

/** Formats an amount already in the display currency. */
export function Money({ amount, className, showCode }: { amount: Minor; className?: string; showCode?: boolean }) {
  const money = useMoney();
  return <span className={className}>{money.format(amount, showCode ? 'code' : 'symbol')}</span>;
}
