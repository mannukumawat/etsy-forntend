import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID, PRODUCTS } from '@/data/products';
import { resolveCartLines } from './cart';
import { parseShopState, shopUrl } from './shopParams';
import { findVariant, imagesForSelection, isValueInStock, maxAddable, priceRange, totalStock } from './variants';

const mug = PRODUCT_BY_ID['p-mug'];
const plates = PRODUCT_BY_ID['p-plates'];

describe('catalogue', () => {
  it('has at least 16 products across four categories with stock variety', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(16);
    expect(new Set(PRODUCTS.map((p) => p.categoryId)).size).toBe(4);
    expect(PRODUCTS.some((p) => totalStock(p) === 0)).toBe(true);
    expect(PRODUCTS.some((p) => p.variants.some((v) => v.stock > 0 && v.stock <= 5))).toBe(true);
    expect(new Set(PRODUCTS.map((p) => p.slug)).size).toBe(PRODUCTS.length);
  });
});

describe('variants', () => {
  it('requires a complete selection for products with options', () => {
    expect(findVariant(mug, {})).toBeUndefined();
    expect(findVariant(mug, { color: 'sage' })?.id).toBe('p-mug--sage');
    expect(findVariant(PRODUCT_BY_ID['p-vase'], {})?.id).toBe('p-vase--default');
  });

  it('switches images as soon as a colour is chosen', () => {
    expect(imagesForSelection(mug, { color: 'charcoal' })).toBe(findVariant(mug, { color: 'charcoal' })!.images);
    expect(imagesForSelection(mug, { color: 'charcoal' })).not.toBe(imagesForSelection(mug, { color: 'sand' }));
  });

  it('flags sold-out option values', () => {
    expect(isValueInStock(mug, {}, 'color', 'charcoal')).toBe(false);
    expect(isValueInStock(mug, {}, 'color', 'sand')).toBe(true);
  });

  it('shows a price range when variant prices differ', () => {
    expect(priceRange(plates.variants)).toEqual({ min: 6400, max: 11800, compareAt: undefined });
    expect(priceRange([PRODUCT_BY_ID['p-bowl'].variants[0]]).compareAt).toBe(3200);
  });

  it('limits addable quantity by stock and what is already in the cart', () => {
    const blush = findVariant(mug, { color: 'blush' })!; // stock 3
    expect(maxAddable(blush, 0)).toBe(3);
    expect(maxAddable(blush, 2)).toBe(1);
    expect(maxAddable(blush, 3)).toBe(0);
  });
});

describe('cart line resolution', () => {
  it('flags unavailable, sold-out and over-stock lines', () => {
    const now = new Date().toISOString();
    const resolved = resolveCartLines(
      [
        { productId: 'p-mug', variantId: 'p-mug--sand', quantity: 1, addedAt: now },
        { productId: 'p-mug', variantId: 'p-mug--charcoal', quantity: 1, addedAt: now },
        { productId: 'p-mug', variantId: 'p-mug--blush', quantity: 5, addedAt: now },
        { productId: 'p-gone', variantId: 'x', quantity: 1, addedAt: now },
      ],
      [mug],
      false,
    );
    expect(resolved.map((r) => r.issue ?? r.status)).toEqual(['ok', 'out_of_stock', 'insufficient', 'unavailable']);
  });
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
