import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { useLocalized } from '@/hooks/useLocale';
import { useUi } from '@/store/ui';
import { useWishlist } from '@/store/wishlist';
import type { Product } from '@/types';
import { cn } from '@/utils/cn';

export function WishlistButton({ product, variantId, className, withLabel }: { product: Product; variantId?: string; className?: string; withLabel?: boolean }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const saved = useWishlist((s) => s.items.some((i) => i.productId === product.id));
  const toggle = useWishlist((s) => s.toggle);
  const toast = useUi((s) => s.toast);
  const name = loc(product.name);

  const onClick = () => {
    const nowSaved = toggle(product.id, variantId);
    toast(nowSaved ? t('product.savedToWishlist') : t('product.removedFromWishlist'), nowSaved ? 'success' : 'info');
  };

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn('inline-flex h-11 items-center gap-2 rounded-lg border border-sand-300 bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink', className)}
      >
        <Heart className={cn('h-5 w-5', saved ? 'fill-brand-600 text-brand-600' : 'text-ink')} aria-hidden />
        {saved ? t('product.savedToWishlist') : t('product.saveToWishlist')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? t('a11y.removeFromWishlist', { name }) : t('a11y.addToWishlist', { name })}
      title={saved ? t('a11y.removeFromWishlist', { name }) : t('a11y.addToWishlist', { name })}
      className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:text-brand-700', className)}
    >
      <Heart className={cn('h-[18px] w-[18px]', saved && 'fill-brand-600 text-brand-600')} aria-hidden />
    </button>
  );
}
