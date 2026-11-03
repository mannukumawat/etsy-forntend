import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/ui/Button';
import { STORY_IMAGE } from '@/data/categories';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { InfoShell, Sections, type InfoSection } from './InfoShell';

export default function AboutPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { data: live } = useAsync('content:page:about', () => contentService.getPage('about'));
  const content = live?.content;

  const title = content ? loc(content.title) : t('pages.about.title');
  const intro = content ? loc(content.intro) : t('pages.about.intro');
  const sections: InfoSection[] = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body) }))
    : (t('pages.about.sections', { returnObjects: true }) as InfoSection[]);

  return (
    <InfoShell title={title} intro={intro}>
      <img src={STORY_IMAGE} alt="" width={1200} height={900} className="mb-10 aspect-[4/3] w-full rounded-2xl object-cover" />
      <Sections sections={sections} />
      <ButtonLink to="/shop" className="mt-10">
        {t('pages.about.cta')}
      </ButtonLink>
    </InfoShell>
  );
}
