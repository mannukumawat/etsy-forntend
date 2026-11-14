import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Star } from 'lucide-react';
import { reviewsApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { invalidateQueries, useAsync } from '@/hooks/useAsync';
import { refreshCatalog } from '@/services/productService';
import type { Product, ReviewSort } from '@/types';
import { cn } from '@/utils/cn';
import { FULL_PAGE_SIZE, PREVIEW_PAGE_SIZE } from './review.constants';
import { RatingDistribution } from './RatingDistribution';
import { ReviewRow } from './ReviewRow';
import { MyReview } from './ReviewForm';

export function ProductReviews({
  product,
  onChanged,
  autoOpenForm = false,
}: {
  product: Product;
  onChanged: () => void;
  autoOpenForm?: boolean;
}) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [stars, setStars] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [all, setAll] = useState(false);
  const size = all ? FULL_PAGE_SIZE : PREVIEW_PAGE_SIZE;
  const key = `reviews:list:${product.slug}:${sort}:${stars ?? 'all'}:${size}:${page}`;
  const list = useAsync(
    key,
    () => reviewsApi.fetchProductReviews(product.slug, { page, pageSize: size, sort, rating: stars }),
    { keepPrevious: true },
  );
  const sectionRef = useRef<HTMLElement>(null);

  const summary = list.data?.summary ?? {
    average: product.rating,
    count: product.reviewCount,
    distribution: product.reviewDistribution,
  };

  const changed = () => {
    invalidateQueries(`reviews:list:${product.slug}`);
    invalidateQueries('reviews:store');
    invalidateQueries('catalog:');
    refreshCatalog();
    list.reload();
    onChanged();
  };

  return (
    <section ref={sectionRef} id="reviews" aria-labelledby="reviews-title" className="scroll-mt-28">
      <h2 id="reviews-title" className="font-sans text-2xl font-semibold">
        {t('product.reviewsForItem')}
      </h2>

      {summary.count === 0 ? (
        <div className="mt-4">
          <p className="font-semibold text-ink">{t('product.noReviews')}</p>
          <p className="mt-1 text-sm text-ink-muted">{t('product.noReviewsBody')}</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 sm:grid-cols-[auto_minmax(0,320px)] sm:items-center sm:gap-12">
          <div className="flex items-center gap-3">
            <p className="font-sans text-5xl font-semibold leading-none tracking-tight num">
              {summary.average.toFixed(1)}
            </p>
            <Star className="h-9 w-9 text-star" fill="currentColor" strokeWidth={0} aria-hidden />
            <div className="text-sm">
              <p className="font-medium text-ink underline decoration-dashed underline-offset-4">
                {t('product.itemAverage')}
              </p>
              <p className="text-ink-muted">{t('product.reviewsCount', { count: summary.count })}</p>
            </div>
          </div>
          <RatingDistribution
            distribution={summary.distribution}
            total={summary.count}
            active={stars}
            onPick={(s) => { setStars(s); setPage(1); }}
          />
        </div>
      )}

      <div className="mt-6">
        <MyReview product={product} onChanged={changed} autoOpen={autoOpenForm} />
      </div>

      {summary.count > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative inline-flex items-center">
              <span className="sr-only">{t('product.sortLabel')}</span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as ReviewSort); setPage(1); }}
                className="appearance-none rounded-full bg-sand-100 py-2 pl-4 pr-9 text-sm font-semibold text-ink hover:bg-sand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <option value="newest">{t('product.sortNewest')}</option>
                <option value="highest">{t('product.sortHighest')}</option>
                <option value="lowest">{t('product.sortLowest')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4" aria-hidden />
            </label>
            {stars && (
              <p className="text-sm text-ink-muted" aria-live="polite">
                {t('product.showingFiltered', { stars })}
                <button
                  type="button"
                  className="link ml-2"
                  onClick={() => { setStars(null); setPage(1); }}
                >
                  {t('product.allRatings')}
                </button>
              </p>
            )}
          </div>

          {list.isError && !list.data ? (
            <ErrorState onRetry={list.reload} />
          ) : !list.data ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : list.data.items.length === 0 ? (
            <p className="mt-6 text-ink-muted">{t('product.noneForFilter', { stars })}</p>
          ) : (
            <ul className={cn('divide-y divide-sand-200', list.isLoading && 'opacity-60')}>
              {list.data.items.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </ul>
          )}

          {list.data && all && list.data.pageCount > 1 && (
            <nav className="mt-2 flex items-center justify-between text-sm" aria-label={t('product.reviewsForItem')}>
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('product.prev')}
              </Button>
              <span className="text-ink-muted">
                {t('product.pageOf', { page: list.data.page, pages: list.data.pageCount })}
              </span>
              <Button size="sm" variant="outline" disabled={page >= list.data.pageCount} onClick={() => setPage((p) => p + 1)}>
                {t('product.next')}
              </Button>
            </nav>
          )}

          {list.data && (all || list.data.total > PREVIEW_PAGE_SIZE) && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (all) sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  setAll((v) => !v);
                  setPage(1);
                }}
                className="rounded-full border border-ink px-8 py-2.5 text-sm font-semibold text-ink hover:bg-ink hover:text-white"
              >
                {all ? t('product.showFewer') : t('product.viewAllReviews')}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
