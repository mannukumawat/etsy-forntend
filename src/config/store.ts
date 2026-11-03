// Branding and store-level settings. Replace these values before launch.
// Everything here is placeholder content for the Phase 1 demo.

export const STORE = {
  name: 'Dignity ArtEdge',
  tagline: {
    en: 'Handcrafted rugs and home accents, made with care in Jaipur.',
  },
  location: 'Jaipur, Rajasthan',
  stats: { rating: 4.1, reviewCount: 45, salesCount: 214, yearsOnPlatform: 1 },
  contact: {
    email: 'hello@dignityartedge.com',
    phone: '+91 98765 43210',
    address: 'Jaipur, Rajasthan, India',
    hours: { en: 'Mon–Fri, 10:00–17:00 IST' },
  },
  /** Leave a URL empty to render a non-clickable placeholder. */
  social: {
    instagram: '',
    pinterest: '',
    facebook: '',
    youtube: '',
  },
  /** Origin country for shipping estimates (illustrative). */
  shipsFrom: 'IN',
  /** Business days to prepare an order before it ships. */
  handlingDays: { min: 1, max: 2 },
} as const;

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_QTY_PER_LINE = 10;
