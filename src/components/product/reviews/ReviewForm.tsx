import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Star, X } from 'lucide-react';
import { reviewsApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { TextareaField, TextField } from '@/components/ui/Form';
import { Rating } from '@/components/ui/Rating';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import type { OwnReview, Product } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';
import { PHOTO_ALLOWED_TYPES, PHOTO_MAX_BYTES, PHOTO_MAX_COUNT } from './review.constants';

function StarPicker({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">
        {t('product.yourRating')} <span className="text-brand-700">*</span>
      </legend>
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-invalid={error ? true : undefined}
        onMouseLeave={() => setHover(0)}
      >
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
            <Star
              className={cn('h-7 w-7', n <= shown ? 'text-star' : 'text-sand-300')}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-700" role="alert">{error}</p>
      )}
    </fieldset>
  );
}

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
    if (!(PHOTO_ALLOWED_TYPES as readonly string[]).includes(file.type)) { setError(t('product.photoTypeError')); return; }
    if (file.size > PHOTO_MAX_BYTES) { setError(t('product.photoSizeError')); return; }
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
        {previews.length < PHOTO_MAX_COUNT && (
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

/** The signed-in customer's write/edit/delete review panel. */
export function MyReview({
  product,
  onChanged,
  autoOpen,
}: {
  product: Product;
  onChanged: () => void;
  autoOpen: boolean;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const toast = useUi((s) => s.toast);
  const mine = useAsync(
    user ? `reviews:mine:${user.id}:${product.id}` : null,
    () => reviewsApi.fetchMyProductReview(product.id),
  );
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
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname + '?review=1')}`}
          className="link mt-1 inline-block"
        >
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
        } else {
          setFormError(err.message || t('toast.error'));
        }
      } else {
        setFormError(t('toast.error'));
      }
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
          <Notice tone="warning" className="mt-2">{t('product.hiddenNote')}</Notice>
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
          <Notice tone="error" role="alert" className="mt-3">{formError}</Notice>
        )}
      </div>
    );
  }

  return (
    <form
      ref={panelRef as unknown as React.RefObject<HTMLFormElement>}
      onSubmit={submit}
      noValidate
      className="space-y-4 rounded-xl border border-sand-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-ink">{existing ? t('product.editTitle') : t('product.writeTitle')}</p>
      {existing?.status === 'hidden' && <Notice tone="warning">{t('product.hiddenNote')}</Notice>}
      {formError && <Notice tone="error" role="alert">{formError}</Notice>}
      <StarPicker
        value={rating}
        onChange={(v) => { setRating(v); setFieldErrors((f) => ({ ...f, rating: '' })); }}
        error={fieldErrors.rating || undefined}
      />
      <TextField
        id="review-title"
        label={t('product.titleLabel')}
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title}
      />
      <TextareaField
        id="review-body"
        label={t('product.bodyLabel')}
        maxLength={2000}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        error={fieldErrors.body}
        hint={`${body.length}/2000`}
      />
      <PhotoUploader photos={photos} onChange={setPhotos} />
      <div className="flex gap-2">
        <Button type="submit" loading={busy}>
          {busy
            ? existing ? t('product.saving') : t('product.submitting')
            : existing ? t('product.save') : t('product.submit')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
          {t('product.cancel')}
        </Button>
      </div>
    </form>
  );
}
