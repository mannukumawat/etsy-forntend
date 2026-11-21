import { PAGE_SIZE } from '@/config/store';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/data/categories';
import { RATE_SNAPSHOT } from '@/data/currencies';
import type { AvailabilityFilter, Category, CategorySlug, Product, ProductListResult, ProductQuery } from '@/types';
import { convertFromBase } from '@/utils/money';
import { effectivePrice, totalStock } from '@/utils/variants';
import { fetchCategories, fetchItemGroups, fetchItemGroupsWithProducts, fetchProductBySlug, fetchProducts, fetchProductsByIds, fetchProductsPage } from '@/api';
import type { PublicItemGroup } from '@/api/itemGroups';
import { contentService } from './contentService';

// Products and categories come from the backend API. Filtering, sorting and pagination run
// client-side so the shop UI works offline-first once the catalogue is cached.

// --- Catalogue cache -----------------------------------------------------------------------------
let catalogCache: { at: number; products: Promise<Product[]> } | null = null;
const productDetailCache = new Map<string, { at: number; promise: Promise<Product> }>();
const CATALOG_TTL = 15_000;
// Detail entries expire like the catalogue: a product page revisited after
// this long refetches instead of serving a potentially stale price/stock.
const DETAIL_TTL = 15_000;

function fetchCatalog(): Promise<Product[]> {
  const now = Date.now();
  if (!catalogCache || now - catalogCache.at > CATALOG_TTL) {
    catalogCache = { at: now, products: fetchProducts({ limit: 200 }) };
  }
  return catalogCache.products;
}

export function refreshCatalog() {
  catalogCache = null;
}

async function apiProducts(): Promise<Product[]> {
  try {
    return await fetchCatalog();
  } catch (e) {
    catalogCache = null;
    throw e;
  }
}

// --- Client-side filtering/sorting ---------------------------------------------------------------

function minDisplayPrice(p: Product, query: ProductQuery): number {
  const min = Math.min(...p.variants.map(effectivePrice));
  return convertFromBase(min, query.currency, RATE_SNAPSHOT) / 100;
}

function matchesSearch(p: Product, q: string): boolean {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const cat = CATEGORY_BY_SLUG[p.categoryId];
  const haystack = [
    p.name.en, p.shortDescription.en, p.materials.en,
    cat?.name.en, ...p.tags,
    ...p.options.flatMap((o) => o.values.map((v) => v.label.en)),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

type Dimension = 'category' | 'availability' | 'other';

function applyFilters(products: Product[], query: ProductQuery, skip?: Dimension): Product[] {
  return products.filter((p) => {
    if (query.q && !matchesSearch(p, query.q)) return false;
    if (skip !== 'category' && query.categories?.length && !query.categories.includes(p.categoryId)) return false;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const price = minDisplayPrice(p, query);
      if (query.minPrice !== undefined && price < query.minPrice) return false;
      if (query.maxPrice !== undefined && price > query.maxPrice) return false;
    }
    if (query.minRating && p.rating < query.minRating) return false;
    if (query.onSale && !p.variants.some((v) => v.salePrice !== undefined)) return false;
    if (skip !== 'availability' && query.availability?.length && query.availability.length < 2) {
      const inStock = totalStock(p) > 0;
      if (query.availability[0] === 'in_stock' && !inStock) return false;
      if (query.availability[0] === 'out_of_stock' && inStock) return false;
    }
    return true;
  });
}

function sortProducts(products: Product[], query: ProductQuery): Product[] {
  const sorted = [...products];
  switch (query.sort) {
    case 'price_asc':
      return sorted.sort((a, b) => minDisplayPrice(a, query) - minDisplayPrice(b, query));
    case 'price_desc':
      return sorted.sort((a, b) => minDisplayPrice(b, query) - minDisplayPrice(a, query));
    case 'newest':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return sorted.sort((a, b) => a.featuredRank - b.featuredRank);
  }
}

export function queryProducts(query: ProductQuery, source: Product[]): ProductListResult {
  const all = source;
  const filtered = sortProducts(applyFilters(all, query), query);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);

  const categoryBase = applyFilters(all, query, 'category');
  const availabilityBase = applyFilters(all, query, 'availability');
  const categories = Object.fromEntries(
    CATEGORIES.map((c) => [c.slug, categoryBase.filter((p) => p.categoryId === c.slug).length]),
  ) as Record<CategorySlug, number>;
  const availability: Record<AvailabilityFilter, number> = {
    in_stock: availabilityBase.filter((p) => totalStock(p) > 0).length,
    out_of_stock: availabilityBase.filter((p) => totalStock(p) === 0).length,
  };

  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    pageCount,
    facets: { categories, availability },
  };
}

