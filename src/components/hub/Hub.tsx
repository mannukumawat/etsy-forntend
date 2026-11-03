import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, SlidersHorizontal, Star } from 'lucide-react';
import { WishlistButton } from '@/components/product/WishlistButton';
import { Drawer } from '@/components/ui/Dialog';
import { CATEGORY_BY_SLUG } from '@/data/categories';
import { useLocalized, useMoney } from '@/hooks/useLocale';
import type { CurrencyCode, Product } from '@/types';
import { cn } from '@/utils/cn';
import { priceRange, stockStatus, totalStock } from '@/utils/variants';

const PAGE_SIZE = 8;

/** A circle without its own photo borrows the linked category's image. */
export function circleImage(c: { href: string; image: string | null }): string | null {
  if (c.image) return c.image;
  const m = /^\/category\/([^/?#]+)/.exec(c.href);
  return m ? (CATEGORY_BY_SLUG[m[1]]?.image.src ?? null) : null;
}

/** Readable text on any admin-chosen hero colour. */
export function isDark(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

/** Price-band edges in whole units of the shopper's currency (like Etsy's "Under US$ 25"). */
const BANDS: Record<CurrencyCode, [number, number, number]> = { USD: [25, 50, 100], EUR: [25, 50, 100], GBP: [20, 40, 80], INR: [2000, 4000, 8000] };

type PriceFilter = { kind: 'any' } | { kind: 'band'; min: number | null; max: number | null } | { kind: 'custom'; min: number | null; max: number | null };
interface Filters {
  onSale: boolean;
  inStock: boolean;
  price: PriceFilter;
}
const NO_FILTERS: Filters = { onSale: false, inStock: false, price: { kind: 'any' } };

// --- product card (Etsy hub style) ----------------------------------------------------------------

export function HubProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const money = useMoney();
  const range = priceRange(product.variants);
  const soldOut = stockStatus(totalStock(product)) === 'out_of_stock';
  const onSale = range.compareAt !== undefined;
  const pct = onSale ? Math.round(((range.compareAt! - range.min) / range.compareAt!) * 100) : 0;
  const image = product.images[0];

  return (
    <article className="group relative flex flex-col">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-sand-100">
          {image && <img src={image.src} alt={loc(image.alt)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {(product.isFeatured || product.isBestseller) && <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-ink shadow-sm">{t('hub.pick')}</span>}
            {soldOut && <span className="rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">{t('common.soldOut')}</span>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-1 font-sans text-[15px] text-ink group-hover:underline">{loc(product.name)}</h3>
      </Link>
      {product.reviewCount > 0 && (
        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink">
          <span className="font-semibold num">{product.rating.toFixed(1)}</span>
          <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden />
          <span className="text-ink-muted">({product.reviewCount})</span>
          <span className="sr-only">{t('a11y.rating', { rating: product.rating.toFixed(1) })}</span>
        </p>
      )}
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className={cn('text-lg font-semibold', onSale ? 'text-emerald-700' : 'text-ink')}>
          {range.min !== range.max && !onSale ? `${money.formatBase(range.min)}+` : money.formatBase(range.min)}
        </span>
        {onSale && (
          <>
            <s className="text-sm text-ink-muted">{money.formatBase(range.compareAt!)}</s>
            <span className="text-sm text-ink-muted">{t('hub.percentOff', { pct })}</span>
          </>
        )}
      </p>
      <Link to={`/category/${product.categoryId}`} className="mt-2 inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-ink hover:underline">
        {t('hub.moreLikeThis')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <WishlistButton product={product} className="absolute right-3 top-3 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100" />
    </article>
  );
}

// --- filters ---------------------------------------------------------------------------------------

function FilterDrawer({
  open,
  onClose,
  filters,
  setFilters,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  resultCount: number;
}) {
  const { t } = useTranslation();
  const money = useMoney();
  const [a, b, c] = BANDS[money.currency];
  const unit = (n: number) => money.format(n * 10 ** (money.currency === 'INR' ? 0 : 2)).replace(/[.,]00$/, '');
  const [low, setLow] = useState(filters.price.kind === 'custom' && filters.price.min !== null ? String(filters.price.min) : '');
  const [high, setHigh] = useState(filters.price.kind === 'custom' && filters.price.max !== null ? String(filters.price.max) : '');

  const bands: Array<{ id: string; label: string; min: number | null; max: number | null }> = [
    { id: 'u', label: t('hub.under', { max: unit(a) }), min: null, max: a },
    { id: 'ab', label: t('hub.between', { min: unit(a), max: unit(b) }), min: a, max: b },
    { id: 'bc', label: t('hub.between', { min: unit(b), max: unit(c) }), min: b, max: c },
    { id: 'o', label: t('hub.over', { min: unit(c) }), min: c, max: null },
  ];
  const isBand = (band: (typeof bands)[number]) => filters.price.kind === 'band' && filters.price.min === band.min && filters.price.max === band.max;
  const radio = 'h-5 w-5 accent-ink';

  const applyCustom = () => {
    const min = low.trim() === '' ? null : Math.max(0, Number(low));
    const max = high.trim() === '' ? null : Math.max(0, Number(high));
    if ((min !== null && Number.isNaN(min)) || (max !== null && Number.isNaN(max))) return;
    setFilters({ ...filters, price: min === null && max === null ? { kind: 'any' } : { kind: 'custom', min, max } });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      title={t('hub.filtersTitle')}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
            onClick={() => {
              setFilters(NO_FILTERS);
              setLow('');
              setHigh('');
            }}
          >
            {t('hub.clear')}
          </button>
          <button type="button" onClick={onClose} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/90">
            {t('hub.showResults', { count: resultCount })}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-2 font-semibold text-ink">{t('hub.specialOffers')}</legend>
          <label className="flex cursor-pointer items-center gap-3 py-1.5">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={filters.onSale} onChange={(e) => setFilters({ ...filters, onSale: e.target.checked })} />
            {t('hub.onSale')}
          </label>
          <label className="flex cursor-pointer items-center gap-3 py-1.5">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={filters.inStock} onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })} />
            {t('hub.inStock')}
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-semibold text-ink">{t('hub.price', { currency: money.currency })}</legend>
          <p className="mb-2 text-sm text-ink-muted">{t('hub.priceNote')}</p>
          <label className="flex cursor-pointer items-center gap-3 py-1.5">
            <input type="radio" name="hub-price" className={radio} checked={filters.price.kind === 'any'} onChange={() => setFilters({ ...filters, price: { kind: 'any' } })} />
            {t('hub.anyPrice')}
          </label>
          {bands.map((band) => (
            <label key={band.id} className="flex cursor-pointer items-center gap-3 py-1.5">
              <input type="radio" name="hub-price" className={radio} checked={isBand(band)} onChange={() => setFilters({ ...filters, price: { kind: 'band', min: band.min, max: band.max } })} />
              {band.label}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-3 py-1.5">
            <input type="radio" name="hub-price" className={radio} checked={filters.price.kind === 'custom'} onChange={applyCustom} />
            {t('hub.custom')}
          </label>
          <div className="mt-2 flex items-center gap-3 pl-8">
            <input type="number" min={0} inputMode="decimal" aria-label={t('hub.low')} placeholder={t('hub.low')} value={low} onChange={(e) => setLow(e.target.value)} className="input h-11 w-28" />
            <span className="text-sm text-ink-muted">–</span>
            <input type="number" min={0} inputMode="decimal" aria-label={t('hub.high')} placeholder={t('hub.high')} value={high} onChange={(e) => setHigh(e.target.value)} className="input h-11 w-28" />
            <button type="button" onClick={applyCustom} aria-label={t('hub.applyCustom')} className="flex h-10 w-10 items-center justify-center rounded-full bg-sand-100 hover:bg-sand-200">
              <Check className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </fieldset>
      </div>
    </Drawer>
  );
}

function activeCount(f: Filters) {
  return (f.onSale ? 1 : 0) + (f.inStock ? 1 : 0) + (f.price.kind === 'any' ? 0 : 1);
}

// --- one product section ----------------------------------------------------------------------------

export function HubSection({ title, products }: { title: string; products: Product[] }) {
  const { t } = useTranslation();
  const money = useMoney();
  const [shown, setShown] = useState(PAGE_SIZE);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  const filtered = useMemo(() => {
    const factor = money.currency === 'INR' ? 1 : 100;
    return products.filter((p) => {
      const range = priceRange(p.variants);
      if (filters.onSale && range.compareAt === undefined) return false;
      if (filters.inStock && totalStock(p) === 0) return false;
      if (filters.price.kind !== 'any') {
        const price = money.convert(range.min) / factor;
        const { min, max } = filters.price;
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
      }
      return true;
    });
  }, [products, filters, money]);

  if (!products.length) return null;
  const count = activeCount(filters);

  return (
    <section className="container-site mt-16">
      <h2 className="text-center font-serif text-4xl lg:text-5xl">{title}</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn('inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold text-ink', count ? 'bg-ink text-white' : 'bg-sand-100 hover:bg-sand-200')}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {t('hub.filters')}
          {count > 0 && <span className="rounded-full bg-white px-1.5 text-xs text-ink">{count}</span>}
        </button>
        {count > 0 && (
          <>
            <span className="text-sm text-ink-muted" aria-live="polite">
              {t('hub.results', { count: filtered.length })}
            </span>
            <button type="button" className="text-sm font-semibold underline-offset-4 hover:underline" onClick={() => setFilters(NO_FILTERS)}>
              {t('hub.clear')}
            </button>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-ink-muted">{t('hub.noMatch')}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {filtered.slice(0, shown).map((p) => (
            <HubProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      {shown < filtered.length && (
        <div className="mt-10 flex justify-center">
          <button type="button" onClick={() => setShown((s) => s + PAGE_SIZE)} className="rounded-full border border-ink px-8 py-2.5 text-sm font-semibold text-ink hover:bg-ink hover:text-white">
            {t('hub.showMore')}
          </button>
        </div>
      )}
      {open && <FilterDrawer open onClose={() => setOpen(false)} filters={filters} setFilters={setFilters} resultCount={filtered.length} />}
    </section>
  );
}

// --- hero + circles (shared by collections, categories and New in) ---------------------------------

export interface HubCircle {
  label: string;
  href: string;
  image: string | null;
}

/** Etsy-style hub header: coloured band with a big serif title, and photo circles overlapping it. */
export function HubHero({ title, subtitle, color, image, circles = [] }: { title: string; subtitle?: string; color: string; image?: string | null; circles?: HubCircle[] }) {
  const dark = isDark(color);
  const hasCircles = circles.length > 0;
  return (
    <>
      <section className={cn('relative overflow-hidden text-center', hasCircles ? 'pb-36 pt-12 sm:pb-40' : 'py-16')} style={{ backgroundColor: color }}>
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="container-site relative">
          <h1 className={cn('font-serif text-5xl leading-tight lg:text-7xl', dark ? 'text-white' : 'text-ink')}>{title}</h1>
          {subtitle && <p className={cn('mx-auto mt-3 max-w-3xl text-lg font-semibold lg:text-xl', dark ? 'text-white' : 'text-ink-soft')}>{subtitle}</p>}
        </div>
      </section>
      {hasCircles && (
        <div className="container-site relative -mt-28 sm:-mt-32">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-8">
            {circles.map((c, i) => {
              const img = circleImage(c);
              return (
                <li key={i} className="w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(16.666%-20px)]">
                  <Link to={c.href} className="group flex flex-col items-center gap-3 text-center">
                    <span className="block aspect-square w-full max-w-[200px] overflow-hidden rounded-full bg-sand-100 shadow-sm ring-4 ring-ivory-50">
                      {img && <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink group-hover:underline">
                      {c.label}
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

/** Same hero colour as the Wedding Guide, used for pages that aren't admin-designed collections. */
export const HUB_COLOR = '#F3E6DC';
