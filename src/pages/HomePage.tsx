import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import { HomeHero } from '@/components/layout/HomeHero';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
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
  return <ProductGrid products={products.slice(0, count)} />;
}

export default function HomePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  useDocumentTitle(null);
  const { data, isLoading, isError, reload } = useAsync('catalog:collections', () => productService.getCollections());
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const { data: apiCategories } = useAsync('catalog:categories', () => productService.listCategories());
  const live = homepage?.content;

  const categories = apiCategories ?? [];
  const homepageCategories = (live?.featuredCategoryIds ?? [])
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is NonNullable<typeof category> => !!category);

  const storyImage = live?.story.image ?? null;
  const storyCtaLabel = loc(live?.story.ctaLabel);
  const storyCtaHref = live?.story.ctaHref;
  const newsletterTitle = loc(live?.newsletter.title);
  const newsletterBody = loc(live?.newsletter.body);

  return (
    <>
      {/* Hero — full-width, replaces old ShopBanner + ShopProfile */}
      <HomeHero />

      {/* Admin-selected products are the primary homepage content. */}
      {((data?.featured?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.featuredHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.featured} loading={isLoading} error={isError} onRetry={reload} count={12} />
        </Section>
      )}

      {((data?.newArrivals?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.newHeading')} link={{ to: '/shop?sort=newest', label: t('common.viewAll') }}>
          <Collection products={data?.newArrivals} loading={isLoading} error={isError} onRetry={reload} count={8} />
        </Section>
      )}

      {((data?.bestsellers?.length ?? 0) > 0 || isLoading) && (
        <Section title={t('home.bestsellersHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
          <Collection products={data?.bestsellers} loading={isLoading} error={isError} onRetry={reload} count={8} />
        </Section>
      )}

      {homepageCategories.length > 0 && (
        <section aria-labelledby="categories-heading" className="container-site mt-16 lg:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="categories-heading" className="text-3xl lg:text-4xl">{t('home.categoriesHeading')}</h2>
            <Link to="/shop" className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
            {homepageCategories.map((category) => (
              <li key={category.id} className="w-28 shrink-0 sm:w-auto">
                <Link to={`/category/${category.slug}`} className="group flex flex-col items-center gap-2 text-center">
                  <span className="block h-20 w-20 overflow-hidden rounded-full bg-sand-100 sm:h-24 sm:w-24">
                    {category.image.src && <img src={category.image.src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  </span>
                  <span className="text-sm font-medium text-ink group-hover:underline">{loc(category.name)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Brand story */}
      {live && (
        <section aria-labelledby="story-title" className="container-site mt-16 lg:mt-24">
          <div className="grid items-center gap-0 overflow-hidden rounded-2xl bg-sand-100 md:grid-cols-2">
            {storyImage && <img src={storyImage} alt="" width={1200} height={900} loading="lazy" className="h-full max-h-[460px] w-full object-cover" />}
            <div className="px-6 pb-10 md:py-12 md:pr-12 lg:pr-16">
              <h2 id="story-title" className="text-4xl leading-tight">
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
        <section aria-labelledby="newsletter-title" className="container-site mt-16 lg:mt-20">
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
