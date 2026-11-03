import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { useLocalized } from '@/hooks/useLocale';
import type { AvailabilityFilter, CategorySlug, CurrencyCode, ProductListResult } from '@/types';
import type { ShopState } from '@/utils/shopParams';
import { FieldError } from '../ui/Form';

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-sand-200 py-5 first:pt-0">
      <h3 className="font-sans text-sm font-semibold">
        <button type="button" className="flex w-full items-center justify-between text-left" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {title}
          <ChevronDown className={`h-4 w-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </h3>
      <div id={id} hidden={!open} className="mt-3">
        {children}
      </div>
    </div>
  );
}

function Check({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3 py-1">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="h-[18px] w-[18px] cursor-pointer rounded accent-brand-600" />
      <label htmlFor={id} className="flex flex-1 cursor-pointer justify-between gap-2 text-sm text-ink-soft">
        <span>{label}</span>
        {count !== undefined && <span className="text-ink-muted">({count})</span>}
      </label>
    </div>
  );
}

interface FilterPanelProps {
  state: ShopState;
  facets?: ProductListResult['facets'];
  currency: CurrencyCode;
  onToggleCategory: (slug: CategorySlug) => void;
  onPrice: (min?: number, max?: number) => void;
  onRating: (rating?: number) => void;
  onToggleAvailability: (a: AvailabilityFilter) => void;
}

export function FilterPanel({ state, facets, currency, onToggleCategory, onPrice, onRating, onToggleAvailability }: FilterPanelProps) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const ratingName = useId();
  const priceId = useId();
  const [min, setMin] = useState(state.min?.toString() ?? '');
  const [max, setMax] = useState(state.max?.toString() ?? '');
  const [priceError, setPriceError] = useState<string>();

  useEffect(() => {
    setMin(state.min?.toString() ?? '');
    setMax(state.max?.toString() ?? '');
    setPriceError(undefined);
  }, [state.min, state.max]);

  const submitPrice = (e: FormEvent) => {
    e.preventDefault();
    const lo = min.trim() === '' ? undefined : Math.max(0, Number(min));
    const hi = max.trim() === '' ? undefined : Math.max(0, Number(max));
    if ((lo !== undefined && Number.isNaN(lo)) || (hi !== undefined && Number.isNaN(hi))) return;
    if (lo !== undefined && hi !== undefined && lo > hi) {
      setPriceError('shop.invalidPrice');
      return;
    }
    setPriceError(undefined);
    onPrice(lo, hi);
  };

  return (
    <div>
      <Group title={t('shop.category')}>
        {CATEGORIES.map((c) => (
          <Check key={c.slug} label={loc(c.name)} count={facets?.categories[c.slug]} checked={state.categories.includes(c.slug)} onChange={() => onToggleCategory(c.slug)} />
        ))}
      </Group>

      <Group title={t('shop.price', { currency })}>
        <form onSubmit={submitPrice} noValidate>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={`${priceId}-min`} className="mb-1 block text-xs text-ink-muted">
                {t('shop.min')} <span className="sr-only">({t('shop.minPrice')}, {currency})</span>
              </label>
              <input
                id={`${priceId}-min`}
                inputMode="decimal"
                value={min}
                onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ''))}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? `${priceId}-error` : undefined}
                className="input h-10 py-2 text-sm"
                placeholder="0"
              />
            </div>
            <span className="pb-2.5 text-ink-muted" aria-hidden>
              –
            </span>
            <div className="flex-1">
              <label htmlFor={`${priceId}-max`} className="mb-1 block text-xs text-ink-muted">
                {t('shop.max')} <span className="sr-only">({t('shop.maxPrice')}, {currency})</span>
              </label>
              <input
                id={`${priceId}-max`}
                inputMode="decimal"
                value={max}
                onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ''))}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? `${priceId}-error` : undefined}
                className="input h-10 py-2 text-sm"
                placeholder="∞"
              />
            </div>
          </div>
          <FieldError id={`${priceId}-error`} message={priceError} />
          <button type="submit" className="mt-3 h-9 w-full rounded-lg border border-ink text-sm font-medium transition-colors hover:bg-ink hover:text-white">
            {t('common.apply')}
          </button>
        </form>
      </Group>

      <Group title={t('shop.rating')}>
        <fieldset>
          <legend className="sr-only">{t('shop.rating')}</legend>
          {[undefined, 4, 3].map((r) => {
            const id = `${ratingName}-${r ?? 'any'}`;
            return (
              <div key={id} className="flex items-center gap-3 py-1">
                <input id={id} type="radio" name={ratingName} checked={state.rating === r} onChange={() => onRating(r)} className="h-[18px] w-[18px] cursor-pointer accent-brand-600" />
                <label htmlFor={id} className="cursor-pointer text-sm text-ink-soft">
                  {r ? t('shop.ratingAtLeast', { rating: r }) : t('shop.allProducts')}
                </label>
              </div>
            );
          })}
          <p className="mt-2 text-xs text-ink-muted">{t('shop.ratingNote')}</p>
        </fieldset>
      </Group>

      <Group title={t('shop.availability')}>
        <Check label={t('shop.inStock')} count={facets?.availability.in_stock} checked={state.availability.includes('in_stock')} onChange={() => onToggleAvailability('in_stock')} />
        <Check label={t('shop.outOfStock')} count={facets?.availability.out_of_stock} checked={state.availability.includes('out_of_stock')} onChange={() => onToggleAvailability('out_of_stock')} />
      </Group>
    </div>
  );
}
