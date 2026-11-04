import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { useSiteSettings } from '@/store/siteSettings';
import { contentService } from '@/services/contentService';

export function HomeHero() {
  const loc = useLocalized();
  const storeName = useSiteSettings((s) => s.store.name);
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const hero = homepage?.content?.hero;

  const title = hero ? loc(hero.title) : storeName;
  const subtitle = hero ? loc(hero.subtitle) : null;
  const heroImage = hero?.image ?? null;
  const ctaLabel = hero ? loc(hero.ctaLabel) : null;
  const ctaHref = hero?.ctaHref ?? null;

  const ctaClassName =
    'inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ivory">
      <div className="container-site flex min-h-[420px] items-stretch gap-0 lg:min-h-[500px]">
        <div className="relative z-10 flex flex-col justify-center py-14 lg:w-[44%] lg:py-20 lg:pr-10">
          <h1
            id="hero-title"
            className="mt-0 font-serif text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink lg:text-[3.5rem]"
          >
            {title}
          </h1>
          {subtitle && <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-soft">{subtitle}</p>}
          {ctaLabel && ctaHref && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {ctaHref.startsWith('/') ? (
                <Link to={ctaHref} className={ctaClassName}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <a href={ctaHref} target="_blank" rel="noopener noreferrer" className={ctaClassName}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
          )}
          {!ctaLabel && (
            <div className="mt-8">
              <Link to="/shop" className={ctaClassName}>
                Shop now <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>

        {heroImage && (
          <div className="hidden flex-1 overflow-hidden lg:block">
            <img src={heroImage} alt="" width={960} height={540} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {heroImage && (
        <div className="absolute inset-0 -z-10 lg:hidden">
          <img src={heroImage} alt="" aria-hidden width={800} height={500} loading="eager" className="h-full w-full object-cover opacity-[0.08]" />
        </div>
      )}
    </section>
  );
}
