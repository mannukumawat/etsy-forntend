// Shared domain types matching the shapes returned by the backend API.

/** Storefront UI language. English variants share one translation and differ only in date/number format. */
export type LanguageCode = 'en-US' | 'en-GB' | 'en-IN' | 'de' | 'fr' | 'it' | 'es';
export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP';

/** Store content is authored in English; the API adds `de`/`fr`/`it`/`es` when a translation exists. */
export type ContentLanguage = 'de' | 'fr' | 'it' | 'es';
export type Localized = { en: string } & Partial<Record<ContentLanguage, string>>;

/** Integer amount in minor units (cents, paise...). Never use floats for money. */
export type Minor = number;

export interface ProductImage {
  src: string;
  alt: Localized;
}

/**
 * Category slugs are data-driven: the seeded store ships ceramics / bags / jewellery / home-decor,
 * but the owner can add more through the admin, so this is a plain string.
 */
export type CategorySlug = string;

export interface Category {
  id: CategorySlug;
  slug: CategorySlug;
  name: Localized;
  description: Localized;
  image: ProductImage;
  banner: string;
}

export interface OptionValue {
  id: string;
  label: Localized;
  /** CSS colour for swatches (colour options only). */
  swatch?: string;
}

export interface ProductOption {
  id: string; // e.g. "color", "size"
  name: Localized;
  type: 'swatch' | 'button';
  values: OptionValue[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  /** optionId -> valueId */
  options: Record<string, string>;
  /** Base-currency (USD) price in minor units. */
  price: Minor;
  salePrice?: Minor;
  stock: number;
  images: ProductImage[];
}

export interface Review {
  id: string;
  /** Public display name only — the API never returns email, phone, address or order details. */
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  edited?: boolean;
  /** Set by the server from a delivered order of this product; never client-claimed. */
  verifiedPurchase: boolean;
  photos?: string[];
}

export type RatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>;

/** The signed-in customer's own review (any moderation status). */
export interface OwnReview {
  id: string;
  productId: string;
  productSlug: string;
  productName: { en: string; hi: string };
  rating: number;
  title: string;
  body: string;
  status: 'published' | 'hidden';
  createdAt: string;
  editedAt: string | null;
  photos: string[];
}

export interface ReviewInput {
  rating: number;
  title: string;
  body: string;
  photos: string[];
}

export type ReviewSort = 'newest' | 'highest' | 'lowest';

export interface ReviewPage {
  items: Review[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  sort: ReviewSort;
  rating: number | null;
  summary: { average: number; count: number; distribution: RatingDistribution };
}

export interface ProductDimension {
  key: 'height' | 'width' | 'depth' | 'diameter' | 'capacity' | 'length' | 'weight' | 'chain' | 'dropLength';
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  categoryId: CategorySlug;
  itemGroupId?: string | null;
  navLinkId?: string | null;
  /** Lowest base price across variants (minor units, USD). */
  price: Minor;
  salePrice?: Minor;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  materials: Localized;
  care: Localized;
  returnsAllowed: boolean;
  exchangeAllowed: boolean;
  returnDays: number;
  dimensions: ProductDimension[];
  /** Newest few published reviews (detail endpoint only; empty in lists). */
  reviews: Review[];
  /** Average of published reviews, 0 when there are none. */
  rating: number;
  reviewCount: number;
  reviewDistribution: RatingDistribution;
  tags: string[];
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  createdAt: string;
  /** Position used by the "featured" sort. */
  featuredRank: number;
}

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest';
export type AvailabilityFilter = 'in_stock' | 'out_of_stock';

export interface ProductQuery {
  q?: string;
  categories?: CategorySlug[];
  /** Price bounds in the *display* currency, major units. */
  minPrice?: number;
  maxPrice?: number;
  currency: CurrencyCode;
  minRating?: number;
  availability?: AvailabilityFilter[];
  onSale?: boolean;
  itemGroupSlug?: string;
  navLinkId?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: {
    categories: Record<CategorySlug, number>;
    availability: Record<AvailabilityFilter, number>;
  };
}

// ---------- Cart ----------

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
  addedAt: string;
}

export interface WishlistItem {
  productId: string;
  variantId?: string;
  addedAt: string;
}

// ---------- Currency ----------

export interface RateSnapshot {
  base: 'USD';
  rates: Record<CurrencyCode, number>;
  asOf: string;
  illustrative: boolean;
}

// ---------- Address / shipping ----------

export interface Address {
  fullName: string;
  phoneCountry: string; // ISO country code used for the dial prefix
  phone: string;
  country: string; // ISO 3166-1 alpha-2
  line1: string;
  line2?: string;
  /** Optional where the country has no city line (e.g. Singapore, Hong Kong). */
  city?: string;
  region?: string;
  postalCode?: string;
}

export interface SavedAddress extends Address {
  id: string;
  label: string;
  isDefault: boolean;
}

export type ShippingMethodId = 'standard' | 'express';

export interface ShippingQuote {
  id: ShippingMethodId;
  /** Amount in the requested display currency, minor units. */
  amount: Minor;
  minDays: number;
  maxDays: number;
}

export interface CartTotals {
  currency: CurrencyCode;
  itemCount: number;
  subtotal: Minor;
  discount: Minor;
  shipping: Minor | null;
  tax: Minor;
  taxRate: number;
  total: Minor;
}

// ---------- Orders ----------

export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethodPreview = 'cod' | 'card' | 'upi' | 'wallet';

export interface OrderLine {
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  name: Localized;
  variantLabel: Localized | null;
  image: ProductImage;
  unitPrice: Minor;
  quantity: number;
  lineTotal: Minor;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  date: string;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  userId?: string;
  email: string;
  phone: string;
  lines: OrderLine[];
  currency: CurrencyCode;
  rateSnapshot: RateSnapshot;
  subtotal: Minor;
  discount: Minor;
  couponCode?: string;
  shipping: Minor;
  tax: Minor;
  taxRate: number;
  total: Minor;
  shippingMethod: { id: ShippingMethodId; minDays: number; maxDays: number };
  address: Address;
  paymentMethod: PaymentMethodPreview;
  status: OrderStatus;
  timeline: OrderTimelineEntry[];
  tracking?: { carrier: string; number: string };
}

// ---------- Returns ----------

export type ReturnStatus =
  | 'requested' | 'approved' | 'rejected' | 'shipping_arranged'
  | 'in_transit' | 'received' | 'inspected' | 'refunded' | 'withdrawn' | 'closed';

export interface ReturnRequest {
  id: string;
  reference: string;
  orderId: string;
  lineId: string;
  requestedQty: number;
  approvedQty: number | null;
  receivedQty: number | null;
  acceptedQty: number | null;
  reason: string;
  customerNote: string | null;
  photos: string[];
  status: ReturnStatus;
  shippingMethod: string | null;
  customerCarrier: string | null;
  customerTracking: string | null;
  returnCarrier: string | null;
  returnTracking: string | null;
  refundableAmount: number;
  shippingFee: number;
  refundAmount: number | null;
  returnWindowDays: number;
  requestedAt: string;
  decidedAt: string | null;
  receivedAt: string | null;
  inspectedAt: string | null;
  refundedAt: string | null;
  rejectionReason: string | null;
  pickupAddress: string | null;
  events: Array<{ id: string; type: string; actor: string; message: string | null; createdAt: string }>;
  refund: { id: string; amount: number; method: string; status: string; reference: string | null; completedAt: string | null } | null;
}

// ---------- Account ----------

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}
