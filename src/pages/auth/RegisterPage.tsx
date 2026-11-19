import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { CheckboxField, TextField } from '@/components/ui/Form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import { registerSchema, type RegisterValues } from '@/utils/validation';
import { AuthShell, safeRedirect, usePasswordToggle } from './AuthShell';

export default function RegisterPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.registerTitle'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const toast = useUi((s) => s.toast);
  const pw = usePasswordToggle();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', emailOrPhone: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  const emailOrPhoneVal = useWatch({ control, name: 'emailOrPhone' }) ?? '';
  const isEmail = emailOrPhoneVal.includes('@');
  const isPhone = !isEmail && emailOrPhoneVal.replace(/[\s\-().+]/g, '').length > 0;

  if (user && !isSubmitting) return <Navigate to={redirect} replace />;

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    const v = values.emailOrPhone.trim();
    const isEmailInput = v.includes('@');
    try {
      const created = await authService.register({
        name: values.name,
        email: isEmailInput ? v : undefined,
        phone: !isEmailInput ? v : undefined,
        password: values.password,
      });
      setUser(created);
      toast(t('auth.welcome', { name: created.name }), 'success');
      navigate(redirect, { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'email_taken') setFormError(t('auth.errors.email_taken'));
        else if (e.code === 'phone_taken') setFormError(t('auth.errors.phone_taken', { defaultValue: 'This mobile number is already registered.' }));
        else setFormError(t('toast.error'));
      } else {
        setFormError(t('toast.error'));
      }
    }
  };

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} aside={undefined}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && (
          <Notice tone="error" role="alert">
            {formError}
          </Notice>
        )}

        <TextField
          id="reg-name"
          label={t('auth.name')}
          autoComplete="name"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Single smart field — detects email vs mobile */}
        <div>
          <label htmlFor="reg-eop" className="mb-1.5 block text-sm font-medium text-ink">
            {t('auth.emailOrPhone', { defaultValue: 'Email or Mobile number' })}
            <span className="ml-1 text-brand-600" aria-hidden>*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
              {isPhone
                ? <Phone className="h-4 w-4" aria-hidden />
                : <Mail className="h-4 w-4" aria-hidden />}
            </span>
            <input
              id="reg-eop"
              type="text"
              inputMode={isEmail ? 'email' : 'tel'}
              autoComplete="username"
              placeholder={t('auth.emailOrPhonePlaceholder', { defaultValue: 'you@example.com or 9876543210' })}
              className="input w-full pl-9"
              {...register('emailOrPhone')}
            />
          </div>
          {errors.emailOrPhone?.message && (
            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
              <span aria-hidden>⚠</span>
              {t(errors.emailOrPhone.message, { defaultValue: errors.emailOrPhone.message })}
            </p>
          )}
          {!errors.emailOrPhone && (
            <p className="mt-1 text-xs text-ink-muted">
              {t('auth.emailOrPhoneHint', { defaultValue: 'Enter your email address or 10-digit mobile number' })}
            </p>
          )}
        </div>

        <TextField
          id="reg-password"
          type={pw.type}
          label={t('auth.password')}
          autoComplete="new-password"
          required
          hint={t('auth.passwordHint')}
          error={errors.password?.message}
          trailing={pw.button}
          {...register('password')}
        />
        <TextField
          id="reg-confirm"
          type={pw.type}
          label={t('auth.confirmPassword')}
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <CheckboxField
          id="reg-terms"
          label={
            <Trans
              i18nKey="auth.acceptTerms"
              components={{
                terms: <Link to="/terms" className="link" target="_blank" />,
                privacy: <Link to="/privacy" className="link" target="_blank" />,
              }}
            />
          }
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? t('auth.creating') : t('auth.submitRegister')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        {t('auth.haveAccount')}{' '}
        <Link to={`/login${params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="link">
          {t('auth.loginTitle')}
        </Link>
      </p>
    </AuthShell>
  );
}
