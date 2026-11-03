import { PAGE_SIZE } from '@/config/store';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/data/categories';
import { RATE_SNAPSHOT } from '@/data/currencies';
import type { AvailabilityFilter, Category, CategorySlug, Product, ProductListResult, ProductQuery } from '@/types';
import { convertFromBase } from '@/utils/money';
import { effectivePrice, totalStock } from '@/utils/variants';
import { fetchCategories, fetchProductBySlug, fetchProducts, fetchProductsByIds } from '@/api';
import { contentService } from './contentService';

// Products and categories come from the backend API. Filtering, sorting and pagination run
// client-side so the shop UI works offline-first once the catalogue is cached.

// --- Catalogue cache -----------------------------------------------------------------------------
let catalogCache: { at: number; products: Promise<Product[]> } | null = null;
const CATALOG_TTL = 15_000;

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
  list(query: ProductQuery): Promise<ProductListResult> {
    return apiProducts().then((items) => queryProducts(query, items));
  },

  getBySlug(slug: string): Promise<Product> {
    return fetchProductBySlug(slug);
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

  getCollections(): Promise<{ featured: Product[]; bestsellers: Product[]; newArrivals: Product[] }> {
    const splitByFlags = (all: Product[]) => ({
      featured: all.filter((p) => p.isFeatured).sort((a, b) => a.featuredRank - b.featuredRank).slice(0, 12),
      bestsellers: all.filter((p) => p.isBestseller).slice(0, 8),
      newArrivals: all.filter((p) => p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    });
    const byIds = (all: Product[], ids: string[]) => ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p);

    return Promise.all([apiProducts(), contentService.getHomepage()]).then(([all, homepage]) => {
      const content = homepage.content;
      if (!content) return splitByFlags(all);
      return {
        featured: byIds(all, content.featuredProductIds),
        bestsellers: byIds(all, content.bestsellerProductIds),
        newArrivals: byIds(all, content.newArrivalProductIds),
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
};
