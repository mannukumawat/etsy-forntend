# Your Store — customer storefront (`frontend/`)

Customer-facing React frontend for a **single-seller** handmade-goods shop (ceramics, bags, jewellery, home decor).
Everything runs in the browser against an asynchronous **mock service layer** — there is no backend yet.

> Phase 1 (this repo): storefront with mock data · Phase 2: Node.js + Express + PostgreSQL API · Phase 3: admin panel.

## Quick start

Requires Node.js 18+ (tested on Node 24). Run everything from this `frontend/` folder — it has its own
`package.json`, lockfile and `node_modules`, and does not depend on `../admin` or `../backend`.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (strict port)
npm test           # unit tests (pricing, stock, address rules, orders, cart)
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ on http://localhost:4173
```

Environment: copy `.env.example` to `.env.local` if you need overrides. Optional: set `VITE_MOCK_FAILURE_RATE=0.2` in `.env.local` to make ~20% of mock requests fail, so you can see the error and retry states.

## Demo cheat sheet

| What | How |
| --- | --- |
| Demo account | `demo@yourstore.example` / `DemoPass123` — or click **Fill in demo credentials** on `/login`. It has 3 sample orders and 2 saved addresses. |
| Other accounts | `/register` creates an account **in memory only**. The password is checked for strength and then thrown away; it is never stored. |
| Coupon | `WELCOME10` gives 10% off the subtotal. Codes are case-insensitive. |
| Payment | At checkout step 3, choose **Payment succeeds**, **Card is declined** or **Customer cancels**. There are no card fields, and nothing is charged. |
| Order tracking | `/track-order` with `YS-240342` + `demo@yourstore.example`, or any order you placed in this tab. |
| Stock states | Low stock: Blush mug (3), bud vase (4), jute clutch (3). Sold out: teapot and jhumka earrings (every variant), plus some single variants such as the Charcoal mug, the Set of 4 plates and the 20-inch chain. |
| Unsupported destination | Brazil, Mexico, South Africa and Nigeria show the "we don't ship here yet" state. |

## Features

- **Pages:** home, shop and category pages (search, filters, sort, pagination, chips, mobile filter drawer), product details, cart and cart drawer, 4-step checkout, order success and payment-failed pages, login, register, forgot password, account (profile, order history, order detail, address book), wishlist, order tracking, About, Contact, FAQ, Shipping, Returns, Privacy, Terms, and a 404 page.
- **Variants:** choosing a colour changes the gallery images. A full selection updates the price, stock and `?variant=` in the URL. Add to cart and Buy now are blocked until every option is chosen.
- **Stock:** quantity selectors are capped at available stock, with a maximum of 10 per line. Each variant gets its own cart line. The cart flags lines that are sold out, unavailable or over stock, and checkout stays blocked until they are fixed.
- **Money:** prices are stored once in USD minor units. Unit prices are converted with fixed, illustrative rates and rounded consistently (INR to whole rupees), then summed. Line totals, subtotal, discount, shipping, demo tax and total therefore always agree. Prices are formatted with `Intl.NumberFormat`, and totals show the currency code.
- **Orders:** each order stores its own currency and a snapshot of the rate used when it was placed.
- **Address forms:** labels, required fields, postal-code formats and region dropdowns change per country (see `src/data/countries.ts`). For example: India uses State + PIN, the US uses State + ZIP, the UK uses County + Postcode, and the UAE uses Emirate with no postcode.
- **Languages:** English and Hindi cover all UI strings, validation messages and product content. Missing keys fall back to English; the Privacy and Terms pages show this on purpose. The language choice is saved.
- **Accessibility:** semantic landmarks, skip link, visible focus rings, labelled inputs with linked error messages, accessible drawers and modals (focus trap, Escape, focus returns to the trigger), ARIA tabs and combobox, `aria-live` toasts, reduced-motion support, skeleton loaders, and a document title on every page.

## What is simulated

Everything that would normally need a server is simulated:

- **Product, category, order and account APIs:** `src/services/*` add 150–1400 ms latency over an in-memory "database" (`src/services/mockDb.ts`).
- **Authentication:** only the demo account's password is checked. Sessions live in memory, so refreshing the page signs you out.
- **Payment:** the success, decline and cancel outcomes are chosen by the user. No payment provider is called.
- **Shipping:** rates, delivery times, the tax estimate and currency rates are fixed, illustrative numbers.
- **Order status and tracking:** the 3 seeded orders show different statuses. New orders stay at "Order placed". Carrier details are placeholders.
- **Newsletter, contact form and password reset:** these show a confirmation that clearly says nothing was sent.
- **Reviews:** all reviews are labelled as sample content.
- **Product images:** these are generated SVG illustrations (`src/data/art.ts`), so the demo works offline and each colour variant gets its own image.

### What is stored, and where

| Data | Where |
| --- | --- |
| Cart (product/variant IDs, quantities, coupon code) | `localStorage` key `ys-cart` |
| Wishlist | `localStorage` key `ys-wishlist` |
| Currency and delivery-country preference | `localStorage` key `ys-prefs` |
| Language | `localStorage` key `ys-lang` |
| Names, addresses, phone numbers, emails, orders and the signed-in user | **Memory only.** Cleared on refresh. |
| Passwords and card data | **Never stored.** Card data is never collected at all. |

The cart is emptied only after the mock server confirms an order. Each checkout attempt has an idempotency key, and the button is locked while a request is in flight, so double-clicking cannot create two orders.

## Folder structure

```
src/
  config/      store branding, demo coupon, demo account, limits  ← rebrand here
  data/        catalogue (products, categories), countries + shipping zones, currencies/rates, SVG art
  services/    async mock API (products, orders, auth, newsletter/contact) + in-memory DB
  store/       zustand stores: cart, wishlist, preferences (persisted); auth, checkout, UI (memory)
  hooks/       useAsync (fetch + cache), useCartDetails, useMoney/useLocalized, useDialog, …
  utils/       pure business logic: money, pricing, shipping, variants, cart, validation (zod), shop URL state
  components/  ui/ (buttons, forms, dialogs, feedback) · layout/ · product/ · shop/ · cart/ · checkout/ · order/
  layouts/     MainLayout (header/footer/cart drawer/toasts), AccountLayout (+ auth guard)
  pages/       one file per route; checkout/ holds the four checkout steps
  routes/      router definition (code-split pages)
  locales/     en.ts (source and fallback), hi.ts
  i18n/        i18next setup and language persistence
  types/       shared domain types, which also define the future API contract
```

Business logic (price conversion, totals, coupon, stock limits, address rules) is kept in plain functions in `utils/`. Components do not contain it, and the unit tests cover it.

## Customising

- **Brand name, tagline, contact details, social links:** `src/config/store.ts`. A social link with an empty URL is shown as a non-clickable placeholder.
- **Colours and fonts:** `tailwind.config.js` (`brand`, `ivory`, `ink`, `sand` tokens) and the font imports in `src/main.tsx`.
- **Categories:** `src/data/categories.ts`. Products: `src/data/products.ts`. To use real photos, put image URLs in `images` / `variant.images`.
- **Shipping zones, rates, country address formats:** `src/data/countries.ts`. Currency rates: `src/data/currencies.ts`.
- **Copy and policies:** `src/locales/en.ts` and `src/locales/hi.ts`. The policy text is a **draft**, and every policy page says so. It needs review by the store owner, and by a legal adviser where needed, before launch.

## Deployment

`npm run build` produces a static single-page app in `dist/`. Configure the host to serve `index.html` for unknown
paths (SPA fallback) so client routes such as `/product/...` work on refresh.

## Known follow-up items (not yet fixed)

- Product gallery: previous/next arrows and the "1 / 3" counter sit below the image on tablet widths and slightly low on desktop (`src/components/product/ProductGallery.tsx`).
- Home page: "View all" under Bestsellers links to the unfiltered `/shop` (`src/pages/HomePage.tsx`).
- Shop price filter keeps its numbers when the currency changes, so the same numbers then mean a different currency.
- Product page perks row wraps awkwardly around 768px.
- The storefront still reads catalogue, settings, coupon and content data from local modules. Connecting it to the admin-managed data is part of the backend integration phase; the admin panel does not update this site.

## Phase 2: where the Node.js API connects

Each mock service function returns the same types a real endpoint should return. To switch, replace the body of each `mockRequest(() => …)` with a `fetch` call. Suggested endpoints, also listed as comments in each service file:

| Service | Endpoint |
| --- | --- |
| `productService.list` | `GET /api/products?q=&category=&minPrice=&maxPrice=&currency=&rating=&availability=&sort=&page=` |
| `productService.getBySlug` / `getByIds` / `getRelated` / `getCollections` | `GET /api/products/:slug`, `GET /api/products?ids=…`, `GET /api/products/:id/related`, `GET /api/collections` |
| `orderService.place` | `POST /api/orders` with an `Idempotency-Key` header. This should create a *pending* order and a payment intent. |
| — (new) | `POST /api/payments/webhook`: the payment gateway calls this to mark an order paid |
| `orderService.get` / `listForUser` / `track` | `GET /api/orders/:id`, `GET /api/me/orders`, `POST /api/orders/track` |
| `authService.*` | `POST /api/auth/login`, `/register`, `/forgot-password`, `/logout`; `GET/PATCH /api/me`; `/api/me/addresses` CRUD |
| `newsletterService` / `contactService` | `POST /api/newsletter`, `POST /api/contact` |

The backend **must** do the following, independently of the client:

- Recalculate prices, sale prices, discounts, shipping, tax and totals from its own catalogue and configuration. The client should send only IDs and quantities, as `orderService.place` already does.
- Check and reserve inventory inside a transaction, and enforce idempotency keys.
- Validate coupon codes and address and shipping eligibility for the destination.
- Treat an order as paid **only** after the payment gateway confirms it server-side, through a webhook or verified API call. Never trust a success redirect from the client.
- Own exchange rates and snapshot the rate on each order. The current fixed rates are only for the demo.
- Use httpOnly session cookies, hash passwords (for example with argon2 or bcrypt), rate-limit the auth, contact and track endpoints, and only show an order to its owner or to someone with a signed token. The demo's `/order/success/:id` page has no such check.
