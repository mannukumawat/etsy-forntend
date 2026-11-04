import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { useLocalized } from '@/hooks/useLocale';
import type { AvailabilityFilter, CategorySlug, CurrencyCode, ProductListResult } from '@/types';
import { cn } from '@/utils/cn';
import type { ShopState } from '@/utils/shopParams';
import { FieldError } from '../ui/Form';

type Facets = ProductListResult['facets'] | undefined;

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-sand-100 py-4 first:pt-0 last:border-0 last:pb-0">
      <h3 className="font-sans">
        <button type="button" className="flex w-full items-center justify-between text-left text-[12px] font-bold uppercase tracking-[0.12em] text-ink" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {title}
          <ChevronDown className={cn('h-4 w-4 text-ink-muted transition-transform duration-200', open && 'rotate-180')} aria-hidden />
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
    <label htmlFor={id} className={cn('-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors', checked ? 'bg-brand-50' : 'hover:bg-ivory-100')}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 cursor-pointer rounded accent-brand-600" />
      <span className={cn('flex-1 text-sm', checked ? 'font-medium text-ink' : 'text-ink-soft')}>{label}</span>
      {count !== undefined && (
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', checked ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-muted')}>{count}</span>
      )}
    </label>
  );
}

export function CategoryOptions({ state, facets, onToggleCategory }: { state: ShopState; facets: Facets; onToggleCategory: (slug: CategorySlug) => void }) {
  const loc = useLocalized();
  return (
    <>
      {CATEGORIES.map((c) => (
        <Check key={c.slug} label={loc(c.name)} count={facets?.categories[c.slug]} checked={state.categories.includes(c.slug)} onChange={() => onToggleCategory(c.slug)} />
      ))}
    </>
  );
}

export function AvailabilityOptions({ state, facets, onToggleAvailability }: { state: ShopState; facets: Facets; onToggleAvailability: (a: AvailabilityFilter) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Check label={t('shop.inStock')} count={facets?.availability.in_stock} checked={state.availability.includes('in_stock')} onChange={() => onToggleAvailability('in_stock')} />
      <Check label={t('shop.outOfStock')} count={facets?.availability.out_of_stock} checked={state.availability.includes('out_of_stock')} onChange={() => onToggleAvailability('out_of_stock')} />
    </>
  );
}

const priceInputCls =
  'h-10 w-full rounded-lg border border-sand-200 bg-ivory-100 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20';

export function PriceForm({ state, currency, onPrice, onDone }: { state: ShopState; currency: CurrencyCode; onPrice: (min?: number, max?: number) => void; onDone?: () => void }) {
  const { t } = useTranslation();
  const priceId = useId();
  const [min, setMin] = useState(state.min?.toString() ?? '');
  const [max, setMax] = useState(state.max?.toString() ?? '');
  const [priceError, setPriceError] = useState<string>();

  useEffect(() => {
    setMin(state.min?.toString() ?? '');
    setMax(state.max?.toString() ?? '');
    setPriceError(undefined);
  }, [state.min, state.max]);

  const submit = (e: FormEvent) => {
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
    onDone?.();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${priceId}-min`} className="sr-only">
            {t('shop.minPrice')} ({currency})
          </label>
          <input
            id={`${priceId}-min`}
            inputMode="decimal"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ''))}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={priceError ? `${priceId}-error` : undefined}
            className={priceInputCls}
            placeholder={t('shop.min')}
          />
        </div>
        <span className="text-ink-faint" aria-hidden>
          –
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${priceId}-max`} className="sr-only">
            {t('shop.maxPrice')} ({currency})
          </label>
          <input
            id={`${priceId}-max`}
            inputMode="decimal"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ''))}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={priceError ? `${priceId}-error` : undefined}
            className={priceInputCls}
            placeholder={t('shop.max')}
          />
        </div>
      </div>
      <FieldError id={`${priceId}-error`} message={priceError} />
      <button type="submit" className="mt-3 h-10 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
        {t('common.apply')}
      </button>
    </form>
  );
}

/** Toolbar dropdown button; children may take `close` to dismiss after an action. */
export function FilterDropdown({ label, activeCount = 0, children }: { label: string; activeCount?: number; children: ReactNode | ((close: () => void) => ReactNode) }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-sm font-medium transition-colors',
          activeCount > 0 ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-sand-300 bg-white text-ink hover:border-ink',
          open && activeCount === 0 && 'border-ink',
        )}
      >
        {label}
        {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">{activeCount}</span>}
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-sand-200 bg-white p-4 shadow-lift">
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
}

interface FilterPanelProps {
  state: ShopState;
  facets?: ProductListResult['facets'];
  currency: CurrencyCode;
  onToggleCategory: (slug: CategorySlug) => void;
  onPrice: (min?: number, max?: number) => void;
  onToggleAvailability: (a: AvailabilityFilter) => void;
  hideCategory?: boolean;
}

/** Stacked version of the filters, used in the mobile drawer. */
export function FilterPanel({ state, facets, currency, onToggleCategory, onPrice, onToggleAvailability, hideCategory }: FilterPanelProps) {
  const { t } = useTranslation();
  return (
    <div>
      {!hideCategory && (
        <Group title={t('shop.category')}>
          <CategoryOptions state={state} facets={facets} onToggleCategory={onToggleCategory} />
        </Group>
      )}
      <Group title={t('shop.price', { currency })}>
        <PriceForm state={state} currency={currency} onPrice={onPrice} />
      </Group>
      <Group title={t('shop.availability')}>
        <AvailabilityOptions state={state} facets={facets} onToggleAvailability={onToggleAvailability} />
      </Group>
    </div>
  );
}
