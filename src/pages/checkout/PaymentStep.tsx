import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCheckout } from '@/store/session';
import type { PaymentMethodPreview } from '@/types';
import { cn } from '@/utils/cn';

const METHOD_ICONS: Record<PaymentMethodPreview, typeof CreditCard> = { cod: Banknote, card: CreditCard, upi: Smartphone, wallet: Wallet };

/** Only cash on delivery actually works (no payment gateway is configured) — card/UPI/wallet
 *  are shown but disabled rather than hidden, so the real integration status is visible, not silently
 *  skipped. */
export function PaymentStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const method = useCheckout((s) => s.paymentMethod);
  const setMethod = useCheckout((s) => s.setPaymentMethod);

  const card = 'cursor-pointer rounded-xl border bg-white transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600';

  const methods: PaymentMethodPreview[] = ['cod', 'card', 'upi', 'wallet'];
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 font-serif text-2xl font-semibold">{t('checkout.paymentTitle')}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {methods.map((m) => {
            const Icon = METHOD_ICONS[m];
            const available = m === 'cod';
            return (
              <label
                key={m}
                className={cn(
                  card,
                  'flex flex-col items-center gap-2 px-3 py-4 text-center text-sm font-medium',
                  !available && 'cursor-not-allowed opacity-50',
                  method === m ? 'border-ink ring-1 ring-ink' : 'border-sand-300',
                  available && 'hover:border-ink',
                )}
              >
                <input type="radio" name="payment-method" className="sr-only" checked={method === m} disabled={!available} onChange={() => available && setMethod(m)} />
                <Icon className="h-6 w-6 text-ink-soft" aria-hidden />
                {t(`checkout.paymentMethods.${m}`)}
                {!available && <span className="text-[11px] font-normal text-ink-faint">{t('checkout.gatewayNotConfigured')}</span>}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{method === 'cod' ? t('checkout.codNote') : t('checkout.gatewayNotConfigured')}</p>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t('common.back')}
        </Button>
        <Button size="lg" onClick={onDone} disabled={method !== 'cod'}>
          {t('checkout.continueToReview')} <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
