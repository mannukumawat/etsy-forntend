import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LocationPicker } from '@/components/address/LocationPicker';
import { getCountry } from '@/data/countries';
import { useCountries } from '@/hooks/useCountries';
import type { AddressFormValues } from '@/utils/validation';
import { Notice } from '../ui/Feedback';
import { FieldError, SelectField, TextField } from '../ui/Form';

interface AddressFieldsProps<T extends AddressFormValues> {
  form: UseFormReturn<T>;
  idPrefix: string;
  onCountryChange?: (code: string) => void;
}

/**
 * Address inputs that adapt to the selected country: labels (State / Province / County…),
 * which fields are required, postal-code format and region drop-downs all come from data/countries.ts.
 */
export function AddressFields<T extends AddressFormValues>({ form, idPrefix, onCountryChange }: AddressFieldsProps<T>) {
  const { t } = useTranslation();
  const { list, nameOf } = useCountries();
  // The generic form contains every address field; narrow it for type-safe field names.
  const f = form as unknown as UseFormReturn<AddressFormValues>;
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = f;

  const countryCode = watch('country');
  const country = getCountry(countryCode);
  const fmt = country?.format;
  const id = (name: string) => `${idPrefix}-${name}`;

  const countryField = register('country', {
    onChange: (e) => {
      const code = e.target.value as string;
      setValue('region', '');
      setValue('postalCode', '');
      setValue('phoneCountry', code);
      onCountryChange?.(code);
    },
  });

  const phoneCodes = [...list].sort((a, b) => a.label.localeCompare(b.label));
  const phoneError = errors.phone?.message ?? errors.phoneCountry?.message;

  const fillFromLocation = (vals: Partial<AddressFormValues>) => {
    if (vals.country) setValue('country', vals.country);
    if (vals.line1) setValue('line1', vals.line1);
    if (vals.line2 !== undefined) setValue('line2', vals.line2);
    if (vals.city) setValue('city', vals.city);
    if (vals.region !== undefined) setValue('region', vals.region);
    if (vals.postalCode !== undefined) setValue('postalCode', vals.postalCode);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <LocationPicker onFill={fillFromLocation} />
      </div>
      <TextField id={id('fullName')} label={t('address.fullName')} autoComplete="name" required error={errors.fullName?.message} containerClassName="sm:col-span-2" {...register('fullName')} />

      <SelectField id={id('country')} label={t('address.country')} autoComplete="country" required error={errors.country?.message} containerClassName="sm:col-span-2" {...countryField}>
        <option value="">{t('address.select')}</option>
        {list.map((c) => (
          <option key={c.code} value={c.code}>
            {c.zone ? c.label : t('address.notShipping', { country: c.label })}
          </option>
        ))}
      </SelectField>

      {country && !country.zone && (
        <Notice tone="warning" role="alert" className="sm:col-span-2" title={t('checkout.unsupportedTitle', { country: nameOf(country.code) })}>
          {t('checkout.unsupportedBody')}
        </Notice>
      )}

      <TextField
        id={id('line1')}
        label={t('address.line1')}
        placeholder={t('address.line1Placeholder')}
        autoComplete="address-line1"
        required
        error={errors.line1?.message}
        containerClassName="sm:col-span-2"
        {...register('line1')}
      />
      <TextField
        id={id('line2')}
        label={t('address.line2')}
        placeholder={t('address.line2Placeholder')}
        autoComplete="address-line2"
        error={errors.line2?.message}
        containerClassName="sm:col-span-2"
        {...register('line2')}
      />
      <TextField
        id={id('city')}
        label={t(`address.${fmt?.cityLabel ?? 'city'}`)}
        autoComplete="address-level2"
        required={fmt?.cityRequired ?? true}
        error={errors.city?.message}
        containerClassName={fmt?.region || fmt?.postal ? '' : 'sm:col-span-2'}
        {...register('city')}
      />

      {fmt?.region &&
        (fmt.region.options ? (
          <SelectField id={id('region')} label={t(`address.${fmt.region.label}`)} autoComplete="address-level1" required={fmt.region.required} error={errors.region?.message} {...register('region')}>
            <option value="">{t('address.select')}</option>
            {fmt.region.options.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>
        ) : (
          <TextField id={id('region')} label={t(`address.${fmt.region.label}`)} autoComplete="address-level1" required={fmt.region.required} error={errors.region?.message} {...register('region')} />
        ))}

      {fmt?.postal && (
        <TextField
          id={id('postalCode')}
          label={t(`address.${fmt.postal.label}`)}
          autoComplete="postal-code"
          required={fmt.postal.required}
          hint={fmt.postal.example ? t('address.example', { example: fmt.postal.example }) : undefined}
          error={errors.postalCode?.message}
          {...register('postalCode')}
        />
      )}

      <div className="sm:col-span-2">
        <span className="label" id={id('phone-label')}>
          {t('address.phone')}
          <span className="text-brand-700" aria-hidden>
            {' '}
            *
          </span>
        </span>
        <div className="flex gap-2">
          <div className="relative w-32 shrink-0">
            <label htmlFor={id('phoneCountry')} className="sr-only">
              {t('address.phoneCode')}
            </label>
            <select id={id('phoneCountry')} autoComplete="tel-country-code" className="input appearance-none pr-2 text-sm" {...register('phoneCountry')}>
              {phoneCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} {c.dialCode}
                </option>
              ))}
            </select>
          </div>
          <input
            id={id('phone')}
            type="tel"
            autoComplete="tel-national"
            aria-labelledby={id('phone-label')}
            aria-required
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? `${id('phone')}-error` : `${id('phone')}-hint`}
            className="input min-w-0 flex-1"
            {...register('phone')}
          />
        </div>
        {phoneError ? (
          <FieldError id={`${id('phone')}-error`} message={phoneError} />
        ) : (
          <p id={`${id('phone')}-hint`} className="mt-1.5 text-sm text-ink-muted">
            {t('address.phoneHint')}
          </p>
        )}
      </div>
    </div>
  );
}
