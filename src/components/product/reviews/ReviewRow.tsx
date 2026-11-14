import { useTranslation } from 'react-i18next';
import { BadgeCheck } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { useLanguage } from '@/hooks/useLocale';
import type { Review } from '@/types';
import { formatDate } from '@/utils/dates';
import { ReviewAvatar } from './ReviewAvatar';

/** One review row: stars + rating + verified badge, author | date, body, photos. */
export function ReviewRow({ review }: { review: Review }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Rating value={review.rating} size="md" />
          <span className="text-sm font-semibold text-ink num">{review.rating}</span>
          <span className="rounded-full border border-ink/60 px-2 py-0.5 text-[11px] font-medium text-ink">
            {t('product.thisItem')}
          </span>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <ReviewAvatar name={review.author} />
          <span className="font-semibold text-ink">{review.author}</span>
          <span className="text-sand-300" aria-hidden>|</span>
          <span className="text-ink-muted">
            {formatDate(review.date, lang)}
            {review.edited && ` · ${t('product.edited')}`}
          </span>
        </p>
      </div>
      {review.title && <p className="mt-2 font-semibold text-ink">{review.title}</p>}
      {review.body && <p className="mt-1 whitespace-pre-line break-words text-ink">{review.body}</p>}
      {(review.photos?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(review.photos ?? []).map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
              className="block h-20 w-20 overflow-hidden rounded-lg border border-sand-200 hover:opacity-90">
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
