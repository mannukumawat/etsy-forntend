import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { newsletterService } from '@/services/miscService';
import { useUi } from '@/store/ui';
import { cn } from '@/utils/cn';
import { newsletterSchema, type NewsletterValues } from '@/utils/validation';
import { FieldError } from '../ui/Form';

export function NewsletterForm({ id = 'newsletter', tone = 'light' }: { id?: string; tone?: 'light' | 'card' }) {
  const { t } = useTranslation();
  const toast = useUi((s) => s.toast);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({ resolver: zodResolver(newsletterSchema), defaultValues: { email: '' } });

  const onSubmit = async (values: NewsletterValues) => {
    try {
      await newsletterService.subscribe(values.email);
      setDone(true);
      reset();
    } catch {
      toast(t('toast.error'), 'error');
    }
  };

  if (done) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t('footer.subscribed')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor={`${id}-email`} className="sr-only">
        {t('footer.emailLabel')}
      </label>
      <div className={cn('flex overflow-hidden rounded-lg border bg-white', errors.email ? 'border-red-700' : 'border-sand-300', 'focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/25')}>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          placeholder={t('footer.emailPlaceholder')}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-error` : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] placeholder:text-ink-faint focus:outline-none"
          {...register('email')}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex shrink-0 items-center gap-1.5 bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          <span className={tone === 'card' ? '' : 'sr-only sm:not-sr-only'}>{isSubmitting ? t('footer.subscribing') : t('footer.subscribe')}</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <FieldError id={`${id}-error`} message={errors.email?.message} />
    </form>
  );
}
