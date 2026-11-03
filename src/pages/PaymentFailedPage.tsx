import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, RotateCcw } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { selectCartCount, useCart } from '@/store/cart';
import { useCheckout } from '@/store/session';

export default function PaymentFailedPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('order.failedTitle'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get('reason') === 'cancelled' ? 'cancelled' : 'declined';
  const hasDetails = useCheckout((s) => !!s.details);
  const setStep = useCheckout((s) => s.setStep);
  const cartCount = useCart(selectCartCount);

  const retry = () => {
    if (hasDetails) setStep('payment');
    navigate('/checkout');
  };

  return (
    <div className="container-site py-10">
      <EmptyState
        icon={<CreditCard className="h-7 w-7" aria-hidden />}
        title={t('order.failedTitle')}
        body={
          <>
            <span className="block font-medium text-ink">{reason === 'cancelled' ? t('order.failedCancelled') : t('order.failedDeclined')}</span>
            <span className="mt-2 block">{t('order.failedBody')}</span>
            <span className="mt-2 block text-sm">{t('common.items', { count: cartCount })}</span>
          </>
        }
        actions={
          <>
            <Button onClick={retry} icon={<RotateCcw className="h-4 w-4" aria-hidden />} disabled={cartCount === 0}>
              {t('order.retry')}
            </Button>
            <ButtonLink to="/cart" variant="outline">
              {t('order.backToCart')}
            </ButtonLink>
          </>
        }
        className="py-20"
      />
    </div>
  );
}
