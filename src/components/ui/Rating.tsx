import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Star rating with fractional fill (e.g. 4.3 fills the fifth star 30%). */
export function Rating({ value, count, size = 'sm', className }: { value: number; count?: number; size?: 'sm' | 'md'; className?: string }) {
  const { t } = useTranslation();
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  const label = count !== undefined ? t('a11y.sampleRating', { rating: value.toFixed(1), count }) : t('a11y.rating', { rating: value.toFixed(1) });
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="sr-only">{label}</span>
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - (i - 1)));
          return (
            <span key={i} className={cn('relative inline-block', px)}>
              <Star className={cn('absolute inset-0 text-sand-300', px)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn('text-star', px)} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </span>
      {count !== undefined && (
        <span className="text-xs text-ink-muted" aria-hidden>
          ({count})
        </span>
      )}
    </div>
  );
}
