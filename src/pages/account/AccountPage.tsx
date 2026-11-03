import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { OrderStatusBadge } from '@/components/order/OrderParts';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Form';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import { formatDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';
import { profileSchema, type ProfileValues } from '@/utils/validation';

export default function AccountPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  useDocumentTitle(t('account.title'));
  const user = useAuth((s) => s.user)!;
  const setUser = useAuth((s) => s.setUser);
  const toast = useUi((s) => s.toast);
  const orders = useAsync(`orders:${user.id}`, () => orderService.listForUser(user.id));

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? '' },
  });

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updated = await authService.updateProfile(user.id, values);
      setUser(updated);
      reset({ name: updated.name, email: updated.email, phone: updated.phone ?? '' });
      toast(t('account.profileSaved'), 'success');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'email_taken') setError('email', { message: 'auth.errors.email_taken' });
      else toast(t('toast.error'), 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl">{t('account.welcome', { name: user.name.split(' ')[0] })}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t('account.memberSince', { date: formatDate(user.createdAt, lang, { month: 'long', year: 'numeric' }) })}</p>
      </div>

      <section aria-labelledby="profile-title" className="card p-5 sm:p-6">
        <h2 id="profile-title" className="text-2xl">
          {t('account.profile')}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField id="pf-name" label={t('account.name')} autoComplete="name" required error={errors.name?.message} {...register('name')} />
          <TextField id="pf-email" type="email" label={t('account.email')} autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <TextField id="pf-phone" type="tel" label={t('account.phone')} autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? t('common.saving') : t('account.saveProfile')}
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="recent-title" className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recent-title" className="text-2xl">
            {t('account.recentOrders')}
          </h2>
          <Link to="/account/orders" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            {t('common.viewAll')} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-4">
          {orders.isError ? (
            <ErrorState onRetry={orders.reload} />
          ) : !orders.data ? (
            <div className="space-y-3" aria-hidden>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : orders.data.length === 0 ? (
            <p className="text-ink-muted">{t('account.noOrders')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {orders.data.slice(0, 3).map((o) => (
                <li key={o.id}>
                  <Link to={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-ivory-200/50">
                    <span>
                      <span className="block font-mono font-semibold">{o.number}</span>
                      <span className="text-sm text-ink-muted">{formatDate(o.createdAt, lang)}</span>
                    </span>
                    <OrderStatusBadge status={o.status} />
                    <span className="font-medium">{formatMoney(o.total, o.currency, lang)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
