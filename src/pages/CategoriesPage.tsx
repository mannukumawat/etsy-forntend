import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { Skeleton, ErrorState } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import { usePreferences } from '@/store/preferences';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const currency = usePreferences((s) => s.currency);
  const [search, setSearch] = useState('');

  useDocumentTitle(t('categories.title', { defaultValue: 'All Categories' }));

  const { data: categoriesWithCounts, isLoading: loadingCats, isError: catError, reload: reloadCats } = useAsync(
    'catalog:categories-with-counts',
    () => productService.getCategoriesWithCounts(),
  );

  const { data: allProductsData, isLoading: loadingProds } = useAsync(
    `catalog:all-for-categories:${currency}`,
    () => productService.list({ currency, sort: 'featured', pageSize: 200 }),
  );

  const allProducts = allProductsData?.items ?? [];

  // Filter out internal '__on_sale__' item if present in getCategoriesWithCounts
  const cleanCategories = useMemo(() => {
    return (categoriesWithCounts ?? []).filter((c) => c.slug !== '__on_sale__');
  }, [categoriesWithCounts]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cleanCategories;
    return cleanCategories.filter((c) => {
      const name = loc(c.name).toLowerCase();
      const desc = loc(c.description).toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [cleanCategories, search, loc]);

  const crumbs = [
    { label: t('common.home', { defaultValue: 'Home' }), to: '/' },
    { label: t('nav.categories', { defaultValue: 'Categories' }) },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Top Header / Breadcrumbs */}
      <div className="container-site pt-4">
        <Breadcrumbs items={crumbs} />
      </div>

      {/* Hero Banner */}
      <section className="container-site pt-6 pb-10 text-center">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('nav.categories', { defaultValue: 'Categories' })}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {t('categories.title', { defaultValue: 'All Categories' })}
          </h1>
          <p className="mt-3 text-base text-ink-muted sm:text-lg">
            {t('categories.subtitle', {
              defaultValue: 'Explore our handcrafted collections thoughtfully made for your everyday.',
            })}
          </p>

          {/* Quick Search inside categories */}
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('categories.searchPlaceholder', { defaultValue: 'Search categories...' })}
              className="w-full rounded-full border border-sand-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder-ink-muted/70 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </section>

      {/* Main Categories Grid */}
      <div className="container-site">
        {catError ? (
          <ErrorState onRetry={reloadCats} />
        ) : loadingCats || loadingProds ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="mt-4 h-6 w-3/4 rounded" />
                <Skeleton className="mt-2 h-4 w-1/2 rounded" />
                <div className="mt-5 flex gap-2">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <Skeleton className="h-14 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-sand-200 bg-white py-16 text-center shadow-sm">
            <p className="text-base font-medium text-ink">
              {t('categories.noCategories', { defaultValue: 'No categories found' })}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 text-sm font-semibold text-brand-700 hover:underline"
              >
                {t('common.clearAll', { defaultValue: 'Clear search' })}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => {
              const categoryProducts = allProducts.filter((p) => p.categoryId === category.id || p.categoryId === category.slug);
              const previewProducts = categoryProducts.slice(0, 3);
              const coverImage = category.image?.src || categoryProducts[0]?.images[0]?.src || '/placeholder.jpg';
              const productCount = category.count ?? categoryProducts.length;

              return (
                <div
                  key={category.slug}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                >
                  <div>
                    {/* Visual Cover Banner / Image */}
                    <Link
                      to={`/category/${category.slug}`}
                      className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-sand-100"
                    >
                      <img
                        src={coverImage}
                        alt={category.image?.alt ? loc(category.image.alt) : loc(category.name)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur">
                        {productCount === 1
                          ? t('categories.productsCount_one', { count: productCount, defaultValue: '1 Product' })
                          : t('categories.productsCount_other', { count: productCount, defaultValue: `${productCount} Products` })}
                      </span>
                    </Link>

                    {/* Category Title & Description */}
                    <div className="mt-4">
                      <h2 className="font-serif text-xl font-bold text-ink transition-colors group-hover:text-brand-700">
                        <Link to={`/category/${category.slug}`}>{loc(category.name)}</Link>
                      </h2>
                      {category.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">
                          {loc(category.description)}
                        </p>
                      )}
                    </div>

                    {/* Preview Products Thumbnails */}
                    {previewProducts.length > 0 && (
                      <div className="mt-4 border-t border-sand-100 pt-3">
                        <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                          {t('hub.ourPicks', { defaultValue: 'Popular in this category' })}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {previewProducts.map((p) => (
                            <Link
                              key={p.id}
                              to={`/product/${p.slug}`}
                              className="group/item relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-sand-200 bg-sand-50"
                              title={loc(p.name)}
                            >
                              {p.images[0]?.src ? (
                                <img
                                  src={p.images[0].src}
                                  alt={loc(p.name)}
                                  className="h-full w-full object-cover transition-transform group-hover/item:scale-110"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">
                                  —
                                </div>
                              )}
                            </Link>
                          ))}
                          {categoryProducts.length > 3 && (
                            <Link
                              to={`/category/${category.slug}`}
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-sand-300 text-xs font-semibold text-ink-muted hover:border-brand-500 hover:text-brand-700"
                            >
                              +{categoryProducts.length - 3}
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Link Button */}
                  <div className="mt-5 border-t border-sand-100 pt-4">
                    <Link
                      to={`/category/${category.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sand-100 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-600 hover:text-white"
                    >
                      <span>{t('categories.explore', { defaultValue: 'Explore Collection' })}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
