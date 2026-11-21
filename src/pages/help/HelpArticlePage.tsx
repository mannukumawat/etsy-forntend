import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { helpService } from '@/services/miscService';
import { InfoShell } from '@/components/info/InfoShell';

export default function HelpArticlePage() {
  const { t } = useTranslation();
  const { category: catSlug, article: articleSlug } = useParams<{ category: string; article: string }>();
  const loc = useLocalized();
  const { data, isLoading } = useAsync(
    `help:article:${catSlug}:${articleSlug}`,
    () => helpService.getArticle(catSlug!, articleSlug!),
  );

  const title = data ? loc(data.article.title) : 'Loading…';
  const catName = data ? loc(data.category.name) : '';

  return (
    <InfoShell title={title} className="!max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
        <Link to="/help" className="hover:text-brand-600">{t('help.helpCenter')}</Link>
        <span>/</span>
        <Link to={`/help/${catSlug}`} className="hover:text-brand-600">{catName}</Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-sand-100" style={{ width: `${70 + (i % 3) * 10}%` }} />)}
        </div>
      ) : data ? (
        <div className="prose-store leading-relaxed text-ink-soft">
          <div className="whitespace-pre-wrap">{loc(data.article.body)}</div>
        </div>
      ) : (
        <p className="text-ink-soft">{t('help.articleNotFound')}</p>
      )}

      <div className="mt-10 border-t border-sand-200 pt-6">
        <p className="mb-3 text-sm font-medium text-ink">Was this helpful?</p>
        <div className="flex gap-3">
          <Link to="/contact" className="rounded-lg border border-sand-300 px-4 py-2 text-sm text-ink-soft hover:border-brand-600 hover:text-brand-700 transition-colors">
            No, I need more help
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <Link to={`/help/${catSlug}`} className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to {catName}
        </Link>
      </div>
    </InfoShell>
  );
}
