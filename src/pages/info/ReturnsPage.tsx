import { contentLanguage } from '@/utils/money';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  const title = content ? loc(content.title) : '';
  const intro = content ? loc(content.intro) : '';
  const sections = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body) }))
    : [];

  return (
    <CustomerCareShell title={title} intro={showUntranslated ? undefined : intro}>
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

      <div className="mt-8">
        <ButtonLink to="/account/orders" variant="outline" size="sm">
          {t('pages.returns.viewOrders')}
        </ButtonLink>
      </div>

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
