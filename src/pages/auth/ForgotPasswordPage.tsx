import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services/authService';
import { useUi } from '@/store/ui';
import { forgotSchema, type ForgotValues } from '@/utils/validation';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.forgotTitle'));
  const toast = useUi((s) => s.toast);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }: ForgotValues) => {
    try {
      await authService.requestPasswordReset(email);
      setSentTo(email);
    } catch {
      toast(t('toast.error'), 'error');
    }
  };

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotBody')}>
      {sentTo ? (
        <Notice tone="success" role="status">
          {t('auth.forgotSent', { email: sentTo })}
        </Notice>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField id="forgot-email" type="email" label={t('auth.email')} autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            {isSubmitting ? t('auth.sending') : t('auth.submitForgot')}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="link">
          {t('auth.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  );
}
