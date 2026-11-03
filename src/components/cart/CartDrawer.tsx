import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';
import { useCartDetails } from '@/hooks/useCartDetails';
import { useMoney } from '@/hooks/useLocale';
import { selectCartCount, useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import { ButtonLink } from '../ui/Button';
import { Drawer } from '../ui/Dialog';
import { EmptyState, ErrorState, Notice } from '../ui/Feedback';
import { CartLineItem } from './CartLineItem';

export function CartDrawer() {
  const { t } = useTranslation();
  const money = useMoney();
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  const count = useCart(selectCartCount);
  const { lines, totals, isEmpty, isError, hasIssues, reload } = useCartDetails();

  return (
    <Drawer
      open={open}
      onClose={close}
      title={t('cart.drawerTitle', { count })}
      footer={
        !isEmpty && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{t('cart.subtotal')}</span>
              <span className="font-serif text-2xl font-semibold">
                <span className="mr-1.5 font-sans text-xs font-medium text-ink-muted">{money.currency}</span>
                {money.format(totals.subtotal)}
              </span>
            </div>
            <p className="text-xs text-ink-muted">{t('cart.drawerNote')}</p>
            {hasIssues && <Notice tone="warning">{t('cart.fixIssues')}</Notice>}
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink to="/cart" variant="outline" onClick={close}>
                {t('cart.viewCart')}
              </ButtonLink>
              <ButtonLink to={hasIssues ? '/cart' : '/checkout'} onClick={close}>
                {t('cart.checkout')}
              </ButtonLink>
            </div>
          </div>
        )
      }
    >
      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" aria-hidden />}
          title={t('cart.empty')}
          body={t('cart.emptyBody')}
          actions={
            <ButtonLink to="/shop" onClick={close}>
              {t('cart.startShopping')}
            </ButtonLink>
          }
        />
      ) : isError ? (
        <ErrorState onRetry={reload} />
      ) : (
        <ul className="divide-y divide-sand-200">
          {lines.map((item, i) => (
            <CartLineItem key={`${item.line.productId}-${item.line.variantId}`} item={item} index={i} compact onNavigate={close} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
