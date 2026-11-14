import { useTranslation } from 'react-i18next';
import type { RatingDistribution } from '@/types';
import { cn } from '@/utils/cn';
import { STARS } from './review.constants';

export function RatingDistribution({
  distribution,
  total,
  active,
  onPick,
}: {
  distribution: RatingDistribution;
  total: number;
  active: number | null;
  onPick: (stars: number | null) => void;
}) {
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
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-sm enabled:hover:bg-sand-100 disabled:cursor-default',
                  active === s && 'bg-sand-100 font-semibold',
                )}
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
