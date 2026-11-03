import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { ShopBanner } from '@/components/layout/ShopBanner';
import { ShopProfile } from '@/components/layout/ShopProfile';
import type { BannerSlide } from '@/components/layout/ShopBanner';
import { CATEGORIES, STORY_IMAGE } from '@/data/categories';
import { API_MODE } from '@/api/config';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { productService } from '@/services/productService';
import type { Product } from '@/types';

function Section({ title, sub, link, children }: { title: string; sub?: string; link?: { to: string; label: string }; children: ReactNode }) {
  const id = `sec-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="container-site mt-16 lg:mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 id={id} className="text-3xl lg:text-4xl">
            {title}
          </h2>
          {sub && <p className="mt-1 text-ink-muted">{sub}</p>}
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
  return <ProductGrid products={products} />;
}

export default function HomePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  useDocumentTitle(null);
  const { data, isLoading, isError, reload } = useAsync('catalog:collections', () => productService.getCollections());
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const { data: apiCategories } = useAsync(API_MODE ? 'catalog:categories' : null, () => productService.listCategories());
  const live = homepage?.content;

  // In API_MODE use backend categories; fall back to bundled static data in mock mode
  const categories = API_MODE ? (apiCategories ?? []) : CATEGORIES;

  // Banner slides: prefer admin-set images, fall back to the Jaipur banner + category art
  const bannerSlides: BannerSlide[] = live?.bannerSlides?.length
    ? live.bannerSlides
    : [
        { image: '/banner-jaipur.webp', ctaHref: '/shop' },
        ...categories.map((cat) => ({ image: cat.banner, ctaHref: `/category/${cat.slug}` })),
      ];

  const storyImage = live?.story.image ?? STORY_IMAGE;
  const storyCtaLabel = live ? loc(live.story.ctaLabel) : t('home.storyCta');
  const storyCtaHref = live?.story.ctaHref || '/about';
  const newsletterTitle = live ? loc(live.newsletter.title) : t('home.newsletterTitle');
  const newsletterBody = live ? loc(live.newsletter.body) : t('home.newsletterBody');

  return (
    <>
      {/* Shop banner + profile — full-width, outside container */}
      <ShopBanner slides={bannerSlides} />
      <ShopProfile />


      {/* Categories — only when there are categories to show */}
      {categories.length > 0 && (
        <Section title={t('home.categoriesHeading')}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
                  <span className="block aspect-square w-full max-w-[200px] overflow-hidden rounded-full bg-sand-100 ring-1 ring-sand-200 transition-shadow group-hover:shadow-lift">
                    <img src={c.image.src} alt="" width={400} height={400} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                  </span>
                  <span className="mt-3 font-medium text-ink group-hover:underline">{loc(c.name)}</span>
                  <span className="mt-1 hidden max-w-[220px] text-sm text-ink-muted md:block">{loc(c.description)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(!API_MODE || (data?.featured?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.featuredHeading')} sub={t('home.featuredSub')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.featured} loading={isLoading} error={isError} onRetry={reload} count={8} />
        </Section>
      )}

      {(!API_MODE || (data?.bestsellers?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.bestsellersHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.bestsellers} loading={isLoading} error={isError} onRetry={reload} count={4} />
        </Section>
      )}

      {/* Brand story — only when admin has set content or in mock mode */}
      {(!API_MODE || live) && (
        <section aria-labelledby="story-title" className="container-site mt-16 lg:mt-24">
          <div className="grid items-center gap-8 overflow-hidden rounded-2xl bg-sage-100 md:grid-cols-2">
            <img src={storyImage} alt="" width={1200} height={900} loading="lazy" className="h-full max-h-[460px] w-full object-cover" />
            <div className="px-6 pb-10 md:py-12 md:pr-12 lg:pr-16">
              <p className="eyebrow">{t('home.storyEyebrow')}</p>
              <h2 id="story-title" className="mt-3 text-4xl leading-tight">
                {live ? loc(live.story.title) : t('home.storyTitle')}
              </h2>
              <div className="prose-store mt-4 text-ink-soft">
                {live ? (
                  <p>{loc(live.story.body)}</p>
                ) : (
                  <>
                    <p>{t('home.storyBody1')}</p>
                    <p>{t('home.storyBody2')}</p>
                  </>
                )}
              </div>
              <ButtonLink to={storyCtaHref} variant="outline" className="mt-6">
                {storyCtaLabel}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {(!API_MODE || (data?.newArrivals?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.newHeading')} link={{ to: '/shop?sort=newest', label: t('common.viewAll') }}>
          <Collection products={data?.newArrivals} loading={isLoading} error={isError} onRetry={reload} count={4} />
        </Section>
      )}

      {/* Newsletter — only when admin has set content or in mock mode */}
      {(!API_MODE || live) && (
        <section aria-labelledby="newsletter-title" className="container-site mt-16 lg:mt-24">
          <div className="rounded-2xl border border-sand-200 bg-white px-6 py-10 text-center shadow-card sm:px-10">
            <h2 id="newsletter-title" className="text-4xl">
              {newsletterTitle}
            </h2>
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
