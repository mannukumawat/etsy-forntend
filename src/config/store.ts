// Branding and store-level settings. Replace these values before launch.
// Everything here is placeholder content for the Phase 1 demo.

export const STORE = {
  name: 'Your Store',
  tagline: {
    en: 'Thoughtfully made for a kinder, brighter home.',
  },
  /** Sample contact details — clearly fictional. Replace before launch. */
  contact: {
    email: 'hello@yourstore.example',
    phone: '+91 00000 00000',
    address: 'Studio 4, Sample Lane, Jaipur, Rajasthan, India',
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

/** The one documented demo coupon. Pricing logic lives in utils/pricing.ts. */
export const DEMO_COUPON = {
  code: 'WELCOME10',
  percentOff: 10,
} as const;

/** Demo account — simulated sign-in only. Never reuse a real password here. */
export const DEMO_ACCOUNT = {
  email: 'demo@yourstore.example',
  password: 'DemoPass123',
} as const;

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_QTY_PER_LINE = 10;
