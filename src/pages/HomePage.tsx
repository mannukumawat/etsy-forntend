import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductCard';
import { HeroSlider, type HeroSlide } from '@/components/layout/HeroSlider';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { productService } from '@/services/productService';
import type { Product } from '@/types';
import type { PublicItemGroup } from '@/api/itemGroups';

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  const id = `sec-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="container-site mt-10 lg:mt-12">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-sand-200 pb-3">
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
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

function ItemGroupSection({ group }: { group: PublicItemGroup & { products: Product[] } }) {
  return (
    <Section title={group.nameEn} link={{ to: `/shop?group=${group.slug}`, label: 'View all' }}>
      <ProductGrid products={group.products} />
    </Section>
  );
}

function ItemGroupSections() {
  const { data: groups } = useAsync('catalog:item-groups', () => productService.getItemGroupsWithProducts(10));
  if (!groups?.length) return null;
  return (
    <>
      {groups.map((g) => (
        <ItemGroupSection key={g.id} group={g} />
      ))}
    </>
  );
}

const FEATURED_PRODUCT_PATHS = [
  '/product/natural-wool-jute-kilim-rug-handwoven-charcoal-geometric-area-rug-reversible-bla',
  '/product/handwoven-wool-jute-kilim-rug-runner-boho-area-rug-hallway-runner-living-room-ru',
  '/product/handwoven-wool-jute-kilim-runner-rug-boho-hallway-stair-runner-entryway-rug-cust',
] as const;

const productPathOr = (href: string | undefined, fallback: string) =>
  href?.startsWith('/product/') ? href : fallback;

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80',
    title: 'Handcrafted Rugs & Home Decor',
    subtitle: 'Kilim rugs, jute runners, benches and cushion covers — handwoven by skilled artisans.',
    ctaLabel: 'Shop All Products',
    ctaHref: FEATURED_PRODUCT_PATHS[0],
    secondaryLabel: 'New Arrivals',
    secondaryHref: '/shop?sort=newest',
  },
  {
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80',
    title: 'Natural Fibres, Timeless Style',
    subtitle: 'Each piece is made using traditional techniques passed down through generations.',
    ctaLabel: 'Explore Collections',
    ctaHref: FEATURED_PRODUCT_PATHS[1],
  },
  {
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=80',
    title: 'Made in Jaipur with Love',
    subtitle: 'Direct from artisan workshops to your home — no middlemen, fair prices.',
    ctaLabel: 'Shop Rugs',
    ctaHref: FEATURED_PRODUCT_PATHS[2],
  },
];

export default function HomePage() {
  const loc = useLocalized();
  useDocumentTitle(null);
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const live = homepage?.content;

  const cmsSlides: HeroSlide[] = [];
  if (live?.hero) {
    cmsSlides.push({
      image: live.hero.image ?? FALLBACK_SLIDES[0].image,
      title: loc(live.hero.title) || FALLBACK_SLIDES[0].title,
      subtitle: loc(live.hero.subtitle) || undefined,
      ctaLabel: loc(live.hero.ctaLabel) || 'Shop All Products',
      ctaHref: productPathOr(live.hero.ctaHref, FEATURED_PRODUCT_PATHS[0]),
    });
  }
  for (const [index, s] of (live?.slides ?? []).entries()) {
    if (!s.image) continue;
    cmsSlides.push({
      image: s.image,
      title: loc(s.title) || undefined,
      subtitle: loc(s.subtitle) || undefined,
      ctaLabel: loc(s.ctaLabel) || undefined,
      ctaHref: productPathOr(s.ctaHref, FEATURED_PRODUCT_PATHS[(index + 1) % FEATURED_PRODUCT_PATHS.length]),
    });
  }
  const slides = cmsSlides.length > 0 ? cmsSlides : FALLBACK_SLIDES;

  return (
    <>
      <div className="container-site py-3">
        <HeroSlider slides={slides} autoplayMs={5000} linkWholeSlide />
      </div>
      <ItemGroupSections />
    </>
  );
}
