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
    <section aria-labelledby={id} className="container-site mt-14 lg:mt-18">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-sand-200 pb-4">
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-ink lg:text-3xl">{title}</h2>
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

const FALLBACK_SLIDES: HeroSlide[] = [
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
      ctaHref: live.hero.ctaHref || '/shop',
    });
  }
  if (live?.story?.image) {
    cmsSlides.push({
      image: live.story.image,
      title: loc(live.story.title) || 'Our Story',
      subtitle: loc(live.story.body)?.slice(0, 120) || undefined,
      ctaLabel: loc(live.story.ctaLabel) || 'Learn More',
      ctaHref: live.story.ctaHref || '/shop',
    });
  }
  const slides = cmsSlides.length > 0 ? cmsSlides : FALLBACK_SLIDES;

  return (
    <>
      <div className="container-site py-3">
        <HeroSlider slides={slides} autoplayMs={5000} />
      </div>
      <ItemGroupSections />
    </>
  );
}
