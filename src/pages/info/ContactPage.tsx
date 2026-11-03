import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
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
    <InfoShell title={pageTitle} intro={pageIntro}>
      <div className="grid gap-8 md:grid-cols-[1fr_260px]">
        <div>
          {sent ? (
            <Notice tone="success" role="status">
              {t('pages.contact.sent', { name: sent.name, ref: sent.ref })}
            </Notice>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-5 sm:p-6">
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
              <TextareaField id="ct-message" label={t('pages.contact.message')} required rows={6} error={errors.message?.message} {...register('message')} />
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? t('pages.contact.sending') : t('pages.contact.send')}
              </Button>
            </form>
          )}
        </div>
        <aside className="space-y-4 text-sm">
          <div className="card p-5">
            <h2 className="font-sans text-sm font-semibold">{t('pages.contact.details')}</h2>
            <p className="mt-1 text-xs text-ink-muted">{t('footer.sampleContact')}</p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden /> {storeContact.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden /> {storeContact.phone}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden /> {storeContact.address}
              </li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-sans text-sm font-semibold">
              <Clock className="h-4 w-4 text-ink-muted" aria-hidden /> {t('pages.contact.hours')}
            </h2>
            <p className="mt-2 text-ink-soft">{loc(storeContact.hours)}</p>
            <p className="mt-2 text-xs text-ink-muted">{t('pages.contact.responseNote')}</p>
          </div>
        </aside>
      </div>
    </InfoShell>
  );
}
