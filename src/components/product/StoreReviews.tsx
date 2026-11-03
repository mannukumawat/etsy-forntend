import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageCircle, Star } from 'lucide-react';
import { reviewsApi } from '@/api';
import logoMark from '@/assets/logo-mark.png';
import { Skeleton } from '@/components/ui/Feedback';
import { Rating } from '@/components/ui/Rating';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { useSiteSettings } from '@/store/siteSettings';
import { formatDate } from '@/utils/dates';
import { Avatar } from './ProductReviews';

/** Shop card + "All reviews from this shop" — published reviews across every visible product. */
export function StoreReviews() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const store = useSiteSettings((s) => s.store);
  const [expanded, setExpanded] = useState(false);
  const size = expanded ? 24 : 8;
  const data = useAsync(`reviews:store:${size}`, () => reviewsApi.fetchStoreReviews({ pageSize: size }), { keepPrevious: true });
  const track = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  const summary = data.data?.summary;

  return (
    <section aria-labelledby="shop-reviews-title" className="overflow-hidden rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-ivory-50 p-1.5">
            <img src={logoMark} alt="" className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="font-serif text-2xl font-semibold leading-tight">{store.name}</p>
            {summary && summary.count > 0 ? (
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-ink">
                <Star className="h-4 w-4 text-ink" fill="currentColor" strokeWidth={0} aria-hidden />
                {t('product.shopRating', { rating: summary.average.toFixed(1), count: summary.count })}
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">{loc(store.tagline)}</p>
            )}
          </div>
        </div>
        <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-white">
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t('product.contactShop')}
        </Link>
      </div>

      <div className="mt-6 border-t border-sand-200 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="shop-reviews-title" className="font-sans text-xl font-semibold">
            {t('product.shopReviewsTitle', { count: summary?.count ?? 0 })}
          </h2>
          {summary && summary.count > 8 && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="rounded-full border border-ink px-4 py-1.5 text-sm font-semibold hover:bg-ink hover:text-white">
              {expanded ? t('product.shopShowLess') : t('product.shopShowAll')}
            </button>
          )}
        </div>

        {!data.data ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
        ) : data.data.items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">{t('product.shopNoReviews')}</p>
        ) : (
          <div className="relative mt-4">
            <ul
              ref={track}
              className={expanded ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]'}
            >
              {data.data.items.map((r) => (
                <li key={r.id} className={expanded ? '' : 'w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]'}>
                  <article className="flex h-full flex-col rounded-xl border border-sand-200 p-4">
                    <Rating value={r.rating} size="md" />
                    {r.title && <p className="mt-2 line-clamp-1 font-semibold text-ink">{r.title}</p>}
                    {r.body && <p className="mt-1 line-clamp-4 break-words text-sm text-ink">{r.body}</p>}
                    <Link to={`/product/${r.product.slug}`} className="mt-3 flex items-center gap-2 text-xs text-ink-muted hover:text-ink">
                      {r.product.image && <img src={r.product.image} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />}
                      <span className="line-clamp-1 underline-offset-2 hover:underline">{loc(r.product.name)}</span>
                    </Link>
                    <p className="mt-auto flex items-center gap-2 pt-3 text-sm">
                      <Avatar name={r.author} />
                      <span className="font-semibold text-ink">{r.author}</span>
                      <span className="text-sand-300" aria-hidden>
                        |
                      </span>
                      <span className="text-ink-muted">{formatDate(r.date, lang)}</span>
                    </p>
                  </article>
                </li>
              ))}
            </ul>
            {!expanded && data.data.items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t('product.prevReviews')}
                  onClick={() => scroll(-1)}
                  className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lift sm:flex"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={t('product.nextReviews')}
                  onClick={() => scroll(1)}
                  className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lift sm:flex"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
