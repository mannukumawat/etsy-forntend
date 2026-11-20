import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AddressBlock } from '@/components/checkout/AddressBlock';
import { Button } from '@/components/ui/Button';
import { useLanguage, useMoney } from '@/hooks/useLocale';
import { useCheckout, type CheckoutStep } from '@/store/session';
import { deliveryWindow, formatShortDate } from '@/utils/dates';
import { getShippingQuote } from '@/utils/shipping';

function Block({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
        <div className="mt-1 text-sm">{children}</div>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800" aria-label={`${t('checkout.change')}: ${title}`}>
        {t('checkout.change')}
      </button>
    </div>
  );
}

interface ReviewStepProps {
  onEdit: (step: CheckoutStep) => void;
  onDone: () => void;
}

export function ReviewStep({ onEdit, onDone }: ReviewStepProps) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const money = useMoney();
  const { details, shippingMethod } = useCheckout();

  if (!details) return null;
  const quote = getShippingQuote(details.country, shippingMethod, money.currency, money.snapshot);
  const eta = quote ? deliveryWindow(quote.minDays, quote.maxDays) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">{t('checkout.reviewTitle')}</h2>
      <div className="divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white px-4">
        <Block title={t('checkout.contact')} onEdit={() => onEdit('details')}>
          <p className="text-ink-soft">{details.email}</p>
        </Block>
        <Block title={t('checkout.shipTo')} onEdit={() => onEdit('details')}>
          <AddressBlock address={details} />
        </Block>
        <Block title={t('checkout.method')} onEdit={() => onEdit('shipping')}>
          {quote && eta ? (
            <p className="text-ink-soft">
              {t(`checkout.methods.${shippingMethod}`)} · {money.format(quote.amount)}
              <span className="block text-ink-muted">{t('checkout.arrives', { start: formatShortDate(eta.start, lang), end: formatShortDate(eta.end, lang) })}</span>
            </p>
          ) : (
            <p className="text-amber-800">{t('cart.notAvailable')}</p>
          )}
        </Block>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={() => onEdit('shipping')} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t('common.back')}
        </Button>
        <Button size="lg" onClick={onDone}>
          {t('checkout.continueToPayment', { defaultValue: 'Continue to Payment' })} <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
