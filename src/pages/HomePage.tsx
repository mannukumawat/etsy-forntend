import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe2, Hand, Leaf } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { CATEGORIES, HERO_IMAGE, STORY_IMAGE } from '@/data/categories';
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
  const live = homepage?.content;

  const perks = [
    { icon: Hand, label: t('home.perks.handmade') },
    { icon: Globe2, label: t('home.perks.worldwide') },
    { icon: Leaf, label: t('home.perks.packaging') },
  ];

  const heroImage = live?.hero.image ?? HERO_IMAGE;
  const heroCtaLabel = live ? loc(live.hero.ctaLabel) : t('home.heroCta');
  const heroCtaHref = live?.hero.ctaHref || '/shop';
  const storyImage = live?.story.image ?? STORY_IMAGE;
  const storyCtaLabel = live ? loc(live.story.ctaLabel) : t('home.storyCta');
  const storyCtaHref = live?.story.ctaHref || '/about';
  const newsletterTitle = live ? loc(live.newsletter.title) : t('home.newsletterTitle');
  const newsletterBody = live ? loc(live.newsletter.body) : t('home.newsletterBody');

  return (
    <>
      {/* Hero */}
      <section className="container-site pt-4 lg:pt-6" aria-labelledby="hero-title">
        <div className="relative overflow-hidden rounded-2xl bg-sand-100">
          <img
            src={heroImage}
            alt=""
            width={1600}
            height={760}
            {...{ fetchpriority: 'high' }}
            className="absolute inset-0 h-full w-full object-cover object-[78%_center] lg:object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ivory-50/95 via-ivory-50/70 to-transparent md:bg-gradient-to-r md:from-ivory-50/95 md:via-ivory-50/60 md:to-transparent" aria-hidden />
          <div className="relative flex min-h-[460px] flex-col justify-start px-6 py-10 sm:px-10 md:min-h-[440px] md:justify-center lg:min-h-[520px] lg:px-16">
            <h1 id="hero-title" className="max-w-lg text-5xl leading-[1.05] lg:text-6xl">
              {live ? (
                loc(live.hero.title)
              ) : (
                <>
                  {t('home.heroTitle1')}
                  <br />
                  {t('home.heroTitle2')}
                </>
              )}
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-soft lg:text-lg">{live ? loc(live.hero.subtitle) : t('home.heroBody')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to={heroCtaHref} size="lg">
                {heroCtaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/about" size="lg" variant="ghost" className="bg-white/60 backdrop-blur">
                {t('home.heroSecondary')}
              </ButtonLink>
            </div>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {perks.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm text-ink-soft">
              <Icon className="h-5 w-5 shrink-0 text-brand-700" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <Section title={t('home.categoriesHeading')}>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          {CATEGORIES.slice(0, 8).map((c) => (
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

      <Section title={t('home.featuredHeading')} sub={t('home.featuredSub')} link={{ to: '/shop', label: t('common.viewAll') }}>
        <Collection products={data?.featured} loading={isLoading} error={isError} onRetry={reload} count={8} />
      </Section>

      <Section title={t('home.bestsellersHeading')} link={{ to: '/shop', label: t('common.viewAll') }}>
        <Collection products={data?.bestsellers} loading={isLoading} error={isError} onRetry={reload} count={4} />
      </Section>

      {/* Brand story */}
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

      <Section title={t('home.newHeading')} link={{ to: '/shop?sort=newest', label: t('common.viewAll') }}>
        <Collection products={data?.newArrivals} loading={isLoading} error={isError} onRetry={reload} count={4} />
      </Section>

      {/* Newsletter */}
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
    </>
  );
}
