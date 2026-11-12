import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { helpService, type HelpArticle } from '@/services/miscService';
import { InfoShell } from '@/pages/info/InfoShell';

function ArticleRow({ article, catSlug }: { article: HelpArticle; catSlug: string }) {
  const loc = useLocalized();
  return (
    <Link
      to={`/help/${catSlug}/${article.slug}`}
      className="flex items-center gap-4 border-b border-sand-100 px-5 py-4 last:border-0 hover:bg-ivory transition-colors group"
    >
      <FileText className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex-1 font-medium text-ink group-hover:text-brand-700">{loc(article.title)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}

export default function HelpCategoryPage() {
  const { category: catSlug } = useParams<{ category: string }>();
  const loc = useLocalized();
  const { data, isLoading } = useAsync(`help:cat:${catSlug}`, () => helpService.getCategory(catSlug!));

  const title = data ? loc(data.category.name) : 'Loading…';
  const intro = data ? loc(data.category.description) : undefined;

  return (
    <InfoShell title={title} intro={intro || undefined} className="!max-w-3xl">
      <div className="mb-6">
        <Link to="/help" className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to Help Center
        </Link>
      </div>

      {isLoading ? (
        <div className="card divide-y divide-sand-100">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-sand-50" />)}
        </div>
      ) : !data?.articles.length ? (
        <p className="text-ink-soft">No articles in this category yet.</p>
      ) : (
        <div className="card overflow-hidden">
          {data.articles.map((a) => (
            <ArticleRow key={a.id} article={a} catSlug={catSlug!} />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-sand-200 bg-ivory p-5 text-sm text-ink-soft">
        Still have questions?{' '}
        <Link to="/contact" className="link">Contact our team</Link> — we reply in 1–2 business days.
      </div>
    </InfoShell>
  );
}
