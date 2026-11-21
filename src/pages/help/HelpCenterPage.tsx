import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Mail,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { CustomerCareShell } from '@/components/layout/CustomerCareShell';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { helpService, type HelpArticle, type HelpCategory } from '@/services/miscService';

const ICONS: Record<string, LucideIcon> = {
  'help-circle': HelpCircle,
  package: Package,
  truck: Truck,
  'credit-card': CreditCard,
  'refresh-cw': RefreshCw,
  settings: Settings,
  'shopping-bag': ShoppingBag,
  star: Star,
  mail: Mail,
};

function CategoryCard({ category }: { category: HelpCategory }) {
  const loc = useLocalized();
  const Icon = ICONS[category.icon] ?? HelpCircle;
  const description = loc(category.description);

  return (
    <Link
      to={`/help/${category.slug}`}
      className="card group flex items-start gap-4 p-5 transition-shadow hover:shadow-lift"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="font-semibold text-ink group-hover:text-brand-700">{loc(category.name)}</p>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </div>
    </Link>
  );
}

export default function HelpCenterPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { data, isLoading, isError, reload } = useAsync('help:center', async () => {
    const { items } = await helpService.getCategories();
    const details = await Promise.all(items.map((category) => helpService.getCategory(category.slug)));
    return {
      categories: items,
      articles: details.flatMap((detail) => detail.articles),
    };
  });
  const categories = data?.categories ?? [];
  const articles: HelpArticle[] = data?.articles ?? [];

  return (
    <CustomerCareShell title={t('help.helpTitle')} isRoot>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading help categories">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-sand-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-sand-200 bg-white px-6 py-10 text-center">
          <p className="text-ink-soft">Help Center could not be loaded.</p>
          <button type="button" onClick={reload} className="mt-3 text-sm font-medium text-brand-700 hover:text-brand-800">
            Try again
          </button>
        </div>
      ) : categories.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
          </div>

          {articles.length > 0 && (
            <div className="mt-10">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
                <HelpCircle className="h-5 w-5 text-brand-600" aria-hidden />
                Popular questions
              </h2>
              <div className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
                {articles.map((article) => (
                  <details key={article.id} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink">
                      <span className="font-sans text-[15px] font-medium">{loc(article.title)}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="whitespace-pre-wrap pb-4 text-sm leading-relaxed text-ink-soft">{loc(article.body)}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-sand-200 bg-white px-6 py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-ink-muted" aria-hidden />
          <p className="mt-3 text-sm text-ink-soft">No help content is available yet.</p>
        </div>
      )}
    </CustomerCareShell>
  );
}
