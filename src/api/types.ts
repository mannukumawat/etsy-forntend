import type { Category, CurrencyCode, Localized, Product } from '@/types';

// Wire shapes for the public catalog endpoints. The backend already maps rows into the storefront's
// own Product/Category shapes (see backend/src/mappers.ts), so these mostly describe the envelopes.

/** `GET /api/products` */
export interface ProductListResponse {
  items: Product[];
  total: number;
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
  limit?: number;
}

/** Error envelope every endpoint uses on failure. */
export interface ApiErrorResponse {
  error: { code: string; message: string; issues: Array<{ path: string; message: string }> };
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
}

/** `GET /api/content/pages/:key` content shape. */
export interface StorefrontPageContent {
  title: Localized;
  intro: Localized;
  sections: StorefrontPageSection[];
}

/** `GET /api/content/homepage` content shape. */
export interface StorefrontHomepageContent {
  announcement: { enabled: boolean; text: Localized };
  hero: { title: Localized; subtitle: Localized; image: string | null; ctaLabel: Localized; ctaHref: string };
  featuredCategoryIds: string[];
  featuredProductIds: string[];
  bestsellerProductIds: string[];
  newArrivalProductIds: string[];
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
    logo: { id: string } | null;
    contact: { email: string; phone: string; address: string; hours: Localized };
    social: { instagram: string; pinterest: string; facebook: string; youtube: string };
  };
  currencies: Array<{ code: CurrencyCode; name: string; rate: number; fractionDigits: number }>;
  shipping: { zones: PublicShippingZone[]; unsupportedMessage: Localized };
}
