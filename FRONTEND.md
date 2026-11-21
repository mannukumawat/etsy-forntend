# Storefront — what's built

React + Vite customer storefront for a single-seller handmade-goods shop.
Languages: Deutsch, English (US/UK/IN), Español, Français, Italiano — no
Hindi in the UI. Money: USD base with admin-managed conversion rates for
display; actual checkout totals are always server-computed. Runs only against
the real backend API (`VITE_API_BASE_URL` is required — there is no bundled
mock catalogue and no silent fallback).

## Routes (40)

`/` home, `/shop`, `/category/:slug`, `/new-in`, `/collection/:slug`,
`/product/:slug`, `/cart`, `/checkout` (4-step: details → shipping → payment
→ review), `/order/success/:orderId`, `/order/payment-failed`, `/login`,
`/register`, `/forgot-password`, `/reset-password`, `/account`,
`/account/orders[/:id]`, `/account/orders/:id/review/:productId`,
`/account/returns`, `/account/returns/:ref`, `/account/exchanges/:ref`,
`/account/bank-upi`, `/account/addresses`, `/account/profile`,
`/account/payments`, `/account/wallet`, `/account/notifications`, `/wishlist`,
`/track-order`, `/help`, `/help/:category`, `/help/:category/:article`,
`/about`, `/contact`, `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms`.

Account routes are protected by `RequireAuth` (logged-out visitors are sent
to `/login?redirect=…`). There is no `/account/bank-accounts` route: bank
accounts are managed inside the linked `/account/bank-upi` page, which embeds
bank-account add/remove alongside UPI IDs.

## Page / *PageContent rule

`src/pages/` holds route components only. A page file is either:

- the full page implementation (when it is the only implementation), or
- a one-line re-export of a `*PageContent` component in `src/components/`
  (used for the larger account/checkout/help pages).

Shared non-page components (shells, layouts) live under `src/components/`,
never under `src/pages/`. No page is split without a `*PageContent`
counterpart, and no `*PageContent` exists without a page re-exporting it.

## Navigation

- Header's secondary row starts with a **Categories** button opening a
  scrollable dropdown of every category — `src/components/layout/CategoriesMenu.tsx`.
- Same row also renders published collections marked **Show in storefront
  navigation** in admin, followed by custom secondary links from
  `/api/nav-links`. Collections keep their admin display order and open
  `/collection/:slug`.
- Mobile nav (`MobileMenu.tsx`) includes the same selected collections and
  custom links, followed by the live category list. The notifications bell
  (with unread badge) is in the header on desktop and mobile.

## Collections

`/collection/:slug` → `CollectionPage.tsx`, fetches `/api/collections/:slug`.
Admin can opt a published collection into storefront navigation; products and
ordering are managed in its sections. Renders: coloured hero (+ optional
image) with title/subtitle, circular links row (to categories/other
collections/URLs), optional description, then each named product section with
its own "Show more" (client-side, 8 at a time). A collection with no circles
and one section (e.g. Top Gifts) renders as a plain curated listing; one with
circles and several sections (e.g. Wedding Guide) renders as a full landing
page — same component either way.

## Category page

`/category/:slug` → `ShopPage.tsx`: heading, banner, filters, sort, infinite
scroll, real products from the live catalog API. Categories (name, description,
banner) come from the live Category API, synced at boot
(`src/data/categories.ts` + `main.tsx`).

## Checkout (server-verified)

Cart/catalog preview stays client-side for responsiveness; the **actual charge
is always computed server-side** (`/api/checkout/totals` for preview,
`/api/checkout/orders` for placement) — the client never sends a trusted
total. Idempotent placement (safe to retry), stock and coupon limits enforced
under concurrent requests. Payment is **prepaid only**: card/UPI through the
Razorpay modal, or the store wallet (full wallet payment, or partial wallet +
Razorpay for the remainder). There is **no Cash on Delivery** — no COD option,
no unpaid-order path, and the default payment method is `card` (wallet when
Razorpay is unconfigured and the customer is signed in). A genuine in-modal
payment failure is reported as declined (`payment.failed`), a dismiss as
cancelled, and each routes to `/order/payment-failed?reason=…`.

## Customer account

Real httpOnly session (auto-restored on refresh, graceful sign-out on
expiry), profile edit, saved addresses (country-aware validation,
auto-default), wishlist (local for anonymous visitors, synced to the account
once signed in, never shared between accounts), full password-reset flow
(`/forgot-password` → emailed link → `/reset-password`). Registration creates
a real backend account; there is no demo account. Bank accounts and UPI IDs
for refunds live on `/account/bank-upi`; refund history on
`/account/payments`; wallet with Add Money on `/account/wallet`.

## Coupons

Cart page applies a backend-validated coupon code
(`/api/checkout/validate-coupon`) — there is no hardcoded demo code.

## Product cards

Sale badges are real (live `salePrice` from the database). Star ratings are
real: average/count of published, verified-purchase reviews (fractional
stars). Product page Reviews tab: average, 5→1 breakdown (click to filter),
newest/highest/lowest sort, pagination, verified badge, and the signed-in
customer's write/edit/delete panel (login-required / not-eligible / hidden
states). Delivered orders show a "Write a review" link per item.

## Branding

Single-seller throughout (`src/config/store.ts`), name/tagline/contact/social
admin-editable and live-wired via `useSiteSettings` (from `/api/settings`).
Theme: ivory `#FAF7F2`, brand `#A64B32`, Cormorant Garamond + Inter,
light-only, Lucide icons only, no numbered pagination (Shop: infinite scroll;
wallet transactions and hub pages: "Show more").

## Not built

Subcategories, a second curated-listing page type beyond Collections
(Collections cover both the landing-page and flat-listing cases), live
shipping-rate wiring in the checkout UI (still the static illustrative table
— the actual charge is correct regardless).

## Region, language and currency

Header globe button opens an Etsy-style "Update your settings" dialog: Region
(countries the store ships to), Language (Deutsch, English UK/IN/US, Español,
Français, Italiano — no Hindi), Currency (USD/GBP/EUR/INR). Region suggests a
language and currency until the shopper picks their own. UI strings:
`src/locales/{en,de,fr,it,es}.ts`. Store content (products, categories,
homepage, nav, pages) comes translated from the API via the `x-lang` header;
missing translations fall back to English. Changing language reloads the page
so everything refetches in the new language. Admin can override UI strings
per language via `GET /api/i18n/:lng/translation`.
