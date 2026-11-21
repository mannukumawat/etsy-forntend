# Your Store — customer storefront (`frontend/`)

Customer-facing React frontend for a **single-seller** handmade-goods shop
(handmade Kilim rugs, jute floor coverings, cushion covers, throws and benches
from the Dignity ArtEdge studio in Jaipur). It runs against the real backend
API in `../backend` (Express + PostgreSQL). There is no mock service layer,
no bundled sample catalogue, and no demo data: without `VITE_API_BASE_URL`
the app shows a "configuration required" screen instead of starting.

## Quick start

Requires Node.js 18+ (tested on Node 24). Run everything from this `frontend/`
folder — it has its own `package.json`, lockfile and `node_modules`, and does
not depend on `../admin` or `../backend` at build time (it calls the backend
over HTTP at runtime).

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (strict port)
npm test           # unit tests (pricing, money, stock, address rules, cart, checkout session, images)
npm run typecheck  # tsc --noEmit
npm run build      # vite build to dist/ (production build only; run typecheck separately)
npm run preview    # serve dist/ on http://localhost:4173
```

Environment: copy `.env.example` to `.env.local`. The only required variable
is `VITE_API_BASE_URL` (the backend origin). `VITE_RAZORPAY_KEY_ID` is the
public Razorpay key used by the checkout modal — without it, card/UPI are
shown disabled and signed-in customers default to paying from the wallet.
`VITE_FIREBASE_*` are optional and only enable web-push notifications.

## What it does

- **Pages:** home, shop and category pages (search, filters, sort, infinite
  scroll, chips, mobile filter drawer), product details, cart and cart drawer,
  4-step checkout, order success and payment-failed pages, login, register,
  forgot password, account (profile, order history, order detail, address
  book, returns/exchanges, wallet, bank & UPI details, payments, notifications),
  wishlist, order tracking, About, Contact, FAQ, Shipping, Returns, Privacy,
  Terms, and a 404 page.
- **Checkout (server-verified):** the client never sends a trusted total.
  Totals are previewed via `POST /api/checkout/totals` and the order is
  placed via `POST /api/checkout/orders`. Payment is **prepaid only — there
  is no Cash on Delivery**: card/UPI through the Razorpay modal, or the store
  wallet (full payment, or partial wallet + Razorpay for the rest). Every
  placement carries an idempotency key; the key is only rotated when no
  payment was attempted, so retrying after a successful payment replays the
  same order instead of charging twice.
- **Money:** prices are stored once in USD minor units. Unit prices are
  converted with the admin-managed rates and rounded consistently (INR to
  whole rupees), then summed. Line totals, subtotal, discount, shipping, tax
  and total therefore always agree. Prices are formatted with
  `Intl.NumberFormat`, and totals show the currency code. Each order stores
  its own currency and a snapshot of the rate used when it was placed.
- **Coupons:** validated against the backend (`/api/checkout/validate-coupon`);
  there is no hardcoded demo coupon.
- **Accounts:** real httpOnly session (auto-restored on refresh, graceful
  sign-out on expiry), profile edit, saved addresses (country-aware
  validation, auto-default, map/geolocation picker), wishlist (local for
  anonymous visitors, synced to the account once signed in), full
  password-reset flow (`/forgot-password` → emailed link → `/reset-password`).
  Registration creates a real backend account. There is no demo account.
- **Orders:** order tracking by order number + email, order detail with
  timelines, cancel/return/exchange flows, refund destination picker
  (wallet, bank account, UPI, original payment method), and per-item reviews
  for delivered orders.
- **Notifications:** bell with unread badge (header, desktop and mobile) plus
  a full notifications page; push registration via Firebase is best-effort.
- **Variants:** choosing an option changes the gallery images. A full
  selection updates the price, stock and `?variant=` in the URL. Add to cart
  and Buy now are blocked until every option is chosen.
- **Stock:** quantity selectors are capped at available stock, with a maximum
  of 10 per line. Each variant gets its own cart line. The cart flags lines
  that are sold out, unavailable or over stock, and checkout stays blocked
  until they are fixed.
- **Address forms:** labels, required fields, postal-code formats and region
  dropdowns change per country (see `src/data/countries.ts`). For example:
  India uses State + PIN, the US uses State + ZIP, the UK uses County +
  Postcode, and the UAE uses Emirate with no postcode.
- **Languages:** Deutsch, English (US/UK/IN), Español, Français, Italiano —
  UI strings live in `src/locales/{de,en,es,fr,it}.ts`, with English as the
  fallback. There is no Hindi in the UI. Store content (products, categories,
  homepage, nav, pages) comes translated from the API via the `x-lang`
  header; missing translations fall back to English. Changing language reloads
  the page so everything refetches in the new language.
- **Pagination:** there is no numbered pagination anywhere. The Shop uses
  infinite scroll, hub/collection pages and the wallet transaction list use
  "Show more".
- **Accessibility:** semantic landmarks, skip link, visible focus rings,
  labelled inputs with linked error messages, accessible drawers and modals
  (focus trap, Escape, focus returns to the trigger), ARIA tabs and combobox,
  `aria-live` toasts, reduced-motion support, skeleton loaders, and a
  document title on every page.

### What is stored, and where

| Data | Where |
| --- | --- |
| Cart (product/variant IDs, quantities, coupon code) | `localStorage` key `ys-cart` |
| Wishlist | `localStorage` key `ys-wishlist` |
| Currency and delivery-country preference | `localStorage` key `ys-prefs` |
| Language | `localStorage` key `ys-lang` |
| Session | httpOnly cookie set by the backend; restored on refresh |
| Names, addresses, phone numbers, emails, orders | Backend database, via the API |
| Passwords and card data | **Never stored.** Card data is handled by Razorpay only. |

The cart is emptied only after the server confirms an order. Each checkout
attempt has an idempotency key, and the button is locked while a request is in
flight, so double-clicking cannot create two orders.

## Folder structure

```txt
src/
  api/         thin fetch layer over the backend (one module per resource);
               src/api/index.ts re-exports every module
  services/    facades over api/ (productService adds caching, orderService
               adds the Razorpay modal, authService/contentService delegate)
  store/       zustand stores: cart, wishlist, preferences (persisted); auth,
               checkout, UI, site settings (memory)
  hooks/       useAsync (fetch + cache), useCartDetails, useCountries, useDialog, …
  utils/       pure business logic: money, pricing, shipping, variants, cart,
               validation (zod), shop URL state — with unit tests
  components/  ui/ (buttons, forms, dialogs, feedback) · layout/ · product/ ·
               shop/ · cart/ · checkout/ · order/ · account/ · home/ · help/ · info/
  layouts/     MainLayout (header/footer/cart drawer/toasts), AccountLayout (+ auth guard)
  pages/       one file per route — either the full page, or a one-line
               re-export of a *PageContent component in components/ (see
               FRONTEND.md for the rule); never a shared non-page component
  routes/      router definition (code-split pages)
  locales/     de.ts, en.ts (source and fallback), es.ts, fr.ts, it.ts
  i18n/        i18next setup, language persistence, admin overrides
  types/       shared domain types, which mirror the API contract
  config/      store branding and limits
  data/        countries + shipping zones, currencies/rates (synced from /api/settings at boot)
