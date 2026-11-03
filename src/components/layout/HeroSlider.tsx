import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoplayMs?: number;
}

export function HeroSlider({ slides, autoplayMs = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (index: number) => {
      setCurrent(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const prev = useCallback(() => go(current - 1), [current, go]);
  const next = useCallback(() => go(current + 1), [current, go]);

  // Autoplay
  useEffect(() => {
    if (paused || slides.length < 2) return;
    timerRef.current = setTimeout(() => go(current + 1), autoplayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, autoplayMs, go, slides.length]);

  // Keyboard
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (!slides.length) return null;

  return (
    <div
      ref={trackRef}
      className="relative overflow-hidden rounded-2xl bg-sand-100"
      aria-roledescription="carousel"
      aria-label="Featured banners"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className="relative min-h-[460px] md:min-h-[440px] lg:min-h-[520px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={i !== current}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
            )}
          >
            <img
              src={slide.image}
              alt=""
              width={1600}
              height={760}
              {...(i === 0 ? { fetchpriority: 'high' } : { loading: 'lazy' })}
              className="absolute inset-0 h-full w-full object-cover object-[78%_center] lg:object-right"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-ivory-50/95 via-ivory-50/70 to-transparent md:bg-gradient-to-r md:from-ivory-50/95 md:via-ivory-50/60 md:to-transparent"
              aria-hidden
            />
            <div className="relative flex h-full flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
              <h2 className="max-w-lg text-5xl leading-[1.05] lg:text-6xl">{slide.title}</h2>
              {slide.subtitle && (
                <p className="mt-4 max-w-md text-base text-ink-soft lg:text-lg">{slide.subtitle}</p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink to={slide.ctaHref} size="lg">
                  {slide.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                {slide.secondaryLabel && slide.secondaryHref && (
                  <ButtonLink to={slide.secondaryHref} size="lg" variant="ghost" className="bg-white/60 backdrop-blur">
                    {slide.secondaryLabel}
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next arrows — only show when >1 slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slide indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700',
                i === current ? 'w-6 bg-brand-700' : 'w-1.5 bg-ink/30 hover:bg-ink/50',
              )}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && !paused && (
        <div
          key={`${current}-progress`}
          className="absolute bottom-0 left-0 z-20 h-0.5 bg-brand-700/60"
          style={{ animation: `slider-progress ${autoplayMs}ms linear forwards` }}
          aria-hidden
        />
      )}
    </div>
  );
}
