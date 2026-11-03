import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useLocalized, useMoney } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import type { Product } from '@/types';
import { cn } from '@/utils/cn';
import { effectivePrice } from '@/utils/variants';

/** Header search with an accessible suggestions combobox. Submitting goes to /shop?q=… */
export function SearchBar({ autoFocus, onNavigate, className }: { autoFocus?: boolean; onNavigate?: () => void; className?: string }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const money = useMoney();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQuery = location.pathname === '/shop' || location.pathname.startsWith('/category/') ? (params.get('q') ?? '') : '';
  const [value, setValue] = useState(urlQuery);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => setValue(urlQuery), [urlQuery]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2 || q === urlQuery) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      productService.suggest(q).then(
        (items) => !cancelled && setSuggestions(items),
        () => !cancelled && setSuggestions([]),
      );
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, urlQuery]);

  const showList = open && suggestions.length > 0;
  // Options: each suggestion + "see all results"
  const optionCount = suggestions.length + 1;

  const go = (path: string) => {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    navigate(path);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const q = value.trim();
    go(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (e.key === 'ArrowDown' && suggestions.length) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % optionCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? optionCount - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      if (active < suggestions.length) go(`/product/${suggestions[active].slug}`);
      else submit();
    }
  };

  return (
    <form role="search" onSubmit={submit} className={cn('relative w-full', className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        {t('header.searchLabel')}
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        placeholder={t('header.searchPlaceholder')}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-full border border-sand-300 bg-white pl-4 pr-12 text-[15px] text-ink shadow-sm placeholder:text-ink-faint focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25 [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
        aria-label={t('header.searchSubmit')}
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
      <ul
        id={listId}
        role="listbox"
        aria-label={t('header.suggestions')}
        className={cn('absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-sand-200 bg-white py-1 shadow-lift', !showList && 'hidden')}
      >
        {suggestions.map((p, i) => (
          <li
            key={p.id}
            id={`${listId}-opt-${i}`}
            role="option"
            aria-selected={active === i}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go(`/product/${p.slug}`)}
            className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', active === i ? 'bg-sand-100' : 'hover:bg-ivory-200')}
          >
            <img src={p.images[0].src} alt="" className="h-10 w-10 rounded-md object-cover" />
            <span className="flex-1 truncate text-sm text-ink">{loc(p.name)}</span>
            <span className="text-sm text-ink-muted">{money.formatBase(Math.min(...p.variants.map(effectivePrice)))}</span>
          </li>
        ))}
        <li
          id={`${listId}-opt-${suggestions.length}`}
          role="option"
          aria-selected={active === suggestions.length}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => submit()}
          className={cn('cursor-pointer border-t border-sand-200 px-3 py-2.5 text-sm font-medium text-brand-700', active === suggestions.length ? 'bg-sand-100' : 'hover:bg-ivory-200')}
        >
          {t('header.viewAllResults', { q: value.trim() })}
        </li>
      </ul>
    </form>
  );
}
