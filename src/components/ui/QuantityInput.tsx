import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label?: string;
  hideLabel?: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
  describedBy?: string;
}

/** Stepper with a typed input. Values are always clamped between min and max. */
export function QuantityInput({ value, onChange, min = 1, max, label, hideLabel, size = 'md', disabled, describedBy }: QuantityInputProps) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const upper = Math.max(min, max);
  const clamp = (n: number) => Math.min(upper, Math.max(min, Math.floor(n)));
  const commit = () => {
    const n = Number(draft);
    const next = Number.isFinite(n) && draft.trim() !== '' ? clamp(n) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div>
      <label htmlFor={id} className={cn('label', hideLabel && 'sr-only')}>
        {label ?? t('common.quantity')}
      </label>
      <div className={cn('inline-flex items-center rounded-lg border border-sand-300 bg-white', h, disabled && 'opacity-60')}>
        <button
          type="button"
          className={cn('flex items-center justify-center rounded-l-lg text-ink transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:text-ink-faint', h, size === 'sm' ? 'w-9' : 'w-11')}
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= min}
          aria-label={t('a11y.decreaseQty')}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          className={cn('w-12 border-x border-sand-200 bg-transparent text-center text-[15px] font-medium focus:outline-none', h)}
        />
        <button
          type="button"
          className={cn('flex items-center justify-center rounded-r-lg text-ink transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:text-ink-faint', h, size === 'sm' ? 'w-9' : 'w-11')}
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= upper}
          aria-label={t('a11y.increaseQty')}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
