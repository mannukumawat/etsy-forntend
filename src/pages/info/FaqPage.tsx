import { contentLanguage } from '@/utils/money';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { InfoShell } from './InfoShell';

export default function FaqPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const { data: live } = useAsync('content:page:faq', () => contentService.getPage('faq'));
  const content = live?.content;

  const title = content ? loc(content.title) : t('pages.faq.title');
  const intro = content ? loc(content.intro) : t('pages.faq.intro');
  const items = content
    ? content.sections.map((s) => ({ q: loc(s.heading), a: loc(s.body) }))
    : (t('pages.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>);
  // Flag admin-written page content that has no translation yet for the shopper's language.
  const contentLang = contentLanguage(lang);
  const showUntranslated = !!contentLang && !!content && !content.intro[contentLang];

  return (
    <InfoShell title={title} intro={intro} showUntranslatedNotice={showUntranslated}>
      <div className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
        {items.map((item) => (
          <details key={item.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink">
              <h2 className="font-sans text-base font-medium">{item.q}</h2>
              <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-4 text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-ink-soft">
        <Link to="/contact" className="link">
          {t('nav.contact')}
        </Link>
      </p>
    </InfoShell>
  );
}
