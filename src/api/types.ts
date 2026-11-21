import type { Category, CurrencyCode, Localized, Product, ProductListResult } from '@/types';

// Wire shapes for the public catalog endpoints. The backend already maps rows into the storefront's
// own Product/Category shapes (see backend/src/mappers.ts), so these mostly describe the envelopes.

/** `GET /api/products` — server-paged since the backend pagination change;
 * `total` is the full filtered count, and the page fields are present on
 * every response (older callers that only read `items` are unaffected). */
export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: ProductListResult['facets'];
}

/** `GET /api/products/:slug` returns a bare Product. */
export type ProductResponse = Product;

/** `GET /api/categories` */
export interface CategoryListResponse {
  items: Category[];
}

/** Query accepted by `GET /api/products`. */
export interface ProductListParams {
  q?: string;
  /** Comma-joined category slugs. */
  category?: string;
  /** Comma-joined product ids. */
  ids?: string;
  /** 1-based page for server-side pagination. */
  page?: number;
  limit?: number;
}

/** A real empty state (not a silent fallback) when nothing has been published yet. */
export interface PublishedContentResponse<T> {
  published: boolean;
  content: T | null;
}

export interface StorefrontPageSection {
  id: string;
  heading: Localized;
  body: Localized;
  /** Optional photo shown beside the section (About page). */
  image?: string | null;
}

/** `GET /api/content/pages/:key` content shape. */
export interface StorefrontPageContent {
  title: Localized;
  intro: Localized;
  /** Optional banner image (About page). */
  heroImage?: string | null;
  sections: StorefrontPageSection[];
}

/** `GET /api/content/homepage` content shape. */
export interface StorefrontHomepageContent {
  announcement: { enabled: boolean; text: Localized };
  hero: { title: Localized; subtitle: Localized; image: string | null; ctaLabel: Localized; ctaHref: string };
  /** Admin-managed banner slides. Each entry is a full-width image URL for the shop banner carousel.
   *  If absent or empty the storefront falls back to static category art. */
  bannerSlides?: Array<{ image: string; ctaHref?: string }>;
  /** Extra homepage slider banners after the hero (admin-managed). */
  slides?: Array<{ id: string; image: string | null; title: Localized; subtitle: Localized; ctaLabel: Localized; ctaHref: string }>;
  featuredCategoryIds: string[];
  featuredProductIds: string[];
  bestsellerProductIds: string[];
  newArrivalProductIds: string[];
  itemsProductIds: string[];
  transferProductIds: string[];
  story: { title: Localized; body: Localized; image: string | null; ctaLabel: Localized; ctaHref: string };
  newsletter: { title: Localized; body: Localized };
}

export interface ShippingZoneRate {
  enabled: boolean;
  rate: number;
  minDays: number;
  maxDays: number;
}

export interface PublicShippingZone {
  id: string;
  name: string;
  countries: string[];
  standard: ShippingZoneRate;
  express: ShippingZoneRate;
}

/** `GET /api/settings` */
export interface PublicSettingsResponse {
  store: {
    name: string;
    tagline: Localized;
    logo: { id: string; url?: string } | null;
    /** Short location string shown under store name, e.g. "Jaipur, Rajasthan" */
    location?: string;
    /** Public-facing store stats shown on the shop profile strip */
    stats?: { rating: number; reviewCount: number; salesCount: number; yearsOnPlatform?: number };
    /** Maximum quantity per cart line, from the admin store settings (default 10). */
    maxQtyPerLine?: number;
    contact: { email: string; phone: string; address: string; hours: Localized };
    social: { instagram: string; pinterest: string; facebook: string; youtube: string };
  };
  currencies: Array<{ code: CurrencyCode; name: string; rate: number; fractionDigits: number; roundingIncrement: number }>;
  shipping: { zones: PublicShippingZone[]; unsupportedMessage: Localized };
}
