import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ImagePlus, Star, X } from 'lucide-react';
import { reviewsApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { ErrorState, Notice, Spinner } from '@/components/ui/Feedback';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { refreshCatalog } from '@/services/productService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import { cn } from '@/utils/cn';

const labels = ['Very Bad', 'Bad', 'Ok-Ok', 'Good', 'Very Good'];
const aspects = ['Color', 'Size', 'Fabric'];

function RatingRow({ value, onChange, color = 'text-brand-600' }: { value: number; onChange: (value: number) => void; color?: string }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button key={score} type="button" onClick={() => onChange(score)} className="flex min-w-0 flex-col items-center gap-1.5 py-1">
          <Star className={cn('h-9 w-9 sm:h-10 sm:w-10', score <= value ? color : 'text-ink-muted')} fill={score <= value ? 'currentColor' : 'none'} strokeWidth={1.5} aria-hidden />
          <span className="text-[10px] text-ink-soft sm:text-xs">{labels[score - 1]}</span>
        </button>
      ))}
    </div>
  );
}

export default function OrderFeedbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId = '' } = useParams();
  const [params] = useSearchParams();
  const user = useAuth((state) => state.user)!;
  const toast = useUi((state) => state.toast);
  const mine = useAsync(`reviews:mine:${user.id}:${productId}`, () => reviewsApi.fetchMyProductReview(productId));
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(Math.min(5, Math.max(0, Number(params.get('rating')) || 0)));
  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([]);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(t('product.writeTitle', { defaultValue: 'Add feedback' }));

  useEffect(() => {
    if (!mine.data?.review) return;
    setRating(mine.data.review.rating);
    setComment(mine.data.review.body ?? '');
  }, [mine.data?.review]);

  const pickPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 5 - photos.length);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => reviewsApi.uploadReviewPhoto(file)));
      setPhotos((current) => [...current, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.error'));
    } finally {
      setUploading(false);
    }
  };

  const next = () => {
    if (step === 1 && rating < 1) { setError(t('product.ratingRequired')); return; }
    setError(null);
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async () => {
    if (rating < 1) return setStep(1);
    setBusy(true);
    setError(null);
    try {
      const aspectText = Object.entries(aspectRatings).filter(([, value]) => value > 0).map(([name, value]) => `${name}: ${value}/5`).join(' · ');
      const body = [comment.trim(), aspectText].filter(Boolean).join('\n\n');
      const input = { rating, title: '', body, photos: photos.map((photo) => photo.id) };
      if (mine.data?.review) await reviewsApi.updateReview(mine.data.review.id, input);
      else await reviewsApi.createReview(productId, input);
      invalidateQueries('reviews:');
      invalidateQueries('catalog:');
      refreshCatalog();
      toast(mine.data?.review ? t('product.updated') : t('product.posted'), 'success');
      navigate(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.error'));
    } finally {
      setBusy(false);
    }
  };

  if (mine.isLoading) return <Spinner />;
  if (mine.isError) return <ErrorState onRetry={mine.reload} />;
  if (!mine.data?.eligible && !mine.data?.review) return <Notice tone="info">{t('product.notEligible')}</Notice>;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white md:rounded-2xl md:border md:border-sand-200">
      <div className="z-10 grid shrink-0 grid-cols-3 border-b border-sand-200 bg-white px-5 py-3">
        {['Rating', 'Photos & Videos', 'Comment'].map((label, index) => {
          const number = index + 1;
          return <div key={label} className="relative flex flex-col items-center text-center text-xs text-ink-muted"><span className={cn('z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-white', number <= step && 'border-brand-600 text-brand-700')}>{number < step ? <Check className="h-3 w-3" /> : number}</span><span className="mt-1">{label}</span>{index < 2 && <span className={cn('absolute left-1/2 top-2.5 h-px w-full bg-sand-300', number < step && 'bg-brand-600')} />}</div>;
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        {error && <Notice tone="error" className="mb-4">{error}</Notice>}
        {step === 1 && <div className="space-y-7"><div><RatingRow value={rating} onChange={setRating} color={rating >= 4 ? 'text-emerald-600' : 'text-red-600'} /><p className="mt-4 text-sm text-ink-soft">{rating >= 4 ? 'We are glad you liked the product!' : rating ? 'Please let us know what we can improve!' : 'How was the product?'}</p></div><div><h2 className="mb-4 text-lg font-semibold">Tell us more about the Product</h2>{aspects.map((aspect) => <div key={aspect} className="mb-6"><h3 className="mb-2 text-lg font-semibold">{aspect}</h3><RatingRow value={aspectRatings[aspect] ?? 0} onChange={(value) => setAspectRatings((current) => ({ ...current, [aspect]: value }))} color={(aspectRatings[aspect] ?? 0) >= 4 ? 'text-emerald-600' : 'text-red-600'} /></div>)}</div></div>}
        {step === 2 && <div><h2 className="text-xl font-semibold">Add Photos and Videos</h2><p className="mt-2 text-sm text-ink-muted">Show us what your product looks like</p><div className="mt-6 grid grid-cols-3 gap-3">{photos.map((photo) => <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl"><img src={photo.url} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} aria-label={t('common.remove')} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-4 w-4" aria-hidden /></button></div>)}</div><label className="mt-6 flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white"><ImagePlus className="h-5 w-5" aria-hidden />{uploading ? t('common.loading') : 'Add Photos & Videos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={pickPhotos} disabled={uploading} /></label></div>}
        {step === 3 && <div><h2 className="text-xl font-semibold">Type Comment</h2><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={7} maxLength={2000} placeholder="Type Comment" className="mt-8 w-full resize-none border-0 border-b border-sand-300 bg-transparent px-1 py-3 text-base outline-none focus:border-brand-600" /></div>}
      </div>

      <div className="shrink-0 border-t border-sand-200 bg-white p-4 safe-bottom">
        <Button fullWidth onClick={step === 3 ? submit : next} loading={busy || uploading}>{step === 3 ? t('product.submit') : t('common.next', { defaultValue: 'Next' })}</Button>
        {step < 3 && <button type="button" onClick={() => step === 1 ? navigate(-1) : setStep((current) => current - 1)} className="mt-2 h-11 w-full rounded-lg border border-sand-300 text-sm font-semibold text-ink">{step === 1 ? t('common.cancel') : t('common.back', { defaultValue: 'Back' })}</button>}
      </div>
    </div>
  );
}
