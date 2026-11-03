import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import { loginSchema, type LoginValues } from '@/utils/validation';
import { AuthShell, safeRedirect, usePasswordToggle } from './AuthShell';

export default function LoginPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.loginTitle'));
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
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  if (user && !isSubmitting) return <Navigate to={redirect} replace />;

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const signedIn = await authService.login(values.email, values.password);
      setUser(signedIn);
      toast(t('toast.signedIn', { name: signedIn.name }), 'success');
      navigate(redirect, { replace: true });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setFormError(['invalid_credentials', 'no_account'].includes(code) ? t(`auth.errors.${code}`) : t('toast.error'));
    }
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <Notice tone="error" role="alert">
            {formError}
          </Notice>
        )}
        <TextField id="login-email" type="email" label={t('auth.email')} autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <TextField
          id="login-password"
          type={pw.type}
          label={t('auth.password')}
          autoComplete="current-password"
          required
          error={errors.password?.message}
          trailing={pw.button}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="link text-sm">
            {t('auth.forgot')}
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.submitLogin')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        {t('auth.noAccount')}{' '}
        <Link to={`/register${params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="link">
          {t('auth.createAccount')}
        </Link>
      </p>
      {redirect === '/checkout' && (
        <p className="mt-2 text-center text-sm">
          <Link to="/checkout" className="link">
            {t('auth.continueAsGuest')}
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
