import { Fragment, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Breadcrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('a11y.breadcrumb')} className="text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <Fragment key={i}>
            <li className="min-w-0">
              {item.to ? (
                <Link to={item.to} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="block truncate text-ink">
                  {item.label}
                </span>
              )}
            </li>
            {i < items.length - 1 && (
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const cell = 'flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors';
  return (
    <nav aria-label={t('a11y.pagination')} className="mt-10 flex justify-center">
      <ul className="flex items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link to={hrefFor(page - 1)} className={cn(cell, 'hover:bg-sand-100')} rel="prev">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only sm:ml-1">{t('common.previous')}</span>
            </Link>
          ) : (
            <span className={cn(cell, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only sm:ml-1">{t('common.previous')}</span>
            </span>
          )}
        </li>
        {pages.map((p) => (
          <li key={p}>
            <Link
              to={hrefFor(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={p === page ? t('a11y.currentPage', { page: p }) : t('a11y.goToPage', { page: p })}
              className={cn(cell, p === page ? 'bg-ink text-white' : 'hover:bg-sand-100')}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link to={hrefFor(page + 1)} className={cn(cell, 'hover:bg-sand-100')} rel="next">
              <span className="sr-only sm:not-sr-only sm:mr-1">{t('common.next')}</span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(cell, 'cursor-not-allowed text-ink-faint')} aria-disabled="true">
              <span className="sr-only sm:not-sr-only sm:mr-1">{t('common.next')}</span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

/** WAI-ARIA tabs with arrow-key navigation. */
export function Tabs({ items, value, onChange, label }: { items: TabItem[]; value: string; onChange: (id: string) => void; label: string }) {
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(0, items.findIndex((i) => i.id === value));

  function onKeyDown(e: KeyboardEvent) {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="scrollbar-none -mx-4 flex gap-6 overflow-x-auto border-b border-sand-200 px-4 sm:mx-0 sm:px-0" onKeyDown={onKeyDown}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={i === index}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors',
              i === index ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={i !== index}
          tabIndex={0}
          className="pt-6 focus-visible:outline-offset-4"
        >
          {i === index && item.content}
        </div>
      ))}
    </div>
  );
}
