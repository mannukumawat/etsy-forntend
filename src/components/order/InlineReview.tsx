import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, ImagePlus, Pencil, Star, Trash2, X } from 'lucide-react';
import { reviewsApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { Notice, Skeleton } from '@/components/ui/Feedback';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { refreshCatalog } from '@/services/productService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          <Star className={cn('h-6 w-6', n <= shown ? 'text-star' : 'text-sand-300')} fill="currentColor" strokeWidth={0} aria-hidden />
        </button>
      ))}
    </div>
  );
}

function MiniPhotoUploader({ onChange }: { photos: string[]; onChange: (ids: string[]) => void }) {
  const { t } = useTranslation();
  const [previews, setPreviews] = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setErr(t('product.photoTypeError')); return; }
    if (file.size > 3 * 1024 * 1024) { setErr(t('product.photoSizeError')); return; }
    setErr(null);
    setUploading(true);
    try {
      const { id, url } = await reviewsApi.uploadReviewPhoto(file);
      const next = [...previews, { id, url }];
      setPreviews(next);
      onChange(next.map((p) => p.id));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t('toast.error'));
    } finally {
      setUploading(false);
    }
  };

  const remove = (id: string) => {
    const next = previews.filter((p) => p.id !== id);
    setPreviews(next);
    onChange(next.map((p) => p.id));
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {previews.map((p) => (
        <div key={p.id} className="relative h-14 w-14 overflow-hidden rounded-md border border-sand-200">
          <img src={p.url} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => remove(p.id)} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white" aria-label={t('product.removePhoto')}>
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
      {previews.length < 5 && (
        <label className={cn('flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed border-sand-300 text-ink-muted hover:border-brand-400 hover:text-brand-600', uploading && 'opacity-50 pointer-events-none')}>
          <ImagePlus className="h-4 w-4" />
          <span className="text-[9px]">{uploading ? '…' : t('product.addPhoto')}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} />
        </label>
      )}
      {err && <p className="w-full text-xs text-red-600">{err}</p>}
    </div>
  );
}

/** Inline review widget for the order detail page — no page navigation needed. */
export function InlineReview({ productId, productName }: { productId: string; productName: string }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const user = useAuth((s) => s.user);
  const toast = useUi((s) => s.toast);
  const mine = useAsync(user ? `reviews:mine:${user.id}:${productId}` : null, () => reviewsApi.fetchMyProductReview(productId));

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user || mine.isLoading) return mine.isLoading ? <Skeleton className="mt-2 h-8 w-40 rounded-lg" /> : null;
  if (mine.isError) return null;

  const existing = mine.data?.review ?? null;
  const eligible = mine.data?.eligible ?? false;

  const startEdit = () => {
    setRating(existing?.rating ?? 0);
    setBody(existing?.body ?? '');
    setPhotos([]);
    setErr(null);
    setOpen(true);
  };

  const reset = () => { setOpen(false); setRating(0); setBody(''); setPhotos([]); setErr(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { setErr(t('product.ratingRequired')); return; }
    setBusy(true);
    setErr(null);
    try {
      const input = { rating, title: '', body: body.trim(), photos };
      if (existing) {
        await reviewsApi.updateReview(existing.id, input);
        toast(t('product.updated'), 'success');
      } else {
        await reviewsApi.createReview(productId, input);
        toast(t('product.posted'), 'success');
      }
      reset();
      mine.reload();
      invalidateQueries('reviews:list:');
      invalidateQueries('reviews:store');
      invalidateQueries('catalog:');
      refreshCatalog();
    } catch (e2) {
      if (e2 instanceof ApiError) setErr(e2.message);
      else setErr(t('toast.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existing || !window.confirm(t('product.deleteConfirm'))) return;
    setBusy(true);
    try {
      await reviewsApi.deleteReview(existing.id);
      toast(t('product.deleted'), 'success');
      mine.reload();
      invalidateQueries('reviews:list:');
      invalidateQueries('reviews:store');
      refreshCatalog();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : t('toast.error'));
    } finally {
      setBusy(false);
    }
  };

  // Show existing review summary (not editing)
  if (existing && !open) {
    return (
      <div className="mt-2 rounded-xl border border-sand-200 bg-sand-50 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((n) => (
                <Star key={n} className={cn('h-4 w-4', n <= existing.rating ? 'text-star' : 'text-sand-200')} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className="text-xs text-ink-muted">{formatDate(existing.createdAt, lang)}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3 w-3" /> {t('product.verified')}
            </span>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={startEdit} className="rounded p-1 text-ink-muted hover:text-ink" aria-label={t('product.edit')}><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={remove} disabled={busy} className="rounded p-1 text-ink-muted hover:text-red-600" aria-label={t('product.delete')}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {existing.body && <p className="mt-1 text-xs text-ink-soft line-clamp-2">{existing.body}</p>}
      </div>
    );
  }

  // Not eligible and no review
  if (!eligible && !existing) return null;

  // Write / edit form
  if (open) {
    return (
      <form onSubmit={submit} className="mt-2 space-y-2 rounded-xl border border-sand-200 bg-sand-50 p-3 text-sm">
        <p className="text-xs font-semibold text-ink">{existing ? t('product.editTitle') : t('product.writeTitle')}: <span className="font-normal text-ink-soft">{productName}</span></p>
        {err && <Notice tone="error" role="alert" className="text-xs">{err}</Notice>}
        <StarPicker value={rating} onChange={setRating} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('product.bodyLabel')}
          maxLength={2000}
          rows={3}
          className="w-full resize-none rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline focus:outline-2 focus:outline-brand-600"
        />
        <MiniPhotoUploader photos={photos} onChange={setPhotos} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={busy}>
            {existing ? t('product.save') : t('product.submit')}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={busy}>
            {t('product.cancel')}
          </Button>
        </div>
      </form>
    );
  }

  // Eligible, no review yet — show button
  return (
    <button
      type="button"
      onClick={startEdit}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink hover:bg-sand-100"
    >
      <Star className="h-3.5 w-3.5 text-star" fill="currentColor" strokeWidth={0} />
      {t('product.reviewThis')}
    </button>
  );
}
