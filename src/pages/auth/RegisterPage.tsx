import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { CheckboxField, TextField } from '@/components/ui/Form';
import { API_MODE } from '@/api';
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  if (user && !isSubmitting) return <Navigate to={redirect} replace />;

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      const created = await authService.register({ name: values.name, email: values.email, password: values.password });
      setUser(created);
      toast(t('auth.welcome', { name: created.name }), 'success');
      navigate(redirect, { replace: true });
    } catch (e) {
      setFormError(e instanceof ApiError && e.code === 'email_taken' ? t('auth.errors.email_taken') : t('toast.error'));
    }
  };

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} aside={API_MODE ? undefined : <Notice tone="demo">{t('auth.registerNote')}</Notice>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <Notice tone="error" role="alert">
            {formError}
          </Notice>
        )}
        <TextField id="reg-name" label={t('auth.name')} autoComplete="name" required error={errors.name?.message} {...register('name')} />
        <TextField id="reg-email" type="email" label={t('auth.email')} autoComplete="email" required error={errors.email?.message} {...register('email')} />
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
