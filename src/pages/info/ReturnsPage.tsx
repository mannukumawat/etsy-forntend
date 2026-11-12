import { contentLanguage } from '@/utils/money';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarCheck } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { CustomerCareShell } from '@/components/layout/CustomerCareShell';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';

export default function ReturnsPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const { data: live } = useAsync('content:page:returns', () => contentService.getPage('returns'));
  const content = live?.content;
  const contentLang = contentLanguage(lang);
  const showUntranslated = !!contentLang && !!content && !content.intro[contentLang];

  const title = content ? loc(content.title) : t('pages.returns.title');
  const intro = content ? loc(content.intro) : t('pages.returns.intro');
  const sections = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body) }))
    : (t('pages.returns.sections', { returnObjects: true }) as Array<{ heading: string; body: string }>);

  return (
    <CustomerCareShell title={title} intro={showUntranslated ? undefined : intro}>
      {/* Return window highlight */}
      <div className="mb-6 flex items-start gap-4 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
          <CalendarCheck className="h-5 w-5 text-brand-600" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink">{t('pages.returns.window', { days: 30 })}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{t('pages.returns.windowBody')}</p>
        </div>
        <ButtonLink to="/account/orders" variant="outline" size="sm" className="shrink-0">
          {t('pages.returns.viewOrders')}
        </ButtonLink>
      </div>

      {/* Policy sections */}
      {Array.isArray(sections) && sections.length > 0 && (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-sans text-base font-semibold text-ink">{section.heading}</h2>
              <p className="mt-2 text-sm text-ink-soft">{section.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contact link */}
      <p className="mt-8 text-sm text-ink-soft">
        {t('pages.returns.questions')}{' '}
        <Link to="/contact" className="link">
          {t('nav.contact')}
        </Link>
        .
      </p>
    </CustomerCareShell>
  );
}