```

Business logic (price conversion, totals, coupon, stock limits, address
rules) is kept in plain functions in `utils/`. Components do not contain it,
and the unit tests cover it.

## Customising

- **Brand name, tagline, contact details, social links:** `src/config/store.ts`
  and the admin-managed store settings from `/api/settings`. A social link
  with an empty URL is shown as a non-clickable placeholder.
- **Colours and fonts:** `tailwind.config.js` (`brand`, `ivory`, `ink`, `sand`
  tokens) and the font imports in `src/main.tsx`. The live theme is ivory
  `#FAF7F2`, brand `#A64B32`, Cormorant Garamond + Inter, light-only, Lucide
  icons only.
- **Categories:** from the backend (`GET /api/categories`, synced at boot in
  `src/data/categories.ts`). Products: `GET /api/products`.
- **Shipping zones, rates, country address formats:** `src/data/countries.ts`,
  synced from `/api/settings` at boot. Currency rates: `src/data/currencies.ts`,
  also synced from settings.
- **Copy and policies:** `src/locales/en.ts` (plus the other four locales) for
  UI copy; policy/help page content is admin-published via the API.

## Deployment

`npm run build` produces a static single-page app in `dist/`. Configure the
host to serve `index.html` for unknown paths (SPA fallback — see
`vercel.json`) so client routes such as `/product/...` work on refresh. The
backend must be reachable at `VITE_API_BASE_URL` with CORS and the session
cookie configured for the storefront origin.
