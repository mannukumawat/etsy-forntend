import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useLocalized } from '@/hooks/useLocale';
import type { Product } from '@/types';
import { cn } from '@/utils/cn';
import { isValueInStock, type Selection } from '@/utils/variants';
import { FieldError } from '../ui/Form';

interface VariantSelectorProps {
  product: Product;
  selection: Selection;
  onChange: (optionId: string, valueId: string) => void;
  /** Option ids that must be chosen before adding to cart. */
  missing?: string[];
  idPrefix?: string;
}

/** Above this many values a button option becomes a dropdown, so long size lists stay compact. */
const DROPDOWN_AFTER = 6;

/** Native radio groups (arrow-key accessible) styled as swatches or buttons. */
export function VariantSelector({ product, selection, onChange, missing = [], idPrefix = 'opt' }: VariantSelectorProps) {
  const { t } = useTranslation();
  const loc = useLocalized();

  return (
    <div className="space-y-5">
      {product.options.map((option) => {
        const selected = option.values.find((v) => v.id === selection[option.id]);
        const optionName = loc(option.name);
        const isMissing = missing.includes(option.id);
        const errorId = `${idPrefix}-${option.id}-error`;
        return (
          <fieldset key={option.id} id={`${idPrefix}-${option.id}`} aria-describedby={isMissing ? errorId : undefined} tabIndex={-1} className="focus:outline-none">
            <legend className="mb-2 text-sm font-medium text-ink">
              {optionName}:{' '}
              <span className={cn('font-normal', selected ? 'text-ink-soft' : 'text-ink-muted')}>
                {selected ? loc(selected.label) : t('product.selectOption', { option: optionName.toLowerCase() })}
              </span>
            </legend>
            {option.type !== 'swatch' && option.values.length > DROPDOWN_AFTER ? (
              <div className="relative">
                <label htmlFor={`${idPrefix}-${option.id}-select`} className="sr-only">
                  {optionName}
                </label>
                <select
                  id={`${idPrefix}-${option.id}-select`}
                  value={selection[option.id] ?? ''}
                  onChange={(e) => onChange(option.id, e.target.value)}
                  aria-invalid={isMissing || undefined}
                  className={cn(
                    'h-12 w-full cursor-pointer appearance-none rounded-lg border bg-white pl-4 pr-10 text-[15px] text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/25',
                    isMissing ? 'border-red-500' : 'border-sand-300 hover:border-ink focus:border-ink',
                  )}
                >
                  <option value="" disabled>
                    {t('product.selectOption', { option: optionName.toLowerCase() })}
                  </option>
                  {option.values.map((value) => {
                    const label = loc(value.label);
                    const inStock = isValueInStock(product, selection, option.id, value.id);
                    return (
                      <option key={value.id} value={value.id}>
                        {inStock ? label : `${label} — ${t('common.soldOut')}`}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
              </div>
            ) : (
            <div className="flex flex-wrap gap-2.5">
              {option.values.map((value) => {
                const inStock = isValueInStock(product, selection, option.id, value.id);
                const label = loc(value.label);
                const checked = selection[option.id] === value.id;
                return (
                  <label key={value.id} className="relative cursor-pointer" title={inStock ? label : t('product.soldOutValue', { value: label })}>
                    <input
                      type="radio"
                      name={`${idPrefix}-${option.id}`}
                      value={value.id}
                      checked={checked}
                      onChange={() => onChange(option.id, value.id)}
                      className="peer sr-only"
                    />
                    {option.type === 'swatch' ? (
                      <>
                        <span
                          aria-hidden
                          className={cn(
                            'relative block h-10 w-10 overflow-hidden rounded-full border-[3px] border-white ring-1 ring-sand-300 transition-shadow',
                            'peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600',
                            !inStock && 'opacity-60',
                          )}
                          style={{ background: value.swatch }}
                        >
                          {!inStock && <span className="absolute left-1/2 top-[-4px] h-[48px] w-[2px] -translate-x-1/2 rotate-45 bg-ink/70" />}
                        </span>
                        <span className="sr-only">{inStock ? label : t('product.soldOutValue', { value: label })}</span>
                      </>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex h-10 min-w-[3rem] items-center justify-center rounded-lg border px-3.5 text-sm font-medium transition-colors',
                          'border-sand-300 bg-white text-ink hover:border-ink',
                          'peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white',
                          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600',
                          !inStock && 'text-ink-faint line-through decoration-ink-faint',
                        )}
                      >
                        {label}
                        {!inStock && <span className="sr-only"> ({t('common.soldOut')})</span>}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            )}
            {isMissing && <FieldError id={errorId} message={t('product.chooseOption', { option: optionName.toLowerCase() })} />}
          </fieldset>
        );
      })}
    </div>
  );
}
