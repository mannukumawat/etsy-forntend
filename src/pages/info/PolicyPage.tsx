import { contentLanguage } from '@/utils/money';
import { useTranslation } from 'react-i18next';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { InfoShell, Sections, type InfoSection } from './InfoShell';

/** Returns, privacy and terms: admin-published policy text, with locale-file copy as the mock-mode
 *  fallback (and the genuine empty state if nothing has ever been published). */
export default function PolicyPage({ page }: { page: 'returns' | 'privacy' | 'terms' }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const { data: live } = useAsync(`content:page:${page}`, () => contentService.getPage(page));
  const content = live?.content;

  const title = content ? loc(content.title) : t(`pages.${page}.title`);
  const intro = content ? loc(content.intro) : t(`pages.${page}.intro`);
  const sections: InfoSection[] = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body) }))
    : (t(`pages.${page}.sections`, { returnObjects: true }) as InfoSection[]);
  // Flag admin-written page content that has no translation yet for the shopper's language.
  const contentLang = contentLanguage(lang);
  const showUntranslated = !!contentLang && !!content && !content.intro[contentLang];

  return (
    <InfoShell title={title} intro={intro} showUntranslatedNotice={showUntranslated}>
      <Sections sections={sections} />
    </InfoShell>
  );
}
