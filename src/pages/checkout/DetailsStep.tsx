import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus, UserCircle2 } from 'lucide-react';
import { AddressFields } from '@/components/checkout/AddressFields';
import { Button } from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/Form';
import { getCountry } from '@/data/countries';
import { useCountries } from '@/hooks/useCountries';
import { authService } from '@/services/authService';
import { usePreferences } from '@/store/preferences';
import { useAuth, useCheckout } from '@/store/session';
import type { SavedAddress } from '@/types';
import { cn } from '@/utils/cn';
import { checkoutDetailsSchema, type CheckoutDetailsValues } from '@/utils/validation';

function fromAddress(a: SavedAddress) {
  const { id: _id, label: _label, isDefault: _d, ...rest } = a;
  return { ...rest, line2: rest.line2 ?? '', region: rest.region ?? '', postalCode: rest.postalCode ?? '' };
}

export function DetailsStep({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { nameOf } = useCountries();
  const user = useAuth((s) => s.user);
  const details = useCheckout((s) => s.details);
  const setDetails = useCheckout((s) => s.setDetails);
  const prefCountry = usePreferences((s) => s.deliveryCountry);
  const setPrefCountry = usePreferences((s) => s.setDeliveryCountry);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  // null = no saved addresses or "add new"; string = saved address id selected
  const [selectedSaved, setSelectedSaved] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const form = useForm<CheckoutDetailsValues>({
    resolver: zodResolver(checkoutDetailsSchema),
    mode: 'onTouched',
    defaultValues: details ?? {
      email: user?.email ?? '',
      marketing: false,
      fullName: user?.name ?? '',
      phoneCountry: prefCountry,
      phone: '',
      country: prefCountry,
      line1: '',
      line2: '',
      city: '',
      region: '',
      postalCode: '',
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  // Signed-in customers can pick a saved address (demo data, in memory).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    authService.listAddresses().then(
      (list) => {
        if (cancelled) return;
        setSaved(list);
        const def = list.find((a) => a.isDefault);
        if (def && !details) {
          reset({ ...getValues(), ...fromAddress(def) });
          setSelectedSaved(def.id);
          setAddingNew(false);
          setPrefCountry(def.country);
        }
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const country = watch('country');
  const unsupported = !!country && !getCountry(country)?.zone;

  const onSubmit = (values: CheckoutDetailsValues) => {
    if (!getCountry(values.country)?.zone) {
      setError('country', { message: 'checkout.shippingError' });
      return;
    }
    setDetails(values);
    setPrefCountry(values.country);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {user ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <UserCircle2 className="h-5 w-5 text-ink-muted" aria-hidden />
          {t('checkout.signedInAs', { email: user.email })}
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm">
          <p className="text-ink-soft">
            {t('checkout.haveAccount')}{' '}
            <Link to="/login?redirect=/checkout" className="link">
              {t('checkout.signInLink')}
            </Link>
          </p>
          <p className="text-ink-muted">{t('checkout.guestNote')}</p>
        </div>
      )}

      <section aria-labelledby="contact-title">
        <h2 id="contact-title" className="mb-4 text-2xl">
          {t('checkout.contactTitle')}
        </h2>
        <div className="space-y-4">
          <TextField id="co-email" type="email" label={t('checkout.email')} autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <CheckboxField id="co-marketing" label={t('checkout.marketing')} {...register('marketing')} />
        </div>
      </section>

      <section aria-labelledby="address-title">
        <h2 id="address-title" className="mb-4 text-2xl">
          {t('checkout.addressTitle')}
        </h2>
        {saved.length > 0 ? (
          <>
            <div className="space-y-2 mb-4">
              {saved.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600',
                    selectedSaved === a.id && !addingNew ? 'border-ink ring-1 ring-ink' : 'border-sand-300 hover:border-ink',
                  )}
                >
                  <input
                    type="radio"
                    name="saved-address"
                    className="mt-0.5 shrink-0 accent-ink"
                    checked={selectedSaved === a.id && !addingNew}
                    onChange={() => {
                      setSelectedSaved(a.id);
                      setAddingNew(false);
                      reset({ ...getValues(), ...fromAddress(a) });
                      setPrefCountry(a.country);
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{a.fullName}</p>
                    <p className="text-ink-muted leading-snug">
                      {[a.line1, a.line2, a.city, a.region, a.postalCode, nameOf(a.country)].filter(Boolean).join(', ')}
                    </p>
                    {a.phone && <p className="text-ink-muted">{a.phone}</p>}
                  </div>
                </label>
              ))}
              <button
                type="button"
                onClick={() => { setAddingNew(true); setSelectedSaved(null); }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors',
                  addingNew ? 'border-ink ring-1 ring-ink bg-white' : 'border-dashed border-sand-300 hover:border-ink bg-white',
                )}
              >
                <Plus className="h-4 w-4 text-ink-muted" aria-hidden />
                <span className="font-medium text-ink">{t('checkout.addNewAddress')}</span>
              </button>
            </div>
            {addingNew && (
              <AddressFields
                form={form}
                idPrefix="co"
                onCountryChange={(code) => {
                  if (getCountry(code)) setPrefCountry(code);
                }}
              />
            )}
          </>
        ) : (
          <AddressFields
            form={form}
            idPrefix="co"
            onCountryChange={(code) => {
              setSelectedSaved(null);
              if (getCountry(code)) setPrefCountry(code);
            }}
          />
        )}
      </section>

      <Button type="submit" size="lg" loading={isSubmitting} disabled={unsupported} className="w-full sm:w-auto">
        {t('checkout.continueToShipping')} <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}
