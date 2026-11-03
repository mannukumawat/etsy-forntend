import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PackageSearch, Truck } from 'lucide-react';
import { OrderLines, OrderStatusBadge, OrderTimeline } from '@/components/order/OrderParts';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { TextField } from '@/components/ui/Form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { DEMO_TRACKING_EXAMPLE } from '@/services/mockDb';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/session';
import type { Order } from '@/types';
import { deliveryWindow, formatShortDate } from '@/utils/dates';
import { normalizeOrderNumber, trackSchema, type TrackValues } from '@/utils/validation';

export default function TrackOrderPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  useDocumentTitle(t('track.title'));
  const [params] = useSearchParams();
  const user = useAuth((s) => s.user);
  const [result, setResult] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TrackValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: { orderNumber: params.get('order') ?? '', email: params.get('email') ?? '' },
  });

  const onSubmit = async (values: TrackValues) => {
    setNotFound(false);
    setFailed(false);
    setResult(null);
    try {
      setResult(await orderService.track(normalizeOrderNumber(values.orderNumber), values.email));
    } catch (e) {
      if (e instanceof ApiError && e.code === 'not_found') setNotFound(true);
      else setFailed(true);
    }
  };

  const eta = result ? deliveryWindow(result.shippingMethod.minDays, result.shippingMethod.maxDays, new Date(result.createdAt)) : null;

  return (
    <div className="container-site max-w-3xl py-10 lg:py-14">
      <h1 className="text-4xl lg:text-5xl">{t('track.title')}</h1>
      <p className="mt-2 text-ink-muted">{t('track.subtitle')}</p>

      <Notice tone="demo" className="mt-6">
        <p>{t('track.demoNote', { order: DEMO_TRACKING_EXAMPLE.orderNumber, email: DEMO_TRACKING_EXAMPLE.email })}</p>
        <button
          type="button"
          className="mt-2 font-semibold underline underline-offset-2"
          onClick={() => {
            setValue('orderNumber', DEMO_TRACKING_EXAMPLE.orderNumber, { shouldValidate: true });
            setValue('email', DEMO_TRACKING_EXAMPLE.email, { shouldValidate: true });
          }}
        >
          {t('track.useExample')}
        </button>
      </Notice>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <TextField id="track-order" label={t('track.orderNumber')} placeholder={t('track.orderPlaceholder')} required error={errors.orderNumber?.message} autoComplete="off" {...register('orderNumber')} />
        <TextField id="track-email" type="email" label={t('track.email')} required error={errors.email?.message} autoComplete="email" {...register('email')} />
        <Button type="submit" loading={isSubmitting} className="sm:mt-7">
          {isSubmitting ? t('track.searching') : t('track.submit')}
        </Button>
      </form>

      <div className="mt-8" aria-live="polite">
        {notFound && (
          <Notice tone="error" role="alert" title={t('track.notFoundTitle')}>
            {t('track.notFoundBody')}
          </Notice>
        )}
        {failed && (
          <Notice tone="error" role="alert">
            {t('toast.error')}
          </Notice>
        )}
        {result && eta && (
          <section aria-labelledby="track-result" className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="track-result" className="text-3xl">
                {t('track.resultTitle', { number: result.number })}
              </h2>
              <OrderStatusBadge status={result.status} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {t('order.estimatedDelivery')}: {formatShortDate(eta.start, lang)} – {formatShortDate(eta.end, lang)}
            </p>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <OrderTimeline order={result} />
              <div className="space-y-4 text-sm">
                <div className="rounded-xl bg-ivory-200/70 p-4">
                  <p className="flex items-center gap-2 font-semibold">
                    <Truck className="h-4 w-4" aria-hidden /> {t('track.carrier')}
                  </p>
                  {result.tracking ? (
                    <dl className="mt-2 space-y-1">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">{t('track.carrier')}</dt>
                        <dd>{result.tracking.carrier}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">{t('track.trackingNumber')}</dt>
                        <dd className="font-mono">{result.tracking.number}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-ink-muted">{t('track.trackingPending')}</p>
                  )}
                  <p className="mt-3 text-xs text-ink-muted">{t('track.trackingPlaceholder')}</p>
                </div>
                {user && result.userId === user.id && (
                  <Link to={`/account/orders/${result.id}`} className="link">
                    {t('track.viewDetails')}
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-6 border-t border-sand-200 pt-4">
              <OrderLines order={result} />
            </div>
          </section>
        )}
        {!result && !notFound && !failed && !isSubmitting && (
          <div className="flex flex-col items-center py-8 text-center text-ink-muted">
            <PackageSearch className="h-10 w-10" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
