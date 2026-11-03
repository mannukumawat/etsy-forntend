import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Notice } from '@/components/ui/Feedback';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export interface InfoSection {
  heading: string;
  body: string;
}

/** Layout for content pages. `showUntranslatedNotice` flags a page whose translation (for the shopper's language) is
 *  genuinely incomplete for the active language (computed by the caller from real content, not a
 *  blanket "this page is a draft" flag — every page here is real, admin-published content now). */
export function InfoShell({ title, intro, showUntranslatedNotice, children }: { title: string; intro?: string; showUntranslatedNotice?: boolean; children: ReactNode }) {
  const { t } = useTranslation();
  useDocumentTitle(title);
  const untranslated = t('pages.untranslated');
  return (
    <div className="container-site max-w-3xl py-8 lg:py-12">
      <Breadcrumbs items={[{ label: t('common.home'), to: '/' }, { label: title }]} />
      <h1 className="mt-4 text-4xl lg:text-5xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-ink-soft">{intro}</p>}
      {showUntranslatedNotice && untranslated && (
        <Notice tone="info" className="mt-6">
          {untranslated}
        </Notice>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function Sections({ sections }: { sections: InfoSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-2xl">{s.heading}</h2>
          <p className="mt-2 text-ink-soft">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
