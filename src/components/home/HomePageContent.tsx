import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Heart, Instagram, Leaf, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { StoreReviews } from '@/components/product/StoreReviews';
import { HeroSlider, type HeroSlide } from '@/components/layout/HeroSlider';
import { Skeleton } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { productService } from '@/services/productService';
import type { Product } from '@/types';
import type { PublicItemGroup } from '@/api/itemGroups';

function Section({
  title,
  subtitle,
  link,
  children,
}: {
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
  children: ReactNode;
}) {
  const id = `sec-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="container-site mt-14 lg:mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-3">
        <div>
          <h2 id={id} className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link.to} className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:underline">
            {link.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Infinite Running Marquee / Ticker with gold sparklers */
function InfiniteMarquee() {
  const { t } = useTranslation();
  const badges = [
    t('home.marqueeHandmade', { defaultValue: 'HANDMADE IN SMALL BATCHES' }),
    t('home.marqueePackaging', { defaultValue: '100% PLASTIC-FREE PACKAGING' }),
    t('home.marqueeDelivery', { defaultValue: 'TRACKED WORLDWIDE DELIVERY' }),
    t('home.marqueeExchanges', { defaultValue: '30-DAY EASY EXCHANGES' }),
    t('home.marqueeEthical', { defaultValue: 'ETHICALLY SOURCED MATERIALS' }),
    t('home.marqueeSmallBatch', { defaultValue: 'AUTHENTIC JAIPUR CRAFTSMANSHIP' }),
  ];

  const fullList = [...badges, ...badges, ...badges, ...badges];

  return (
    <aside aria-label="Store highlights" className="relative w-full overflow-hidden border-y border-sand-200 bg-sand-100/70 py-3 sm:py-3.5">
      <div className="animate-marquee items-center gap-8 whitespace-nowrap text-[11px] font-semibold tracking-[0.16em] uppercase text-ink-soft sm:text-xs">
        {fullList.map((item, idx) => (
          <div key={idx} className="inline-flex items-center gap-8">
            <span className="flex items-center gap-2">
              <span className="text-brand-600 font-bold">✦</span>
              {item}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/** Deluxe Circular Category Bubbles with Counts */
function CategoryBubbles() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { data: categoriesWithCounts, isLoading } = useAsync('catalog:categories:counts', () =>
    productService.getCategoriesWithCounts(),
  );

  if (isLoading) {
    return (
      <div className="container-site mt-10">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter out any virtual categories and take top 6
  const items = (categoriesWithCounts ?? []).filter((c) => c.slug !== '__on_sale__').slice(0, 6);
  if (!items.length) return null;

  return (
    <section aria-label={t('home.shopByCategory', { defaultValue: 'Shop by Category' })} className="container-site mt-12 sm:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
            {t('home.exploreCraft', { defaultValue: 'Explore the Studio' })}
          </span>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
            {t('home.shopByCategory', { defaultValue: 'Shop by Category' })}
          </h2>
        </div>
        <Link to="/shop" className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:underline">
          {t('home.allCategories', { defaultValue: 'Browse All Categories' })} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="scrollbar-none mt-8 flex snap-x gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:gap-6 md:grid-cols-6">
        {items.map((cat) => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className="group flex w-32 shrink-0 snap-start flex-col items-center text-center transition sm:w-auto"
          >
            <span className="relative block h-28 w-28 overflow-hidden rounded-full bg-sand-100 p-1.5 shadow-sm ring-2 ring-sand-200 transition-all duration-300 group-hover:scale-105 group-hover:ring-brand-600 group-hover:shadow-md sm:h-32 sm:w-32 lg:h-36 lg:w-36">
              <img
                src={cat.image?.src || '/favicon.png'}
                alt={loc(cat.name)}
                loading="lazy"
                className="h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
            <span className="mt-3 font-serif text-sm font-semibold text-ink transition-colors group-hover:text-brand-700 sm:text-base">
              {loc(cat.name)}
            </span>
            {cat.count > 0 && (
              <span className="mt-1 rounded-full bg-sand-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-muted group-hover:bg-sand-200">
                {t('home.piecesCount', { count: cat.count, defaultValue: `${cat.count} Pieces` })}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Interactive Tabbed Showcase ("The Artisan Collection") */
function InteractiveTabbedShowcase() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'bestsellers' | 'newArrivals' | 'jewellery' | 'ceramics' | 'bags'>('bestsellers');

  const { data: collections, isLoading: loadingCollections } = useAsync('catalog:collections:home', () =>
    productService.getCollections(),
  );

  const { data: allProducts, isLoading: loadingAll } = useAsync('catalog:products:all', () =>
    productService.preloadCatalog(),
  );

  const isLoading = loadingCollections || loadingAll;

  const tabs: Array<{ id: typeof activeTab; label: string; icon: typeof Sparkles }> = [
    { id: 'bestsellers', label: t('home.tabBestsellers', { defaultValue: 'Bestsellers' }), icon: Flame },
    { id: 'newArrivals', label: t('home.tabNew', { defaultValue: 'Fresh Arrivals' }), icon: Sparkles },
    { id: 'jewellery', label: t('home.tabJewellery', { defaultValue: 'Jewellery' }), icon: Heart },
    { id: 'ceramics', label: t('home.tabCeramics', { defaultValue: 'Ceramics' }), icon: Leaf },
    { id: 'bags', label: t('home.tabBags', { defaultValue: 'Artisan Bags' }), icon: ShieldCheck },
  ];

  let displayProducts: Product[] = [];
  let tabHref = '/shop';

  if (!isLoading && allProducts) {
    if (activeTab === 'bestsellers') {
      displayProducts = (collections?.bestsellers?.length ? collections.bestsellers : allProducts.filter((p) => p.isBestseller)).slice(0, 8);
      tabHref = '/shop?sort=featured';
    } else if (activeTab === 'newArrivals') {
      displayProducts = (collections?.newArrivals?.length ? collections.newArrivals : allProducts.filter((p) => p.isNew)).slice(0, 8);
      tabHref = '/new-in';
    } else {
      displayProducts = allProducts.filter((p) => p.categoryId === activeTab).slice(0, 8);
      tabHref = `/category/${activeTab}`;
    }
  }

  return (
    <section className="container-site mt-16 sm:mt-20" aria-label="Curated Collection Showcase">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-800">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          {t('home.curatedCollectionTag', { defaultValue: 'Handpicked Editions' })}
        </span>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t('home.tabSectionTitle', { defaultValue: 'The Artisan Showcase' })}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
          {t('home.tabSectionSubtitle', {
            defaultValue: 'Discover small-batch treasures crafted by traditional master artisans.',
          })}
        </p>

        {/* Tab Pills Switcher */}
        <div className="scrollbar-none mt-6 flex max-w-full snap-x gap-2 overflow-x-auto rounded-full bg-sand-100/90 p-1.5 shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  isActive
                    ? 'bg-ink text-white shadow-sm ring-1 ring-ink'
                    : 'text-ink-soft hover:bg-sand-200/80 hover:text-ink'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-300' : 'text-ink-muted'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Tab Products */}
      <div className="mt-8">
        {isLoading ? (
          <ProductGridSkeleton count={8} columns={4} />
        ) : displayProducts.length > 0 ? (
          <ProductGrid products={displayProducts} columns={4} />
        ) : (
          <div className="rounded-2xl border border-dashed border-sand-300 py-12 text-center text-sm text-ink-muted">
            {t('home.noProductsFound', { defaultValue: 'No products in this collection yet.' })}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to={tabHref}
          className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-6 py-2.5 text-xs font-semibold text-ink shadow-xs transition hover:border-brand-600 hover:text-brand-700 sm:text-sm"
        >
          {t('home.viewEntireTab', { defaultValue: 'Explore All in This Collection' })}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/** Editorial Bento-Grid Magazine-Style Tiles */
function EditorialBentoGrid() {
  const { t } = useTranslation();

  return (
    <section className="container-site mt-16 sm:mt-24" aria-label="Curated Lifestyle Collections">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
            {t('home.bentoEyebrow', { defaultValue: 'Editorial Curations' })}
          </span>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
            {t('home.bentoTitle', { defaultValue: 'Stories in Clay, Metal & Fiber' })}
          </h2>
        </div>
        <Link to="/shop" className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:underline">
          {t('common.viewAll', { defaultValue: 'View all' })} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        {/* Large Tile: Ceramics */}
        <Link
          to="/category/ceramics"
          className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl bg-sand-900 p-6 text-white shadow-sm transition hover:shadow-xl sm:p-8 lg:col-span-7 lg:min-h-[440px]"
        >
          <img
            src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80"
            alt="Wheel-thrown ceramics"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-amber-300 backdrop-blur-sm border border-amber-300/30">
              {t('home.bentoDaily', { defaultValue: '✦ DAILY RITUALS' })}
            </span>
            <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl lg:text-4xl">
              {t('home.bentoCeramicsTitle', { defaultValue: 'Wheel-Thrown Stoneware' })}
            </h3>
            <p className="mt-2 max-w-md text-xs text-sand-100 sm:text-sm">
              {t('home.bentoCeramicsDesc', {
                defaultValue: 'Earth-toned mugs, bowls and sculptural vases thrown on the wheel and finished with satin glazes.',
              })}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-200 transition group-hover:translate-x-1 sm:text-sm">
              {t('home.exploreCeramics', { defaultValue: 'Explore Ceramics' })} <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Medium Tile: Jewellery */}
        <Link
          to="/category/jewellery"
          className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl bg-amber-950 p-6 text-white shadow-sm transition hover:shadow-xl sm:p-8 lg:col-span-5 lg:min-h-[440px]"
        >
          <img
            src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80"
            alt="Handcrafted brass jewellery"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-emerald-300 backdrop-blur-sm border border-emerald-300/30">
              {t('home.bentoCurator', { defaultValue: '✦ CURATOR’S PICK' })}
            </span>
            <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">
              {t('home.bentoJewelleryTitle', { defaultValue: 'Hammered Brass & Silver' })}
            </h3>
            <p className="mt-2 text-xs text-sand-100 sm:text-sm">
              {t('home.bentoJewelleryDesc', {
                defaultValue: 'Artisanal pendants and ear weights cut from recycled sheet metal and polished by hand.',
              })}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 transition group-hover:translate-x-1 sm:text-sm">
              {t('home.exploreJewellery', { defaultValue: 'Explore Jewellery' })} <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Bottom Tile 1: Bags */}
        <Link
          to="/category/bags"
          className="group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-3xl bg-stone-900 p-6 text-white shadow-sm transition hover:shadow-xl sm:p-7 lg:col-span-6 lg:min-h-[280px]"
        >
          <img
            src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
            alt="Handwoven canvas totes"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-sand-200/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase text-sand-100 backdrop-blur-sm">
              {t('home.bentoSlow', { defaultValue: '✦ SLOW TEXTILES' })}
            </span>
            <h3 className="mt-2 font-serif text-xl font-bold sm:text-2xl">
              {t('home.bentoBagsTitle', { defaultValue: 'Handwoven Canvas & Totes' })}
            </h3>
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sand-200 transition group-hover:translate-x-1">
              {t('home.exploreBags', { defaultValue: 'Explore Bags' })} <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Bottom Tile 2: Candles & Fragrance */}
        <Link
          to="/category/candles"
          className="group relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-3xl bg-neutral-900 p-6 text-white shadow-sm transition hover:shadow-xl sm:p-7 lg:col-span-6 lg:min-h-[280px]"
        >
          <img
            src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"
            alt="Hand-poured soy candles"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-sand-200/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase text-sand-100 backdrop-blur-sm">
              {t('home.bentoFragrance', { defaultValue: '✦ BOTANIC AROMAS' })}
            </span>
            <h3 className="mt-2 font-serif text-xl font-bold sm:text-2xl">
              {t('home.bentoCandlesTitle', { defaultValue: 'Hand-Poured Soy Candles' })}
            </h3>
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sand-200 transition group-hover:translate-x-1">
              {t('home.exploreCandles', { defaultValue: 'Explore Candles' })} <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

/** Maker's Story & Jaipur Artisan Heritage Section */
function MakerHeritageStory() {
  const { t } = useTranslation();

  return (
    <section className="container-site mt-16 sm:mt-24" aria-label="Maker's Heritage Story">
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-sand-100/60 p-6 sm:p-10 lg:p-14">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Visual Maker Photo */}
          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-sand-300">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80"
                alt="Artisan hands shaping pottery on the wheel"
                loading="lazy"
                className="aspect-4/3 w-full object-cover sm:aspect-square"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3.5 shadow-md backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-ink">Jaipur Craft Studio</p>
                    <p className="text-[11px] text-ink-muted">Handcrafted with Pride Since 2018</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Narrative & Metrics */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-800 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-brand-700" />
              {t('home.storyEyebrow', { defaultValue: 'The Art of Slow Living' })}
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t('home.storyTitle', { defaultValue: 'Crafted with Patience, Intention, and Soul.' })}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
              {t('home.storyBody', {
                defaultValue:
                  'In a world of fast mass production, we cherish the marks of the human hand — small textures, natural variations, and honest raw materials that make each piece uniquely yours. Every object is created in small batches to celebrate timeless slow living.',
              })}
            </p>

            {/* Three Key Metrics */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-y border-sand-200 py-4 sm:gap-6 sm:py-5">
              <div>
                <p className="font-serif text-xl font-bold text-ink sm:text-2xl">100%</p>
                <p className="mt-0.5 text-xs text-ink-muted">{t('home.storyStatsPlastic', { defaultValue: 'Plastic-Free Packaging' })}</p>
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-ink sm:text-2xl">24+</p>
                <p className="mt-0.5 text-xs text-ink-muted">{t('home.storyStatsFamilies', { defaultValue: 'Artisan Families' })}</p>
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-ink sm:text-2xl">4.9 ★</p>
                <p className="mt-0.5 text-xs text-ink-muted">{t('home.storyStatsRating', { defaultValue: 'Verified Global Rating' })}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 shadow-sm"
              >
                {t('home.storyCta', { defaultValue: 'Read our story' })}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-600 hover:text-brand-700 shadow-xs"
              >
                {t('home.storyContactCta', { defaultValue: 'Get in Touch' })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Value Proposition & Authenticity Cards */
function ValuesSection() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Sparkles,
      title: t('home.val1Title', { defaultValue: 'Handmade in Small Batches' }),
      desc: t('home.val1Desc', { defaultValue: 'Every piece carries the unique touch and fingerprint of its maker.' }),
    },
    {
      icon: Leaf,
      title: t('home.val2Title', { defaultValue: '100% Plastic-Free' }),
      desc: t('home.val2Desc', { defaultValue: 'Recyclable cardboard, paper tape and natural cotton drawstring pouches.' }),
    },
    {
      icon: Truck,
      title: t('home.val3Title', { defaultValue: 'Tracked Worldwide Delivery' }),
      desc: t('home.val3Desc', { defaultValue: 'Insured and carbon-neutral shipping straight to your doorstep.' }),
    },
    {
      icon: RotateCcw,
      title: t('home.val4Title', { defaultValue: '30-Day Easy Exchanges' }),
      desc: t('home.val4Desc', { defaultValue: 'Shop with complete peace of mind. Easy returns and size exchanges.' }),
    },
  ];

  return (
    <section className="container-site mt-16 sm:mt-24" aria-label="Our Values">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
          {t('home.valuesEyebrow', { defaultValue: 'Why Choose Us' })}
        </span>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
          {t('home.valuesTitle', { defaultValue: 'Conscious Craft, Ethical Living' })}
        </h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {values.map((v, i) => {
          const Icon = v.icon;
          return (
            <div
              key={i}
              className="group flex flex-col rounded-2xl border border-sand-200 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand-100 text-brand-700 transition-colors group-hover:bg-brand-50 group-hover:text-brand-800">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-serif text-base font-semibold text-ink sm:text-lg">{v.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted sm:text-sm">{v.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Studio Visual Photography & Instagram Gallery */
function StudioVisualGallery() {
  const { t } = useTranslation();

  const photos = [
    {
      src: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
      alt: 'Glazed studio bowls',
      title: 'Studio Ceramics',
    },
    {
      src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
      alt: 'Brass pendant necklace',
      title: 'Brass Leaves',
    },
    {
      src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      alt: 'Sunlit living room ceramics',
      title: 'Morning Sun',
    },
    {
      src: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=600&q=80',
      alt: 'Artisan crafting at bench',
      title: 'Hand Hammered',
    },
    {
      src: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      alt: 'Natural woven textile tote',
      title: 'Everyday Carry',
    },
  ];

  return (
    <section className="container-site mt-16 sm:mt-24" aria-label="Studio Community Gallery">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
            {t('home.galleryHandle', { defaultValue: '@dignityartedge' })}
          </span>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
            {t('home.galleryTitle', { defaultValue: 'Moments from the Studio' })}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t('home.gallerySubtitle', { defaultValue: 'Follow our craft journey, slow mornings & restock announcements' })}
          </p>
        </div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-xs transition hover:border-brand-600 hover:text-brand-700"
        >
          <Instagram className="h-4 w-4 text-brand-700" />
          {t('home.galleryFollow', { defaultValue: 'Follow on Instagram' })}
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {photos.map((item, idx) => (
          <div
            key={idx}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-sand-200 shadow-xs"
          >
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col items-center justify-center p-3 text-center text-white">
              <Instagram className="h-6 w-6 text-white mb-1.5" />
              <p className="font-serif text-xs font-bold">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemGroupSection({ group }: { group: PublicItemGroup & { products: Product[] } }) {
  const { t } = useTranslation();
  return (
    <Section title={group.nameEn} link={{ to: `/shop?group=${group.slug}`, label: t('common.viewAll', { defaultValue: 'View all' }) }}>
      <ProductGrid products={group.products} />
    </Section>
  );
}

function ItemGroupSections() {
  const { data: groups } = useAsync('catalog:item-groups:v3', () => productService.getItemGroupsWithProducts(5));
  if (!groups?.length) return null;
  return (
    <>
      {groups.map((group) => (
        <ItemGroupSection key={group.id} group={group} />
      ))}
    </>
  );
}

export default function HomePage() {
  const loc = useLocalized();
  const { t } = useTranslation();
  useDocumentTitle(null);
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const live = homepage?.content;

  const slides: HeroSlide[] = [];
  if (live?.hero?.image) {
    slides.push({
      image: live.hero.image,
      badge: t('home.heroBadge', { defaultValue: '⭐ 4.9/5 Rating from 1,200+ Happy Shoppers' }),
      title: loc(live.hero.title) || undefined,
      subtitle: loc(live.hero.subtitle) || undefined,
      ctaLabel: loc(live.hero.ctaLabel) || t('home.heroCta', { defaultValue: 'Explore Bestsellers' }),
      ctaHref: '/shop',
      secondaryLabel: t('home.heroSecondaryCta', { defaultValue: 'Discover Our Craft' }),
      secondaryHref: '/about',
    });
  }
  for (const slide of live?.slides ?? []) {
    if (!slide.image) continue;
    slides.push({
      image: slide.image,
      badge: t('home.heroBadge', { defaultValue: '⭐ 4.9/5 Rating from 1,200+ Happy Shoppers' }),
      title: loc(slide.title) || undefined,
      subtitle: loc(slide.subtitle) || undefined,
      ctaLabel: loc(slide.ctaLabel) || t('home.heroCta', { defaultValue: 'Shop Now' }),
      ctaHref: slide.ctaHref || '/shop',
      secondaryLabel: t('home.heroSecondaryCta', { defaultValue: 'Learn More' }),
      secondaryHref: '/about',
    });
  }

  return (
    <div className="pb-16 sm:pb-20">
      {/* 1. Hero Luxury Slider with Floating Proof Badge & Dual CTAs */}
      {slides.length > 0 && (
        <div className="container-site py-2 sm:py-3">
          <HeroSlider slides={slides} autoplayMs={6000} linkWholeSlide={false} />
        </div>
      )}

      {/* 2. Infinite Continuous Gold-Star Marquee / Ticker */}
      <InfiniteMarquee />

      {/* 3. Shop by Category (Etsy Luxe Circular Avatars with Item Counts) */}
      <CategoryBubbles />

      {/* 4. Interactive Tabbed Collection Showcase (Instant Switcher) */}
      <InteractiveTabbedShowcase />

      {/* 5. Editorial Bento-Grid Lifestyle Tiles */}
      <EditorialBentoGrid />

      {/* 6. Maker's Heritage Story & Jaipur Studio Narrative */}
      <MakerHeritageStory />

      {/* 7. Artisan Value Proposition & Why Choose Us (4 Elevated Cards) */}
      <ValuesSection />

      {/* 8. Item Groups (if configured in Admin) */}
      <ItemGroupSections />

      {/* 9. Verified Customer Reviews & Testimonials Carousel */}
      <div className="container-site mt-16 sm:mt-24">
        <div className="mb-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
            {t('home.reviewsEyebrow', { defaultValue: 'Patron Love' })}
          </span>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">
            {t('home.reviewsTitle', { defaultValue: 'Loved by Conscious Homes Worldwide' })}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t('home.reviewsSubtitle', { defaultValue: 'Verified reviews from real collectors across 40+ countries' })}
          </p>
        </div>
        <StoreReviews />
      </div>

      {/* 10. Studio Visual Photography & Instagram Gallery */}
      <StudioVisualGallery />
    </div>
  );
}
