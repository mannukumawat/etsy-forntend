import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { useCountries } from '@/hooks/useCountries';
import { useLanguage, useMoney } from '@/hooks/useLocale';
import { useCheckout } from '@/store/session';
import { cn } from '@/utils/cn';
import { deliveryWindow, formatShortDate } from '@/utils/dates';
import { getShippingQuotes } from '@/utils/shipping';

export function ShippingStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const money = useMoney();
  const { nameOf } = useCountries();
  const details = useCheckout((s) => s.details);
  const method = useCheckout((s) => s.shippingMethod);
  const setMethod = useCheckout((s) => s.setShippingMethod);

  const quotes = details ? getShippingQuotes(details.country, money.currency, money.snapshot) : null;

  if (!details || !quotes) {
    return (
      <div className="space-y-6">
        <Notice tone="warning" role="alert" title={t('checkout.unsupportedTitle', { country: details ? nameOf(details.country) : '' })}>
          {t('checkout.unsupportedBody')}
        </Notice>
        <Button variant="outline" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-4 font-serif text-2xl font-semibold">{t('checkout.shippingTitle')}</legend>
        <div className="space-y-3">
          {quotes.map((q) => {
            const eta = deliveryWindow(q.minDays, q.maxDays);
            const checked = method === q.id;
            return (
              <label
                key={q.id}
                className={cn(
                  'flex cursor-pointer items-start gap-4 rounded-xl border bg-white p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600',
                  checked ? 'border-ink ring-1 ring-ink' : 'border-sand-300 hover:border-ink',
                )}
              >
                <input type="radio" name="shipping-method" value={q.id} checked={checked} onChange={() => setMethod(q.id)} className="mt-1 h-[18px] w-[18px] accent-brand-600" />
                <span className="flex-1">
                  <span className="block font-medium text-ink">{t(`checkout.methods.${q.id}`)}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{t('checkout.businessDays', { min: q.minDays, max: q.maxDays })}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    {t('checkout.arrives', { start: formatShortDate(eta.start, lang), end: formatShortDate(eta.end, lang) })}
                  </span>
                </span>
                <span className="font-semibold text-ink">{money.format(q.amount)}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ink-muted">{t('checkout.estimateNote')}</p>
      </fieldset>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t('common.back')}
        </Button>
        <Button size="lg" onClick={onDone}>
          {t('checkout.continueToPayment')} <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
