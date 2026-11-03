import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Banknote, CreditCard, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { API_MODE } from '@/api';
import { useCheckout } from '@/store/session';
import type { PaymentMethodPreview, PaymentScenario } from '@/types';
import { cn } from '@/utils/cn';

const METHOD_ICONS: Record<PaymentMethodPreview, typeof CreditCard> = { cod: Banknote, card: CreditCard, upi: Smartphone, wallet: Wallet };

/** API mode: only cash on delivery actually works (no payment gateway is configured) — card/UPI/wallet
 *  are shown but disabled rather than hidden, so the real integration status is visible, not silently
 *  skipped. Mock mode keeps the original simulated-outcome picker unchanged. */
export function PaymentStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const method = useCheckout((s) => s.paymentMethod);
  const setMethod = useCheckout((s) => s.setPaymentMethod);
  const scenario = useCheckout((s) => s.paymentScenario);
  const setScenario = useCheckout((s) => s.setPaymentScenario);

  const card = 'cursor-pointer rounded-xl border bg-white transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600';

  if (API_MODE) {
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

  return (
    <div className="space-y-8">
      <Notice tone="demo" title={t('checkout.paymentTitle')}>
        {t('checkout.paymentDemoBanner')}
      </Notice>

      <fieldset>
        <legend className="mb-3 font-sans text-sm font-semibold">{t('checkout.paymentMethod')}</legend>
        <div className="grid grid-cols-3 gap-3">
          {(['card', 'upi', 'wallet'] as const).map((m) => {
            const Icon = METHOD_ICONS[m];
            return (
              <label key={m} className={cn(card, 'flex flex-col items-center gap-2 px-3 py-4 text-center text-sm font-medium', method === m ? 'border-ink ring-1 ring-ink' : 'border-sand-300 hover:border-ink')}>
                <input type="radio" name="payment-method" className="sr-only" checked={method === m} onChange={() => setMethod(m)} />
                <Icon className="h-6 w-6 text-ink-soft" aria-hidden />
                {t(`checkout.paymentMethods.${m}`)}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{t('checkout.paymentMethodNote')}</p>
      </fieldset>

      {method === 'card' && (
        <figure className="max-w-sm">
          <div aria-hidden className="relative aspect-[1.586] overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-ink-soft p-5 text-ivory shadow-lift">
            <div className="flex items-start justify-between">
              <span className="font-serif text-xl">Your Store</span>
              <span className="rounded bg-ivory/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{t('common.demo')}</span>
            </div>
            <div className="mt-6 h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />
            <p className="mt-4 font-mono text-lg tracking-[0.2em]">•••• •••• •••• ••••</p>
            <div className="mt-2 flex justify-between font-mono text-xs uppercase opacity-80">
              <span>DEMO CUSTOMER</span>
              <span>MM/YY</span>
            </div>
          </div>
          <figcaption className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t('checkout.cardPreviewTitle')} — {t('checkout.cardPreviewNote')}
          </figcaption>
        </figure>
      )}

      <fieldset>
        <legend className="mb-3 font-serif text-2xl font-semibold">{t('checkout.scenarioTitle')}</legend>
        <div className="space-y-3">
          {(['success', 'decline', 'cancel'] as PaymentScenario[]).map((s) => (
            <label key={s} className={cn(card, 'flex items-start gap-4 p-4', scenario === s ? 'border-ink ring-1 ring-ink' : 'border-sand-300 hover:border-ink')}>
              <input type="radio" name="payment-scenario" value={s} checked={scenario === s} onChange={() => setScenario(s)} className="mt-1 h-[18px] w-[18px] accent-brand-600" />
              <span>
                <span className="block font-medium text-ink">{t(`checkout.scenarios.${s}.label`)}</span>
                <span className="mt-0.5 block text-sm text-ink-muted">{t(`checkout.scenarios.${s}.desc`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t('common.back')}
        </Button>
        <Button size="lg" onClick={onDone}>
          {t('checkout.continueToReview')} <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
