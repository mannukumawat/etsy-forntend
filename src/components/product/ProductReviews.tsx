import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, ChevronDown, ImagePlus, Star, X } from 'lucide-react';
import { reviewsApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { TextareaField, TextField } from '@/components/ui/Form';
import { Rating } from '@/components/ui/Rating';
import { invalidateQueries, useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { refreshCatalog } from '@/services/productService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import type { OwnReview, Product, RatingDistribution, Review, ReviewSort } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';

const STARS = [5, 4, 3, 2, 1] as const;

function Distribution({ distribution, total, active, onPick }: { distribution: RatingDistribution; total: number; active: number | null; onPick: (stars: number | null) => void }) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{t('product.distribution')}</p>
      <ul className="space-y-1.5">
        {STARS.map((s) => {
          const count = distribution[String(s) as keyof RatingDistribution] ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={s}>
              <button
                type="button"
                disabled={count === 0}
                aria-pressed={active === s}
                aria-label={t('product.filterByStars', { stars: s, count })}
                onClick={() => onPick(active === s ? null : s)}
                className={cn('flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-sm enabled:hover:bg-sand-100 disabled:cursor-default', active === s && 'bg-sand-100 font-semibold')}
              >
                <span className="w-12 shrink-0 text-left text-ink-soft">{t('product.starsRow', { stars: s })}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200" aria-hidden>
                  <span className="block h-full rounded-full bg-star" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right text-ink-muted num">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StarPicker({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">
        {t('product.yourRating')} <span className="text-brand-700">*</span>
      </legend>
      <div className="flex gap-1" role="radiogroup" aria-invalid={error ? true : undefined} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t('product.starOption', { count: n })}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <Star className={cn('h-7 w-7', n <= shown ? 'text-star' : 'text-sand-300')} fill="currentColor" strokeWidth={0} aria-hidden />
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Photo upload strip — up to 5 photos, shown as thumbnails with remove buttons. */
function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (ids: string[]) => void }) {
  const { t } = useTranslation();
  const [previews, setPreviews] = useState<Array<{ id: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError(t('product.photoTypeError')); return; }
    if (file.size > 3 * 1024 * 1024) { setError(t('product.photoSizeError')); return; }
    setError(null);
    setUploading(true);
    try {
      const { id, url } = await reviewsApi.uploadReviewPhoto(file);
      const next = [...previews, { id, url }];
      setPreviews(next);
      onChange(next.map((p) => p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.error'));
    } finally {
      setUploading(false);
    }
  };

  const remove = (id: string) => {
    const next = previews.filter((p) => p.id !== id);
    setPreviews(next);
    onChange(next.map((p) => p.id));
  };

  // Sync external photos reset (when form resets)
  useEffect(() => {
    if (photos.length === 0) setPreviews([]);
  }, [photos.length]);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{t('product.addPhotos')}</p>
      <div className="flex flex-wrap gap-2">
        {previews.map((p) => (
          <div key={p.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-sand-200">
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              aria-label={t('product.removePhoto')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {previews.length < 5 && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-sand-300 text-ink-muted hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
            <span className="text-[10px]">{uploading ? '…' : t('product.addPhoto')}</span>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-700" role="alert">{error}</p>}
      <p className="mt-1 text-xs text-ink-muted">{t('product.photoHint')}</p>
    </div>
  );
}

/** The signed-in customer's write/edit/delete panel. Every state comes from the server. */
function MyReview({ product, onChanged, autoOpen }: { product: Product; onChanged: () => void; autoOpen: boolean }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const toast = useUi((s) => s.toast);
  const mine = useAsync(user ? `reviews:mine:${user.id}:${product.id}` : null, () => reviewsApi.fetchMyProductReview(product.id));
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const existing: OwnReview | null = mine.data?.review ?? null;

  useEffect(() => {
    if (autoOpen && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [autoOpen, mine.data]);

  if (!user) {
    return (
      <Notice tone="info" title={t('product.signInToReview')}>
        <p>{t('product.signInBody')}</p>
        <Link to={`/login?redirect=${encodeURIComponent(location.pathname + '?review=1')}`} className="link mt-1 inline-block">
          {t('auth.submitLogin')}
        </Link>
      </Notice>
    );
  }
  if (mine.isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (mine.isError) return <ErrorState onRetry={mine.reload} />;

  const startEdit = (r: OwnReview | null) => {
    setRating(r?.rating ?? 0);
    setTitle(r?.title ?? '');
    setBody(r?.body ?? '');
    setPhotos(r?.photos ?? []);
    setFieldErrors({});
    setFormError(null);
    setEditing(true);
  };

  const afterChange = (message: string) => {
    toast(message, 'success');
    setEditing(false);
    setPhotos([]);
    mine.reload();
    onChanged();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setFieldErrors({ rating: t('product.ratingRequired') });
      return;
    }
    setBusy(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const input = { rating, title: title.trim(), body: body.trim(), photos };
      if (existing) {
        await reviewsApi.updateReview(existing.id, input);
        afterChange(t('product.updated'));
      } else {
        await reviewsApi.createReview(product.id, input);
        afterChange(t('product.posted'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'already_reviewed') {
          setFormError(t('product.alreadyReviewed'));
          mine.reload();
        } else if (err.code === 'not_eligible') {
          setFormError(t('product.notEligible'));
        } else if (Array.isArray(err.details) && err.details.length) {
          const issues = err.details as Array<{ path: string; message: string }>;
          setFieldErrors(Object.fromEntries(issues.map((i) => [i.path, i.message])));
          setFormError(err.message);
        } else setFormError(err.message || t('toast.error'));
      } else setFormError(t('toast.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existing || !window.confirm(t('product.deleteConfirm'))) return;
    setBusy(true);
    try {
      await reviewsApi.deleteReview(existing.id);
      afterChange(t('product.deleted'));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('toast.error'));
    } finally {
      setBusy(false);
    }
  };

  if (!existing && !mine.data?.eligible) {
    return <Notice tone="info">{t('product.notEligible')}</Notice>;
  }

  if (!editing) {
    if (!existing) {
      return (
        <div ref={panelRef}>
          <Button onClick={() => startEdit(null)}>{t('product.reviewThis')}</Button>
        </div>
      );
    }
    return (
      <div ref={panelRef} className="rounded-xl border border-sand-200 bg-white p-4">
        <p className="text-sm font-semibold text-ink">{t('product.editTitle')}</p>
        {existing.status === 'hidden' && (
          <Notice tone="warning" className="mt-2">
            {t('product.hiddenNote')}
          </Notice>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Rating value={existing.rating} />
          <span className="text-xs text-ink-muted">{formatDate(existing.createdAt, lang)}</span>
        </div>
        {existing.title && <p className="mt-1 font-semibold text-ink">{existing.title}</p>}
        {existing.body && <p className="mt-1 whitespace-pre-line text-ink-soft">{existing.body}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => startEdit(existing)} disabled={busy}>
            {t('product.edit')}
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
            {t('product.delete')}
          </Button>
        </div>
        {formError && (
          <Notice tone="error" role="alert" className="mt-3">
            {formError}
          </Notice>
        )}
      </div>
    );
  }

  return (
    <form ref={panelRef as unknown as React.RefObject<HTMLFormElement>} onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-sand-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink">{existing ? t('product.editTitle') : t('product.writeTitle')}</p>
      {existing?.status === 'hidden' && <Notice tone="warning">{t('product.hiddenNote')}</Notice>}
      {formError && (
        <Notice tone="error" role="alert">
          {formError}
        </Notice>
      )}
      <StarPicker value={rating} onChange={(v) => { setRating(v); setFieldErrors((f) => ({ ...f, rating: '' })); }} error={fieldErrors.rating || undefined} />
      <TextField id="review-title" label={t('product.titleLabel')} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} error={fieldErrors.title} />
      <TextareaField id="review-body" label={t('product.bodyLabel')} maxLength={2000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} error={fieldErrors.body} hint={`${body.length}/2000`} />
      <PhotoUploader photos={photos} onChange={setPhotos} />
      <div className="flex gap-2">
        <Button type="submit" loading={busy}>
          {busy ? (existing ? t('product.saving') : t('product.submitting')) : existing ? t('product.save') : t('product.submit')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
          {t('product.cancel')}
        </Button>
      </div>
    </form>
  );
}

/** Initial-circle "avatar" — derived from the public display name only. */
export function Avatar({ name }: { name: string }) {
  const palette = ['bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-800', 'bg-rose-100 text-rose-800', 'bg-violet-100 text-violet-800'];
  const tone = palette[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length];
  return (
    <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', tone)} aria-hidden>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

/** One review row, Etsy-style: stars + number + "This item" on the left, author | date on the right. */
function ReviewRow({ review }: { review: Review }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Rating value={review.rating} size="md" />
          <span className="text-sm font-semibold text-ink num">{review.rating}</span>
          <span className="rounded-full border border-ink/60 px-2 py-0.5 text-[11px] font-medium text-ink">{t('product.thisItem')}</span>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <Avatar name={review.author} />
          <span className="font-semibold text-ink">{review.author}</span>
          <span className="text-sand-300" aria-hidden>
            |
          </span>
          <span className="text-ink-muted">
            {formatDate(review.date, lang)}
            {review.edited && ` · ${t('product.edited')}`}
          </span>
        </p>
      </div>
      {/* Customer text is rendered as plain React text nodes — never as HTML. */}
      {review.title && <p className="mt-2 font-semibold text-ink">{review.title}</p>}
      {review.body && <p className="mt-1 whitespace-pre-line break-words text-ink">{review.body}</p>}
      {(review.photos?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(review.photos ?? []).map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-sand-200 hover:opacity-90">
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {review.verifiedPurchase && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          {t('product.verified')}
        </p>
      )}
    </li>
  );
}

const PREVIEW = 4;
const FULL_PAGE = 10;

export function ProductReviews({ product, onChanged, autoOpenForm = false }: { product: Product; onChanged: () => void; autoOpenForm?: boolean }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [stars, setStars] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [all, setAll] = useState(false);
  const size = all ? FULL_PAGE : PREVIEW;
  const key = `reviews:list:${product.slug}:${sort}:${stars ?? 'all'}:${size}:${page}`;
  const list = useAsync(key, () => reviewsApi.fetchProductReviews(product.slug, { page, pageSize: size, sort, rating: stars }), { keepPrevious: true });
  const sectionRef = useRef<HTMLElement>(null);

  const summary = list.data?.summary ?? { average: product.rating, count: product.reviewCount, distribution: product.reviewDistribution };

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
            <p className="font-sans text-5xl font-semibold leading-none tracking-tight num">{summary.average.toFixed(1)}</p>
            <Star className="h-9 w-9 text-star" fill="currentColor" strokeWidth={0} aria-hidden />
            <div className="text-sm">
              <p className="font-medium text-ink underline decoration-dashed underline-offset-4">{t('product.itemAverage')}</p>
              <p className="text-ink-muted">{t('product.reviewsCount', { count: summary.count })}</p>
            </div>
          </div>
          <Distribution
            distribution={summary.distribution}
            total={summary.count}
            active={stars}
            onPick={(s) => {
              setStars(s);
              setPage(1);
            }}
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
                onChange={(e) => {
                  setSort(e.target.value as ReviewSort);
                  setPage(1);
                }}
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
                  onClick={() => {
                    setStars(null);
                    setPage(1);
                  }}
                >
                  {t('product.allRatings')}
                </button>
              </p>
            )}
          </div>

          {list.isError && !list.data ? (
            <ErrorState onRetry={list.reload} />
          ) : !list.data ? (
            <div className="mt-4 space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
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
              <span className="text-ink-muted">{t('product.pageOf', { page: list.data.page, pages: list.data.pageCount })}</span>
              <Button size="sm" variant="outline" disabled={page >= list.data.pageCount} onClick={() => setPage((p) => p + 1)}>
                {t('product.next')}
              </Button>
            </nav>
          )}

          {list.data && (all || list.data.total > PREVIEW) && (
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
