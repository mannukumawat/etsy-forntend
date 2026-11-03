import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import type { Product, ProductVariant } from '@/types';
import { maxLineQuantity } from '@/utils/variants';
import { useLocalized } from './useLocale';

/** Adds a variant to the cart with stock-limit feedback. Returns the quantity actually added. */
export function useAddToCart() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const addItem = useCart((s) => s.addItem);
  const toast = useUi((s) => s.toast);
  const openCart = useUi((s) => s.openCart);

  return useCallback(
    (product: Product, variant: ProductVariant, quantity: number, opts: { openDrawer?: boolean; silent?: boolean } = {}) => {
      const { openDrawer = true, silent = false } = opts;
      const max = maxLineQuantity(variant);
      const added = addItem(product.id, variant.id, quantity, max);
      if (added === 0) {
        toast(t('product.maxInCart', { count: max }), 'error');
        return 0;
      }
      if (added < quantity) toast(t('product.partiallyAdded', { count: added }), 'info');
      else if (!openDrawer && !silent) {
        toast(t('product.addedToCart', { name: loc(product.name) }), 'success', { label: t('product.viewCart'), onClick: openCart });
      }
      if (openDrawer) openCart();
      return added;
    },
    [addItem, toast, openCart, t, loc],
  );
}
