import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services/authService';
import { useUi } from '@/store/ui';
import { resetPasswordSchema, type ResetPasswordValues } from '@/utils/validation';
import { AuthShell, usePasswordToggle } from './AuthShell';

/** Reached from the link sent by the "forgot password" flow (?token=...). New capability — the mock
 *  never modelled a confirm step since it had no real password storage to reset. */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.resetTitle'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const toast = useUi((s) => s.toast);
  const pw = usePasswordToggle();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });

  if (!token) {
    return (
      <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetBody')}>
        <Notice tone="error" role="alert">
          {t('auth.resetInvalid')}
        </Notice>
        <p className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="link">
            {t('auth.requestNewReset')}
          </Link>
        </p>
      </AuthShell>
    );
  }

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await authService.confirmPasswordReset(token, values.password);
      toast(t('auth.resetSuccess'), 'success');
      navigate('/login', { replace: true });
    } catch {
      setError('password', { message: 'auth.resetInvalid' });
    }
  };

  return (
    <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetBody')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField
          id="reset-password"
          type={pw.type}
          label={t('auth.newPassword')}
          autoComplete="new-password"
          required
          hint={t('auth.passwordHint')}
          error={errors.password?.message ? t(errors.password.message) : undefined}
          trailing={pw.button}
          {...register('password')}
        />
        <TextField
          id="reset-confirm"
          type={pw.type}
          label={t('auth.confirmPassword')}
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? t('auth.updating') : t('auth.submitReset')}
        </Button>
      </form>
    </AuthShell>
  );
}
