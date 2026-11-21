import { contentLanguage } from '@/utils/money';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { CustomerCareShell } from '@/components/layout/CustomerCareShell';
import { InfoShell, Sections, type InfoSection } from '@/components/info/InfoShell';

export default function PolicyPage({ page }: { page: 'returns' | 'privacy' | 'terms' }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const { data: live } = useAsync(`content:page:${page}`, () => contentService.getPage(page));
  const content = live?.content;

  const title = content ? loc(content.title) : '';
  const intro = content ? loc(content.intro) : '';
  const sections: InfoSection[] = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body) }))
    : [];
  const contentLang = contentLanguage(lang);
  const showUntranslated = !!contentLang && !!content && !content.intro[contentLang];

  if (page === 'returns') {
    return (
      <CustomerCareShell title={title} intro={intro}>
        <Sections sections={sections} />
        <div className="mt-8">
          <Link to="/account/orders" className="btn btn-outline">
            {t('pages.returns.viewOrders')}
          </Link>
        </div>
      </CustomerCareShell>
    );
  }

  return (
    <InfoShell title={title} intro={intro} showUntranslatedNotice={showUntranslated}>
      <Sections sections={sections} />
    </InfoShell>
  );
}
