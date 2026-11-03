import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { contentService } from '@/services/contentService';

export function HomeHero() {
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const live = homepage?.content;

  const heroImage = live?.bannerSlides?.[0]?.image ?? null;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-ivory"
    >
      <div
        className="container-site flex min-h-[420px] items-stretch gap-0 lg:min-h-[500px]"
      >
        {/* Text column */}
        <div className="relative z-10 flex flex-col justify-center py-14 lg:w-[44%] lg:py-20 lg:pr-10">
          <p className="eyebrow">Handmade in Jaipur</p>
          <h1
            id="hero-title"
            className="mt-4 font-serif text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink lg:text-[3.5rem]"
          >
            Handcrafted warmth.
            <br />
            <span className="text-brand-600">Timeless character.</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-soft">
            Discover rugs and home accents that bring texture, colour and individuality to your space.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/category/kilim-rugs"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              Explore Rugs
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-ink/5"
            >
              Shop All
            </Link>
          </div>
        </div>

        {/* Image column — desktop */}
        {heroImage && (
          <div className="hidden flex-1 overflow-hidden lg:block">
            <img
              src={heroImage}
              alt=""
              width={960}
              height={540}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Mobile: faint background tint */}
      {heroImage && (
        <div className="absolute inset-0 -z-10 lg:hidden">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            width={800}
            height={500}
            loading="eager"
            className="h-full w-full object-cover opacity-[0.08]"
          />
        </div>
      )}
    </section>
  );
}
