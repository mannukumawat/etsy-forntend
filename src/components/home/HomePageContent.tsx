import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductCard';
import { HeroSlider, type HeroSlide } from '@/components/layout/HeroSlider';
import { BrandedLoader } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <Section title={group.nameEn} link={{ to: `/shop?group=${group.slug}`, label: t('home.viewAll') }}>
      <ProductGrid products={group.products} />
    </Section>
  );
}

function ItemGroupSections() {
  const { data: groups, isLoading } = useAsync('catalog:item-groups:v3', () => productService.getItemGroupsWithProducts(5));
  if (isLoading) {
    return (
      <section className="container-site mt-6" aria-label="Loading products" aria-busy="true">
        <BrandedLoader />
      </section>
    );
  }
  if (!groups?.length) return null;
  return (
    <>
      {groups.map((group) => <ItemGroupSection key={group.id} group={group} />)}
    </>
  );
}

export default function HomePage() {
  const loc = useLocalized();
  useDocumentTitle(null);
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const live = homepage?.content;

  const slides: HeroSlide[] = [];
  if (live?.hero?.image) {
    slides.push({
      image: live.hero.image,
      title: loc(live.hero.title) || undefined,
      subtitle: loc(live.hero.subtitle) || undefined,
      ctaLabel: loc(live.hero.ctaLabel) || undefined,
      ctaHref: live.hero.ctaHref || undefined,
    });
  }
  for (const slide of live?.slides ?? []) {
    if (!slide.image) continue;
    slides.push({
      image: slide.image,
      title: loc(slide.title) || undefined,
      subtitle: loc(slide.subtitle) || undefined,
      ctaLabel: loc(slide.ctaLabel) || undefined,
      ctaHref: slide.ctaHref || undefined,
    });
  }

  return (
    <>
      {slides.length > 0 && (
        <div className="container-site py-3">
          <HeroSlider slides={slides} autoplayMs={5000} linkWholeSlide />
        </div>
      )}
      <ItemGroupSections />
    </>
  );
}
