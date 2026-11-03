import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
import { useCountries } from '@/hooks/useCountries';
import { useLanguage, useMoney } from '@/hooks/useLocale';
import { usePreferences } from '@/store/preferences';
import { deliveryWindow, formatShortDate } from '@/utils/dates';
import { getShippingQuotes } from '@/utils/shipping';
import { SelectField } from '../ui/Form';

/** Illustrative delivery estimate for the customer's chosen destination. */
export function DeliveryEstimate() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const money = useMoney();
  const { list, nameOf } = useCountries();
  const country = usePreferences((s) => s.deliveryCountry);
  const setCountry = usePreferences((s) => s.setDeliveryCountry);
  const quotes = getShippingQuotes(country, money.currency, money.snapshot);
  const standard = quotes?.find((q) => q.id === 'standard');
  const express = quotes?.find((q) => q.id === 'express');
  const eta = standard ? deliveryWindow(standard.minDays, standard.maxDays) : null;

  return (
    <section aria-labelledby="delivery-heading" className="rounded-xl border border-sand-200 bg-white p-4">
      <h2 id="delivery-heading" className="flex items-center gap-2 font-sans text-sm font-semibold">
        <Truck className="h-4 w-4 text-brand-700" aria-hidden />
        {t('product.delivery')}
      </h2>
      <SelectField label={t('product.deliverTo')} value={country} onChange={(e) => setCountry(e.target.value)} containerClassName="mt-3" className="h-10 py-2 text-sm" required>
        {list.map((c) => (
          <option key={c.code} value={c.code}>
            {c.zone ? c.label : t('address.notShipping', { country: c.label })}
          </option>
        ))}
      </SelectField>
      <div className="mt-3 text-sm" aria-live="polite">
        {standard && express && eta ? (
          <>
            <p className="font-medium text-ink">
              {t('product.deliveryEstimate', { start: formatShortDate(eta.start, lang), end: formatShortDate(eta.end, lang) })}
            </p>
            <p className="mt-0.5 text-ink-muted">
              {t('product.deliveryCost', { price: money.format(standard.amount), express: money.format(express.amount) })}
            </p>
            <p className="mt-2 text-xs text-ink-muted">{t('product.deliveryIllustrative')}</p>
          </>
        ) : (
          <p className="font-medium text-amber-900">{t('product.deliveryUnsupported', { country: nameOf(country) })}</p>
        )}
      </div>
    </section>
  );
}
