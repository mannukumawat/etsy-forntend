import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { HeroSlider, type HeroSlide } from '@/components/layout/HeroSlider';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { AvailabilityOptions, CategoryOptions, FilterDropdown, FilterPanel, PriceForm } from '@/components/shop/FilterPanel';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Dialog';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { SelectField } from '@/components/ui/Form';
import { Breadcrumbs, Pagination } from '@/components/ui/Navigation';
import { CATEGORY_BY_SLUG, isCategorySlug } from '@/data/categories';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { fetchItemGroups } from '@/api';
import { productService } from '@/services/productService';
import { usePreferences } from '@/store/preferences';
import type { AvailabilityFilter, CategorySlug, SortOption } from '@/types';
import { formatMoney } from '@/utils/money';
import { activeFilterCount, parseShopState, shopUrl, type ShopState } from '@/utils/shopParams';
import NotFoundPage from './NotFoundPage';

export default function ShopPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const currency = usePreferences((s) => s.currency);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(() => parseShopState(params, slug), [params, slug]);
  const category = slug && isCategorySlug(slug) ? CATEGORY_BY_SLUG[slug] : undefined;

  const { data: itemGroups } = useAsync('nav:item-groups', () => fetchItemGroups());
  const activeGroup = state.group ? itemGroups?.find((g) => g.slug === state.group) : undefined;

  const queryKey = `catalog:list:${currency}:${JSON.stringify(state)}`;
  const { data, isLoading, isError, reload } = useAsync(
    slug && !category ? null : queryKey,
    () =>
      productService.list({
        q: state.q,
        categories: state.categories,
        minPrice: state.min,
        maxPrice: state.max,
        currency,
        minRating: state.rating,
        availability: state.availability,
        onSale: state.onSale,
        itemGroupSlug: state.group,
        sort: state.sort,
        page: state.page,
      }),
    { keepPrevious: true },
  );

  const title = state.q
    ? t('shop.searchTitle', { q: state.q })
    : activeGroup
      ? activeGroup.nameEn
      : category
        ? loc(category.name)
        : t('shop.title');
  useDocumentTitle(title);

  if (slug && !category) return <NotFoundPage />;

  const update = (patch: Partial<ShopState>) => {
    navigate(shopUrl({ ...state, page: 1, ...patch }), { preventScrollReset: true });
  };
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const fmtMajor = (n: number) => formatMoney(Math.round(n * 100), currency, lang);
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (state.q) chips.push({ key: 'q', label: t('shop.queryChip', { q: state.q }), onRemove: () => update({ q: '' }) });
  state.categories.forEach((c) => chips.push({ key: `c-${c}`, label: loc(CATEGORY_BY_SLUG[c].name), onRemove: () => update({ categories: state.categories.filter((x) => x !== c) }) }));
  if (state.min !== undefined || state.max !== undefined) {
    const label =
      state.min !== undefined && state.max !== undefined
        ? t('shop.priceChip', { min: fmtMajor(state.min), max: fmtMajor(state.max) })
        : state.min !== undefined
          ? t('shop.priceMinChip', { min: fmtMajor(state.min) })
          : t('shop.priceMaxChip', { max: fmtMajor(state.max!) });
    chips.push({ key: 'price', label, onRemove: () => update({ min: undefined, max: undefined }) });
  }
  if (state.rating) chips.push({ key: 'rating', label: t('shop.ratingChip', { rating: state.rating }), onRemove: () => update({ rating: undefined }) });
  state.availability.forEach((a) => chips.push({ key: a, label: t(a === 'in_stock' ? 'shop.inStock' : 'shop.outOfStock'), onRemove: () => update({ availability: state.availability.filter((x) => x !== a) }) }));
  if (state.onSale) chips.push({ key: 'onSale', label: 'On sale', onRemove: () => update({ onSale: undefined }) });

  const clearAll = () => navigate(shopUrl({ q: '', categories: [], availability: [], sort: state.sort, page: 1 }), { preventScrollReset: true });
  const filterCount = activeFilterCount(state, true);

  const onToggleCategory = (c: CategorySlug) => update({ categories: toggle(state.categories, c) });
  const onPrice = (min?: number, max?: number) => update({ min, max });
  const onToggleAvailability = (a: AvailabilityFilter) => update({ availability: toggle(state.availability, a) });

  const panel = (
    <FilterPanel
      state={state}
      facets={data?.facets}
      currency={currency}
      onToggleCategory={onToggleCategory}
      onPrice={onPrice}
      onToggleAvailability={onToggleAvailability}
      hideCategory={!!activeGroup}
    />
  );

  const total = data?.total ?? 0;

  const contextSlides: HeroSlide[] =
    (activeGroup || category) && data
      ? data.items
          .filter((p) => p.images[0]?.src)
          .slice(0, 5)
          .map((p) => ({ image: p.images[0].src }))
      : [];

  const crumbs = [
    { label: t('common.home'), to: '/' },
    ...(category || activeGroup ? [{ label: t('nav.shop'), to: '/shop' }] : []),
    { label: category ? loc(category.name) : activeGroup ? activeGroup.nameEn : t('nav.shop') },
  ];
  const description = category ? loc(category.description) : activeGroup ? '' : t('shop.subtitle');

  return (
    <div>
      {contextSlides.length > 0 ? (
        <div className="container-site pt-3">
          <HeroSlider
            key={state.group ?? slug}
            slides={contextSlides}
            autoplayMs={4500}
            compact
            overlay={
              <>
                <Breadcrumbs items={crumbs} tone="light" />
                <h1 className="mt-3 font-serif text-4xl font-semibold text-white drop-shadow-sm lg:text-6xl">{title}</h1>
                {description && <p className="mt-3 max-w-md text-base text-white/85 line-clamp-2">{description}</p>}
              </>
            }
          />
        </div>
      ) : (
        <div className="container-site pt-5 lg:pt-6">
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-2 text-3xl lg:text-4xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{description}</p>}
        </div>
      )}

      <div className="container-site mt-8">
        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-heading" className="font-sans text-sm font-medium text-ink-soft" aria-live="polite">
              {data ? t('shop.results', { count: total }) : t('common.loading')}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)} icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />} aria-haspopup="dialog">
                {filterCount ? t('shop.filtersCount', { count: filterCount }) : t('shop.filters')}
              </Button>
              <div className="hidden items-center gap-2 lg:flex">
                {!activeGroup && (
                  <FilterDropdown label={t('shop.category')} activeCount={state.categories.length}>
                    <div className="max-h-72 overflow-y-auto">
                      <CategoryOptions state={state} facets={data?.facets} onToggleCategory={onToggleCategory} />
                    </div>
                  </FilterDropdown>
                )}
                <FilterDropdown label={t('shop.price', { currency })} activeCount={state.min !== undefined || state.max !== undefined ? 1 : 0}>
                  {(close) => <PriceForm state={state} currency={currency} onPrice={onPrice} onDone={close} />}
                </FilterDropdown>
                <FilterDropdown label={t('shop.availability')} activeCount={state.availability.length}>
                  <AvailabilityOptions state={state} facets={data?.facets} onToggleAvailability={onToggleAvailability} />
                </FilterDropdown>
                <span className="mx-1 h-6 w-px bg-sand-200" aria-hidden />
              </div>
              <SelectField
                label={t('shop.sortBy')}
                value={state.sort}
                onChange={(e) => update({ sort: e.target.value as SortOption })}
                containerClassName="flex items-center gap-2 [&_.label]:mb-0 [&_.label]:whitespace-nowrap [&_.label_span]:hidden"
                className="h-9 w-44 py-1.5 text-sm"
              >
                {(['featured', 'price_asc', 'price_desc', 'newest'] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`shop.sort.${s}`)}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={t('shop.activeFilters')} role="group">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-white py-1 pl-3 pr-2 text-sm text-ink hover:border-ink"
                  aria-label={t('shop.removeFilter', { label: chip.label })}
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="px-2 text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800">
                {t('common.clearAll')}
              </button>
            </div>
          )}

          <div className="mt-6" aria-busy={isLoading}>
            {isError && !data ? (
              <ErrorState body={t('shop.loadError')} onRetry={reload} />
            ) : !data ? (
              <ProductGridSkeleton count={9} columns={3} />
            ) : data.items.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-7 w-7" aria-hidden />}
                title={t('shop.noResultsTitle')}
                body={
                  <>
                    {state.q && <span className="block">{t('shop.noResultsQuery', { q: state.q })}</span>}
                    {t('shop.noResultsBody')}
                  </>
                }
                actions={
                  <Button variant="outline" onClick={clearAll}>
                    {t('common.clearAll')}
                  </Button>
                }
              />
            ) : (
              <div className={isLoading ? 'opacity-60 transition-opacity' : undefined}>
                <ProductGrid products={data.items} columns={3} eagerCount={3} />
                <Pagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => shopUrl({ ...state, page: p })} />
              </div>
            )}
          </div>
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('shop.filters')}
        side="left"
        footer={
          <div className="flex gap-2">
            {filterCount > 0 && (
              <Button variant="ghost" onClick={clearAll}>
                {t('common.clearAll')}
              </Button>
            )}
            <Button fullWidth onClick={() => setFiltersOpen(false)}>
              {t('shop.showResults', { count: total })}
            </Button>
          </div>
        }
      >
        {panel}
      </Drawer>
    </div>
  );
}
