import { isCategorySlug } from '@/data/categories';
import type { AvailabilityFilter, CategorySlug, SortOption } from '@/types';

// Shop filters live in the URL so searches are shareable and survive refresh/back navigation.
//   /shop?q=mug&cat=ceramics,bags&min=10&max=50&rating=4&avail=in_stock&sort=price_asc&page=2
//   /category/ceramics?...   (single category in the path)

export interface ShopState {
  q: string;
  categories: CategorySlug[];
  min?: number;
  max?: number;
  rating?: number;
  availability: AvailabilityFilter[];
  sort: SortOption;
  page: number;
}

const SORTS: SortOption[] = ['featured', 'price_asc', 'price_desc', 'newest'];
const AVAIL: AvailabilityFilter[] = ['in_stock', 'out_of_stock'];

function num(v: string | null): number | undefined {
  if (v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseShopState(params: URLSearchParams, slug?: string): ShopState {
  const fromPath = slug && isCategorySlug(slug) ? [slug] : [];
  const fromQuery = (params.get('cat') ?? '').split(',').filter(isCategorySlug);
  const sort = params.get('sort') as SortOption;
  const rating = num(params.get('rating'));
  return {
    q: (params.get('q') ?? '').trim(),
    categories: slug ? fromPath : [...new Set(fromQuery)],
    min: num(params.get('min')),
    max: num(params.get('max')),
    rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    availability: (params.get('avail') ?? '').split(',').filter((a): a is AvailabilityFilter => AVAIL.includes(a as AvailabilityFilter)),
    sort: SORTS.includes(sort) ? sort : 'featured',
    page: Math.max(1, Math.floor(num(params.get('page')) ?? 1)),
  };
}

/** Builds the canonical URL for a shop state: one category -> /category/:slug, otherwise /shop. */
export function shopUrl(state: ShopState): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  const single = state.categories.length === 1 ? state.categories[0] : null;
  if (state.categories.length > 1) params.set('cat', state.categories.join(','));
  if (state.min !== undefined) params.set('min', String(state.min));
  if (state.max !== undefined) params.set('max', String(state.max));
  if (state.rating) params.set('rating', String(state.rating));
  if (state.availability.length) params.set('avail', state.availability.join(','));
  if (state.sort !== 'featured') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  const qs = params.toString();
  return `${single ? `/category/${single}` : '/shop'}${qs ? `?${qs}` : ''}`;
}

export function activeFilterCount(state: ShopState, includeCategories: boolean): number {
  return (
    (includeCategories ? state.categories.length : 0) +
    (state.min !== undefined || state.max !== undefined ? 1 : 0) +
    (state.rating ? 1 : 0) +
    state.availability.length
  );
}
