import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { SelectField, TextareaField, TextField } from '@/components/ui/Form';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { contactService } from '@/services/miscService';
import { contentService } from '@/services/contentService';
import { useSiteSettings } from '@/store/siteSettings';
import { useUi } from '@/store/ui';
import { CONTACT_SUBJECTS, contactSchema, type ContactValues } from '@/utils/validation';
import { InfoShell } from './InfoShell';

export default function ContactPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const toast = useUi((s) => s.toast);
  const storeContact = useSiteSettings((s) => s.store.contact);
  const { data: live } = useAsync('content:page:contact', () => contentService.getPage('contact'));
  const pageTitle = live?.content ? loc(live.content.title) : t('pages.contact.title');
  const pageIntro = live?.content ? loc(live.content.intro) : t('pages.contact.intro');
  const [sent, setSent] = useState<{ name: string; ref: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', subject: undefined, orderNumber: '', message: '' },
  });
  const subject = watch('subject');

  const onSubmit = async (values: ContactValues) => {
    try {
      const { reference } = await contactService.send(values);
      setSent({ name: values.name, ref: reference });
      reset();
    } catch {
      toast(t('toast.error'), 'error');
    }
  };

  return (
    <InfoShell title={pageTitle} intro={pageIntro} className="!max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {sent ? (
            <Notice tone="success" role="status">
              {t('pages.contact.sent', { name: sent.name, ref: sent.ref })}
            </Notice>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="card overflow-hidden">
              <div className="border-b border-sand-100 bg-ivory px-6 py-4 sm:px-8">
                <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
                  <MessageSquare className="h-4 w-4 text-brand-600" aria-hidden />
                  {t('pages.contact.send')}
                </h2>
              </div>
              <div className="space-y-5 p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="ct-name" label={t('pages.contact.name')} autoComplete="name" required error={errors.name?.message} {...register('name')} />
                  <TextField id="ct-email" type="email" label={t('pages.contact.email')} autoComplete="email" required error={errors.email?.message} {...register('email')} />
                </div>
                <SelectField id="ct-subject" label={t('pages.contact.subject')} required error={errors.subject?.message} defaultValue="" {...register('subject')}>
                  <option value="" disabled>
                    {t('address.select')}
                  </option>
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {t(`pages.contact.subjects.${s}`)}
                    </option>
                  ))}
                </SelectField>
                {subject === 'order' && (
                  <TextField id="ct-order" label={t('pages.contact.orderNumber')} placeholder={t('track.orderPlaceholder')} error={errors.orderNumber?.message} {...register('orderNumber')} />
                )}
                <TextareaField id="ct-message" label={t('pages.contact.message')} required rows={7} error={errors.message?.message} {...register('message')} />
                <div className="flex items-center justify-between gap-4 border-t border-sand-100 pt-5">
                  <p className="text-xs text-ink-muted">{t('pages.contact.responseNote')}</p>
                  <Button type="submit" size="lg" loading={isSubmitting} icon={<Send className="h-4 w-4" />}>
                    {isSubmitting ? t('pages.contact.sending') : t('pages.contact.send')}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-sand-100 bg-ivory px-5 py-4">
              <h2 className="font-sans text-sm font-semibold text-ink">{t('pages.contact.details')}</h2>
            </div>
            <ul className="space-y-0 divide-y divide-sand-100 text-sm">
              <li className="flex items-center gap-3 px-5 py-3.5 text-ink-soft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Mail className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                </span>
                <span className="break-all">{storeContact.email}</span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3.5 text-ink-soft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Phone className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                </span>
                <span>{storeContact.phone}</span>
              </li>
              <li className="flex items-start gap-3 px-5 py-3.5 text-ink-soft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                </span>
                <span>{storeContact.address}</span>
              </li>
            </ul>
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-sand-100 bg-ivory px-5 py-4">
              <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
                <Clock className="h-4 w-4 text-brand-600" aria-hidden /> {t('pages.contact.hours')}
              </h2>
            </div>
            <div className="px-5 py-4 text-sm">
              <p className="font-medium text-ink">{loc(storeContact.hours)}</p>
              <p className="mt-2 text-xs text-ink-muted">{t('pages.contact.responseNote')}</p>
            </div>
          </div>
        </aside>
      </div>
    </InfoShell>
  );
}
