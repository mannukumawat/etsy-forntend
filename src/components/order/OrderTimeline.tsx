import { useTranslation } from 'react-i18next';
import { Check, Circle, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLocale';
import type { Order } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';
import { STATUSES } from './order.constants';

/** Placed → processing → shipped → delivered. */
export function OrderTimeline({ order }: { order: Order }) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const reached = STATUSES.indexOf(order.status);

  if (order.status === 'cancelled') {
    const fmt = (d: string) =>
      formatDate(d, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const placedAt = order.timeline.find((e) => e.status === 'placed')?.date ?? order.createdAt;
    const cancelledAt = order.timeline.find((e) => e.status === 'cancelled')?.date;
    return (
      <ol className="relative space-y-6">
        <li className="relative flex gap-4">
          <span className="absolute left-[13px] top-7 h-[calc(100%+0.5rem)] w-0.5 bg-red-200" aria-hidden />
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden>
            <Check className="h-4 w-4" />
          </span>
          <div className="pt-0.5">
            <p className="font-medium text-ink">{t('order.status.placed')}</p>
            <p className="text-sm text-ink-muted">{fmt(placedAt)}</p>
          </div>
        </li>
        <li className="relative flex gap-4" aria-current="step">
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white" aria-hidden>
            <X className="h-4 w-4" />
          </span>
          <div className="pt-0.5">
            <p className="font-medium text-red-700">{t('order.status.cancelled')}</p>
            {cancelledAt && <p className="text-sm text-ink-muted">{fmt(cancelledAt)}</p>}
            <p className="mt-1 text-sm text-ink-muted">
              {t('order.cancelledNote', { defaultValue: 'This order was cancelled and will not be shipped.' })}
            </p>
          </div>
        </li>
      </ol>
    );
  }

  return (
    <ol className="relative space-y-6">
      {STATUSES.map((s, i) => {
        const entry = order.timeline.find((e) => e.status === s);
        const done = i <= reached;
        return (
          <li key={s} className="relative flex gap-4" aria-current={i === reached ? 'step' : undefined}>
            {i < STATUSES.length - 1 && (
              <span
                className={cn('absolute left-[13px] top-7 h-[calc(100%+0.5rem)] w-0.5', i < reached ? 'bg-emerald-600' : 'bg-sand-200')}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                done ? 'bg-emerald-600 text-white' : 'border-2 border-sand-300 bg-white text-sand-300',
              )}
              aria-hidden
            >
              {done ? <Check className="h-4 w-4" /> : <Circle className="h-2 w-2" fill="currentColor" />}
            </span>
            <div className="pt-0.5">
              <p className={cn('font-medium', done ? 'text-ink' : 'text-ink-muted')}>
                {t(`order.status.${s}`)}
                <span className="sr-only">{done ? ` (${t('a11y.stepCompleted')})` : ''}</span>
              </p>
              {entry && (
                <p className="text-sm text-ink-muted">
                  {formatDate(entry.date, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
