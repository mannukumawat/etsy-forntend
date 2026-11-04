import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import { HeroSlider, type HeroSlide } from '@/components/layout/HeroSlider';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import {  fetchNavLinks } from '@/api';
import { contentService } from '@/services/contentService';
import { productService } from '@/services/productService';
import type { Product } from '@/types';
import type { PublicItemGroup } from '@/api/itemGroups';



/* ── Reusable section wrapper ────────────────────────────────────────── */
function Section({ title, sub, link, children }: { title: string; sub?: string; link?: { to: string; label: string }; children: ReactNode }) {
  const id = `sec-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="container-site mt-14 lg:mt-18">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-sand-200 pb-4">
        <div>
          <h2 id={id} className="text-2xl font-semibold tracking-tight text-ink lg:text-3xl">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-ink-muted">{sub}</p>}
        </div>
        {link && (
          <Link to={link.to} className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            {link.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Collection({ products, loading, error, onRetry, count }: { products?: Product[]; loading: boolean; error: boolean; onRetry: () => void; count: number }) {
  if (error) return <ErrorState onRetry={onRetry} />;
  if (loading || !products) return <ProductGridSkeleton count={count} />;
  return <ProductGrid products={products.slice(0, count)} />;
}

/* ── Category grid with counts (Etsy sidebar style) ─────────────────── */
function CategoriesWithCounts() {
  const loc = useLocalized();
  const { data: cats } = useAsync('catalog:categories-counts', () => productService.getCategoriesWithCounts());
  if (!cats?.length) return null;
  const active = cats.filter((c) => c.count > 0);
  if (!active.length) return null;
  return (
    <section aria-labelledby="shop-by-cat" className="container-site mt-14 lg:mt-18">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-sand-200 pb-4">
        <h2 id="shop-by-cat" className="text-2xl font-semibold tracking-tight text-ink lg:text-3xl">Shop by Category</h2>
        <Link to="/shop" className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
          All items <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {/* Two-column layout: category list left + featured image grid right */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Category list */}
        <ul className="divide-y divide-sand-100 rounded-xl border border-sand-200 bg-white">
          <li>
            <Link to="/shop" className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-sand-50">
              <span>All</span>
              <span className="ml-2 rounded-full bg-sand-100 px-2 py-0.5 text-xs font-bold text-ink-muted">{active.reduce((s, c) => s + c.count, 0)}</span>
            </Link>
          </li>
          {active.map((c) => (
            <li key={c.id}>
              <Link
                to={(c as { isOnSale?: boolean }).isOnSale ? '/shop?onSale=true' : `/category/${c.slug}`}
                className="flex items-center justify-between px-4 py-3 text-sm text-ink hover:bg-sand-50"
              >
                <span>{loc(c.name)}</span>
                <span className="ml-2 rounded-full bg-sand-100 px-2 py-0.5 text-xs font-bold text-ink-muted">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Category image cards */}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {active.filter((c) => !(c as { isOnSale?: boolean }).isOnSale).slice(0, 8).map((c) => (
            <li key={c.id}>
              <Link to={`/category/${c.slug}`} className="group block overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="aspect-square overflow-hidden bg-sand-100">
                  {c.image?.src ? (
                    <img src={c.image.src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-faint text-xs">{loc(c.name)}</div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="truncate text-xs font-semibold text-ink">{loc(c.name)}</span>
                  <span className="ml-1 shrink-0 text-xs text-ink-muted">{c.count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Nav-link product section (lazy, loads on demand) ────────────────── */
function NavLinkSection({ label, href }: { label: string; href: string }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    productService.getNavLinkProducts(href, 8).then(setProducts);
  }, [href]);
  if (products !== null && products.length === 0) return null;
  return (
    <Section title={label} link={{ to: href, label: 'View all' }}>
      {products === null ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductGrid products={products} />
      )}
    </Section>
  );
}

function NavLinkSections() {
  const loc = useLocalized();
  const { data: navLinks } = useAsync('nav-links', () => fetchNavLinks());
  if (!navLinks?.length) return null;
  // only /category/* links get a section (collection links handled separately)
  const catLinks = navLinks.filter((l) => /^\/category\//.test(l.href));
  return (
    <>
      {catLinks.map((l) => (
        <NavLinkSection key={l.id} label={loc(l.label)} href={l.href} />
      ))}
    </>
  );
}

/* ── Item group sections ─────────────────────────────────────────────── */
function ItemGroupSection({ group }: { group: PublicItemGroup & { products: Product[] } }) {
  const name = group.nameHi ? { en: group.nameEn, hi: group.nameHi } : group.nameEn;
  const loc = useLocalized();
  const label = typeof name === 'string' ? name : loc(name as { en: string; hi: string });
  return (
    <Section title={label} link={{ to: `/shop?group=${group.slug}`, label: 'View all' }}>
      <ProductGrid products={group.products} />
    </Section>
  );
}

function ItemGroupSections() {
  const { data: groups } = useAsync('catalog:item-groups', () => productService.getItemGroupsWithProducts(8));
  if (!groups?.length) return null;
  return (
    <>
      {groups.map((g) => (
        <ItemGroupSection key={g.id} group={g} />
      ))}
    </>
  );
}

/* ── Nav link products-by-id sections ────────────────────────────────── */
function NavLinkProductSection({ navLink }: { navLink: { id: string; label: { en: string; hi?: string }; href: string } }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const loc = useLocalized();
  useEffect(() => {
    productService.getNavLinkProductsById(navLink.id, 8).then(setProducts);
  }, [navLink.id]);
  if (products !== null && products.length === 0) return null;
  return (
    <Section title={loc(navLink.label)} link={{ to: navLink.href, label: 'View all' }}>
      {products === null ? <ProductGridSkeleton count={4} /> : <ProductGrid products={products} />}
    </Section>
  );
}

function NavLinkProductSections() {
  const { data: navLinks } = useAsync('nav-links', () => fetchNavLinks());
  if (!navLinks?.length) return null;
  // show sections for all active nav links that have products assigned by id
  return (
    <>
      {navLinks.map((l) => (
        <NavLinkProductSection key={`nl-${l.id}`} navLink={l} />
      ))}
    </>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  useDocumentTitle(null);
  const { data, isLoading, isError, reload } = useAsync('catalog:collections', () => productService.getCollections());
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const live = homepage?.content;

  const storyImage = live?.story.image ?? null;
  const storyCtaLabel = loc(live?.story.ctaLabel);
  const storyCtaHref = live?.story.ctaHref;
  const newsletterTitle = loc(live?.newsletter.title);
  const newsletterBody = loc(live?.newsletter.body);

  // Build slides from CMS hero + story sections
  const heroSlides: HeroSlide[] = [];
  if (live?.hero) {
    heroSlides.push({
      image: live.hero.image ?? 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80',
      title: loc(live.hero.title) || 'Handcrafted Rugs & Home Decor',
      subtitle: loc(live.hero.subtitle) || undefined,
      ctaLabel: loc(live.hero.ctaLabel) || 'Shop All Products',
      ctaHref: live.hero.ctaHref || '/shop',
    });
  }
  if (live?.story?.image) {
    heroSlides.push({
      image: live.story.image,
      title: loc(live.story.title) || 'Our Story',
      subtitle: loc(live.story.body)?.slice(0, 120) || undefined,
      ctaLabel: loc(live.story.ctaLabel) || 'Learn More',
      ctaHref: live.story.ctaHref || '/shop',
    });
  }
  // Fallback demo slides when no CMS data
  const slides: HeroSlide[] = heroSlides.length > 0 ? heroSlides : [
    {
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80',
      title: 'Handcrafted Rugs & Home Decor',
      subtitle: 'Kilim rugs, jute runners, benches and cushion covers — handwoven by skilled artisans.',
      ctaLabel: 'Shop All Products',
      ctaHref: '/shop',
      secondaryLabel: 'New Arrivals',
      secondaryHref: '/shop?sort=newest',
    },
    {
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80',
      title: 'Natural Fibres, Timeless Style',
      subtitle: 'Each piece is made using traditional techniques passed down through generations.',
      ctaLabel: 'Explore Collections',
      ctaHref: '/shop',
    },
    {
      image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=80',
      title: 'Made in Jaipur with Love',
      subtitle: 'Direct from artisan workshops to your home — no middlemen, fair prices.',
      ctaLabel: 'Shop Rugs',
      ctaHref: '/category/kilim-rugs',
    },
  ];

  return (
    <>
      <div className="px-[10px] pt-3">
        <HeroSlider slides={slides} autoplayMs={5000} />
      </div>
    

      {/* Featured */}
      {((data?.featured?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.featuredHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.featured} loading={isLoading} error={isError} onRetry={reload} count={12} />
        </Section>
      )}

      {/* Categories with counts — Etsy sidebar style */}
      <CategoriesWithCounts />

      {/* Nav link (category slug) sections */}
      <NavLinkSections />

      {/* Item group sections — admin-managed product groups */}
      <ItemGroupSections />

      {/* Nav link product sections — products assigned via navLinkId */}
      <NavLinkProductSections />

      {/* New arrivals */}
      {((data?.newArrivals?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.newHeading')} link={{ to: '/shop?sort=newest', label: t('common.viewAll') }}>
          <Collection products={data?.newArrivals} loading={isLoading} error={isError} onRetry={reload} count={8} />
        </Section>
      )}

      {/* Bestsellers */}
      {((data?.bestsellers?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.bestsellersHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.bestsellers} loading={isLoading} error={isError} onRetry={reload} count={8} />
        </Section>
      )}

      {/* Items */}
      {((data?.items?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.itemsHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.items} loading={isLoading} error={isError} onRetry={reload} count={12} />
        </Section>
      )}

      {/* Transfer */}
      {((data?.transfer?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.transferHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.transfer} loading={isLoading} error={isError} onRetry={reload} count={12} />
        </Section>
      )}

      {/* Brand story */}
      {live && (
        <section aria-labelledby="story-title" className="container-site mt-14 lg:mt-20">
          <div className="grid items-center gap-0 overflow-hidden rounded-2xl bg-sand-100 md:grid-cols-2">
            {storyImage && <img src={storyImage} alt="" width={1200} height={900} loading="lazy" className="h-full max-h-[460px] w-full object-cover" />}
            <div className="px-6 pb-10 md:py-12 md:pr-12 lg:pr-16">
              <h2 id="story-title" className="text-3xl font-semibold leading-tight lg:text-4xl">
                {loc(live.story.title)}
              </h2>
              <div className="prose-store mt-4 text-ink-soft">
                <p>{loc(live.story.body)}</p>
              </div>
              {storyCtaLabel && storyCtaHref && (
                storyCtaHref.startsWith('/') ? (
                  <ButtonLink to={storyCtaHref} variant="outline" className="mt-6">{storyCtaLabel}</ButtonLink>
                ) : (
                  <a href={storyCtaHref} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-ink/5">
                    {storyCtaLabel}
                  </a>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      {live && (
        <section aria-labelledby="newsletter-title" className="container-site mt-14 lg:mt-18 pb-20">
          <div className="rounded-2xl border border-sand-200 bg-white px-6 py-10 text-center shadow-card sm:px-10">
            <h2 id="newsletter-title" className="text-3xl font-semibold">{newsletterTitle}</h2>
            <p className="mx-auto mt-2 max-w-lg text-ink-muted">{newsletterBody}</p>
            <div className="mx-auto mt-6 max-w-md text-left">
              <NewsletterForm id="home-newsletter" tone="card" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
