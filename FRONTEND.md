# Storefront — what's built

React + Vite customer storefront. EN/Hindi, USD/INR/EUR/GBP (illustrative fixed rates for display; actual checkout totals are always server-computed). Connects to the real backend when `VITE_API_BASE_URL` is set; otherwise runs on a bundled mock catalog/data set with identical behaviour.

## Routes
`/` home, `/shop`, `/category/:slug`, `/collection/:slug` (new), `/product/:slug`, `/cart`, `/checkout` (4-step: details → shipping → payment → review), `/order/success/:orderId`, `/order/payment-failed`, `/login`, `/register`, `/forgot-password`, `/reset-password` (new), `/account`, `/account/orders[/:id]`, `/account/addresses`, `/wishlist`, `/track-order`, `/about`, `/contact`, `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms`.

## Navigation (new)
- Header's secondary row now starts with a **Categories** button opening a scrollable dropdown of every category (was: flat inline links) — `src/components/layout/CategoriesMenu.tsx`.
- Same row also renders published collections marked **Show in storefront navigation** in admin, followed by custom secondary links from `/api/nav-links`. Collections keep their admin display order and open `/collection/:slug`.
- Mobile nav (`MobileMenu.tsx`) includes the same selected collections and custom links, followed by the live category list.

## Collections (new)
`/collection/:slug` → `CollectionPage.tsx`, fetches `/api/collections/:slug`. Admin can opt a published collection into storefront navigation; products and ordering are managed in its sections. Renders: coloured hero (+ optional image) with title/subtitle, circular links row (to categories/other collections/URLs), optional description, then each named product section with its own "Show more" (client-side, 8 at a time). A collection with no circles and one section (e.g. Top Gifts) renders as a plain curated listing; one with circles and several sections (e.g. Wedding Guide) renders as a full landing page — same component either way.

## Category page
`/category/:slug` → `ShopPage.tsx`: heading, banner, filters, sort, pagination, real products from the live catalog API. The category's own name/description/banner still come from the bundled `data/categories.ts`, not the live Category API — an admin rename there won't show here (products listed under it are live either way). No subcategories exist (flat 4-category taxonomy).

## Checkout (server-verified)
Cart/catalog preview stays client-side for responsiveness; the **actual charge is always computed server-side** (`/api/checkout/totals` for preview, `/api/checkout/orders` for placement) — the client never sends a trusted total. Idempotent placement (safe to retry), stock and coupon limits enforced under concurrent requests. Only **cash on delivery** works today — card/UPI/wallet are shown but disabled with an explicit "gateway not configured" note, never faked as paid.

## Customer account (new)
Real httpOnly session (auto-restored on refresh, graceful sign-out on expiry), profile edit, saved addresses (country-aware validation, auto-default), wishlist (local for anonymous visitors, synced to the account once signed in, never shared between accounts), full password-reset flow (`/forgot-password` → emailed/dev-logged link → `/reset-password`). Seeded demo account (`demo@yourstore.example` / `DemoPass123`) still works via the existing "fill demo credentials" button.

## Coupons
Cart page applies a real backend-validated coupon code (`/api/checkout/validate-coupon`) — not the old hardcoded single demo code.

## Product cards
Sale badges are real (live `salePrice` from the database). Star ratings are real: average/count of published, verified-purchase reviews (fractional stars). Product page Reviews tab: average, 5→1 breakdown (click to filter), newest/highest/lowest sort, pagination, verified badge, and the signed-in customer's write/edit/delete panel (login-required / not-eligible / hidden states). Delivered orders show a "Write a review" link per item.

## Branding
Single-seller throughout (`src/config/store.ts`), name/tagline/contact/social admin-editable and live-wired via `useSiteSettings`.

## Not built
Subcategories, a second curated-listing page type beyond Collections (Collections cover both the landing-page and flat-listing cases), real review/rating display, live shipping-rate wiring in the checkout UI (still the static illustrative table — the actual charge is correct regardless).

## Region, language and currency
Header globe button opens an Etsy-style "Update your settings" dialog: Region (countries the store ships to), Language (Deutsch, English UK/IN/US, Español, Français, Italiano — no Hindi), Currency (USD/GBP/EUR/INR). Region suggests a language and currency until the shopper picks their own. UI strings: `src/locales/{en,de,fr,it,es}.ts`. Store content (products, categories, homepage, nav, pages) comes translated from the API via the `x-lang` header; missing translations fall back to English. Changing language reloads the page so everything refetches in the new language.
