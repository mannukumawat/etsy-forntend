import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown, ChevronRight, Menu, Sparkles } from 'lucide-react';
import { fetchCollections } from '@/api';

import { Skeleton } from '@/components/ui/Feedback';
import { CATEGORIES } from '@/data/categories';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import { usePreferences } from '@/store/preferences';
import { cn } from '@/utils/cn';

const RECOMMENDED = '__recommended';
const TILES = 9;

interface Tile {
  key: string;
  label: string;
  href: string;
  image: string | null;
}

/** Etsy-style Categories mega menu: category list on the left; on the right an "All …" link and a
 *  photo grid. There are no sub-categories in this store, so a category shows its own products, and
 *  "Recommended" shows the curated collections (Gifts, Top Gifts, Wedding Guide…). Data loads the
 *  first time the menu opens. */
export function CategoriesMenu({ className }: { className?: string }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const currency = usePreferences((s) => s.currency);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<string>(RECOMMENDED);
  const ref = useRef<HTMLDivElement>(null);

  const collections = useAsync(loaded ? 'menu:collections' : null, () => fetchCollections());
  const products = useAsync(loaded ? `catalog:menu:${currency}` : null, () => productService.list({ currency, sort: 'featured', pageSize: 200 }));
  const { data: apiCategories } = useAsync(loaded ? 'catalog:categories' : null, () => productService.listCategories());
  const categories = apiCategories ?? CATEGORIES;

  useEffect(() => {
    if (!open) return;
    setLoaded(true);
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

  const panel = useMemo(() => {
    if (active === RECOMMENDED) {
      const tiles: Tile[] = (collections.data ?? []).map((c) => ({ key: c.slug, label: loc(c.title), href: `/collection/${c.slug}`, image: c.image }));
      return { heading: t('hub.recommended'), headingHref: null as string | null, tiles, loading: !collections.data && !collections.isError };
    }
    const category = categories.find((c) => c.slug === active);
    if (!category) return { heading: '', headingHref: null as string | null, tiles: [] as Tile[], loading: false };
    const tiles: Tile[] = (products.data?.items ?? [])
      .filter((p) => p.categoryId === active)
      .slice(0, TILES)
      .map((p) => ({ key: p.id, label: loc(p.name), href: `/product/${p.slug}`, image: p.images[0]?.src ?? null }));
    return { heading: t('hub.allIn', { name: loc(category.name) }), headingHref: `/category/${active}`, tiles, loading: !products.data && !products.isError };
  }, [active, collections.data, collections.isError, products.data, products.isError, loc, t]);

  const close = () => setOpen(false);
  const go = (href: string) => {
    close();
    navigate(href);
  };

  const listItem = (id: string, label: React.ReactNode, href: string | null) => (
    <li key={id}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={active === id}
        onMouseEnter={() => setActive(id)}
        onFocus={() => setActive(id)}
        onClick={() => (active === id && href ? go(href) : setActive(id))}
        className={cn('flex w-full items-center justify-between gap-3 px-6 py-3.5 text-left text-[17px] text-ink hover:bg-sand-100', active === id && 'bg-sand-100')}
      >
        {label}
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
      </button>
    </li>
  );

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn('flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[14.5px] font-semibold text-ink transition-colors', open ? 'bg-sand-200' : 'bg-sand-100 hover:bg-sand-200')}
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
        {t('nav.categories')}
        <ChevronDown className={cn('h-4 w-4 text-ink-muted transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 flex h-[min(72vh,740px)] w-[min(1120px,calc(100vw-48px))] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lift">
          {/* left: categories */}
          <ul role="menu" aria-label={t('nav.categories')} className="w-[330px] shrink-0 overflow-y-auto border-r border-sand-200 py-3">
            {listItem(
              RECOMMENDED,
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
                {t('hub.recommended')}
              </span>,
              panel.headingHref,
            )}
            {categories.map((c) => listItem(c.slug, loc(c.name), `/category/${c.slug}`))}
          </ul>

          {/* right: tiles */}
          <div className="min-w-0 flex-1 overflow-y-auto px-10 py-8">
            {panel.headingHref ? (
              <Link to={panel.headingHref} onClick={close} className="inline-flex items-center gap-2 text-lg font-semibold text-ink hover:underline">
                {panel.heading}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            ) : (
              <p className="text-lg font-semibold text-ink">{panel.heading}</p>
            )}
            <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-3">
              {panel.loading
                ? Array.from({ length: 6 }, (_, i) => (
                    <li key={i}>
                      <Skeleton className="aspect-square w-full rounded-xl" />
                      <Skeleton className="mx-auto mt-3 h-4 w-2/3" />
                    </li>
                  ))
                : panel.tiles.map((tile) => (
                    <li key={tile.key}>
                      <Link to={tile.href} onClick={close} className="group block text-center">
                        <span className="block aspect-square overflow-hidden rounded-xl bg-sand-100">
                          {tile.image && <img src={tile.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        </span>
                        <span className="mt-3 line-clamp-2 block font-semibold text-ink group-hover:underline">{tile.label}</span>
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
