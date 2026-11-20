import { beforeAll, describe, expect, it } from 'vitest';
import { syncCategoriesFromApi } from '@/data/categories';
import type { Category } from '@/types';
import { parseShopState, shopUrl } from './shopParams';

beforeAll(async () => {
  const categories = ['ceramics', 'bags', 'jewellery'].map((slug) => ({
    id: slug,
    slug,
    name: { en: slug },
    description: { en: '' },
    image: { src: '', alt: { en: '' } },
    banner: '',
  })) satisfies Category[];
  await syncCategoriesFromApi(async () => categories);
});

describe('shop URL state', () => {
  it('round-trips filters through the URL', () => {
    const state = parseShopState(new URLSearchParams('q=mug&cat=ceramics,bags&min=10&max=50&rating=4&avail=in_stock&sort=price_asc&page=2'));
    expect(state).toMatchObject({ q: 'mug', categories: ['ceramics', 'bags'], min: 10, max: 50, rating: 4, availability: ['in_stock'], sort: 'price_asc', page: 2 });
    expect(shopUrl(state)).toBe('/shop?q=mug&cat=ceramics%2Cbags&min=10&max=50&rating=4&avail=in_stock&sort=price_asc&page=2');
  });

  it('uses /category/:slug for a single category and ignores junk values', () => {
    const state = parseShopState(new URLSearchParams('cat=nope&sort=weird&page=-3'), 'jewellery');
    expect(state.categories).toEqual(['jewellery']);
    expect(state.sort).toBe('featured');
    expect(state.page).toBe(1);
    expect(shopUrl(state)).toBe('/category/jewellery');
  });
});
