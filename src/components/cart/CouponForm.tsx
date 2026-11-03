import { useEffect, useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, X } from 'lucide-react';
import { validateCartCoupon } from '@/api';
import { useCart } from '@/store/cart';
import { usePreferences } from '@/store/preferences';
import { FieldError } from '../ui/Form';

export function CouponForm() {
  const { t } = useTranslation();
  const id = useId();
  const couponCode = useCart((s) => s.couponCode);
  const lines = useCart((s) => s.lines);
  const applyCoupon = useCart((s) => s.applyCoupon);
  const removeCoupon = useCart((s) => s.removeCoupon);
  const currency = usePreferences((s) => s.currency);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [checking, setChecking] = useState(false);
  const [serverValid, setServerValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!couponCode) {
      setServerValid(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    validateCartCoupon(couponCode, lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })), currency)
      .then((r) => {
        if (!cancelled) setServerValid(r.valid);
      })
      .catch(() => {
        if (!cancelled) setServerValid(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, currency, lines.length]);

  const valid = couponCode && serverValid === true;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('validation.required');
      return;
    }
    setChecking(true);
    try {
      const result = await validateCartCoupon(value, lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })), currency);
      if (!result.valid) {
        setError(result.error ?? 'cart.couponInvalid');
        setChecking(false);
        return;
      }
      applyCoupon(value);
      setServerValid(true);
      setValue('');
      setError(undefined);
    } catch {
      setError('toast.error');
    } finally {
      setChecking(false);
    }
  };

  if (valid) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4" aria-hidden />
          {t('cart.couponAppliedCode', { code: couponCode })}
        </span>
        <button type="button" onClick={removeCoupon} className="rounded p-1 hover:bg-emerald-100" aria-label={t('cart.couponRemove', { code: couponCode })}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="label">
        {t('cart.coupon')}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(undefined);
          }}
          placeholder={t('cart.couponPlaceholder')}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
          className="input h-10 min-w-0 flex-1 py-2 uppercase placeholder:normal-case"
        />
        <button type="submit" disabled={checking} className="h-10 shrink-0 rounded-lg border border-ink px-4 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50">
          {checking ? t('common.saving') : t('cart.applyCoupon')}
        </button>
      </div>
      {error && (error.includes(' ') ? <p className="mt-1.5 text-xs text-red-700">{error}</p> : <FieldError id={`${id}-error`} message={error} />)}
    </form>
  );
}