export const productService = {
  preloadCatalog(): Promise<Product[]> {
    return fetchCatalog();
  },

  preloadProduct(slug: string): Promise<Product> {
    const now = Date.now();
    const existing = productDetailCache.get(slug);
    if (existing && now - existing.at <= DETAIL_TTL) return existing.promise;
    const promise = fetchProductBySlug(slug).catch((error) => {
      productDetailCache.delete(slug);
      throw error;
    });
    productDetailCache.set(slug, { at: now, promise });
    return promise;
  },

  async list(query: ProductQuery): Promise<ProductListResult> {
    let items = await apiProducts();
    if (query.itemGroupSlug) {
      const groups = await fetchItemGroups();
      const group = groups.find((g) => g.slug === query.itemGroupSlug);
      if (group) items = items.filter((p) => p.itemGroupId === group.id);
      else items = [];
    }
    if (query.navLinkId) items = items.filter((p) => p.navLinkId === query.navLinkId);
    return queryProducts(query, items);
  },

  /**
   * One page of the plain shop browse, straight from the server — 12
   * products per request instead of the whole 200-product catalogue. Only
   * valid for the unfiltered, default-sorted browse: the server orders by
   * display order (the same order as the client's default `featured` sort)
   * and returns full-set facet counts, so the shop's infinite scroll,
   * result count and filter counts behave exactly as before. Any query with
   * a search term, filter, group, nav link or non-default sort must use
   * `list()` instead — the server cannot apply those yet.
   */
  async listServerPage(query: { page?: number; pageSize?: number }): Promise<ProductListResult> {
    const pageSize = query.pageSize ?? PAGE_SIZE;
    const res = await fetchProductsPage({ limit: pageSize, page: query.page ?? 1 });
    return {
      items: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize,
      pageCount: res.pageCount,
      facets: res.facets,
    };
  },

  getBySlug(slug: string): Promise<Product> {
    return this.preloadProduct(slug);
  },

  getByIds(ids: string[]): Promise<Product[]> {
    if (!ids.length) return Promise.resolve([]);
    return fetchProductsByIds(ids);
  },

  getRelated(product: Product, limit = 4): Promise<Product[]> {
    const pick = (all: Product[]) => {
      const same = all.filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
      const others = all.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId && p.isBestseller);
      return [...same, ...others].slice(0, limit);
    };
    return apiProducts().then(pick);
  },

  getCollections(): Promise<{ featured: Product[]; bestsellers: Product[]; newArrivals: Product[]; items: Product[]; transfer: Product[] }> {
    const splitByFlags = (all: Product[]) => ({
      featured: all.filter((p) => p.isFeatured).sort((a, b) => a.featuredRank - b.featuredRank).slice(0, 12),
      bestsellers: all.filter((p) => p.isBestseller).slice(0, 8),
      newArrivals: all.filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
      items: [],
      transfer: [],
    });
    const byIds = (all: Product[], ids: string[]) => ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p);

    return Promise.all([apiProducts(), contentService.getHomepage()]).then(([all, homepage]) => {
      const content = homepage.content;
      if (!content) return splitByFlags(all);
      const flags = splitByFlags(all);
      const pick = (ids: string[], fallback: Product[]) => (ids.length ? byIds(all, ids) : fallback);
      return {
        featured: pick(content.featuredProductIds, flags.featured),
        bestsellers: pick(content.bestsellerProductIds, flags.bestsellers),
        newArrivals: pick(content.newArrivalProductIds, flags.newArrivals),
        items: byIds(all, content.itemsProductIds ?? []),
        transfer: byIds(all, content.transferProductIds ?? []),
      };
    });
  },

  suggest(q: string, limit = 5): Promise<Product[]> {
    if (q.trim().length < 2) return Promise.resolve([]);
    return apiProducts().then((items) => items.filter((p) => matchesSearch(p, q)).slice(0, limit));
  },

  listCategories(): Promise<Category[]> {
    return fetchCategories();
  },

  /** Categories with live product counts — counts computed from cached catalog. */
  async getCategoriesWithCounts(): Promise<Array<Category & { count: number; isOnSale?: boolean }>> {
    const [cats, all] = await Promise.all([fetchCategories(), apiProducts()]);
    const onSaleCount = all.filter((p) => p.variants.some((v) => v.salePrice !== undefined)).length;
    const catRows = cats.map((c) => ({ ...c, count: all.filter((p) => p.categoryId === c.id).length }));
    if (onSaleCount > 0) {
      return [
        { id: '__on_sale__', slug: '__on_sale__', name: { en: 'On sale', de: 'Im Angebot', es: 'En oferta', fr: 'En promotion', it: 'In saldo' }, count: onSaleCount, isOnSale: true } as Category & { count: number; isOnSale: boolean },
        ...catRows,
      ];
    }
    return catRows;
  },

  /** Products for a nav-link href: /category/:slug → category products, other hrefs → empty. */
  async getNavLinkProducts(href: string, limit = 8): Promise<Product[]> {
    const catMatch = href.match(/^\/category\/([^/?#]+)/);
    if (!catMatch) return [];
    const slug = catMatch[1];
    const cat = CATEGORY_BY_SLUG[slug as CategorySlug];
    const catId = cat?.id ?? slug;
    const all = await apiProducts();
    return all.filter((p) => p.categoryId === catId).slice(0, limit);
  },

  /** Active item groups with their products (from product.itemGroupId). */
  async getItemGroupsWithProducts(limit = 8): Promise<Array<PublicItemGroup & { products: Product[] }>> {
    return fetchItemGroupsWithProducts(limit);
  },

  /** First product photo per category slug, for categories that have no cover image of their own. */
  async getCategoryCovers(): Promise<Record<string, string>> {
    const covers: Record<string, string> = {};
    for (const p of await apiProducts()) {
      const src = p.images[0]?.src;
      if (src && !covers[p.categoryId]) covers[p.categoryId] = src;
    }
    return covers;
  },

  /** Products for a specific nav link by its id (from product.navLinkId). */
  async getNavLinkProductsById(navLinkId: string, limit = 8): Promise<Product[]> {
    const all = await apiProducts();
    return all.filter((p) => p.navLinkId === navLinkId).slice(0, limit);
  },
};
