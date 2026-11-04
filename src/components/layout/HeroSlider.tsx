import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface HeroSlide {
  image: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoplayMs?: number;
  compact?: boolean;
  /** Fixed content shown above every slide (e.g. page title). */
  overlay?: ReactNode;
}

export function HeroSlider({ slides, autoplayMs = 5000, compact = false, overlay }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  if (current >= slides.length && slides.length > 0) setCurrent(0);
  const [prev3d, setPrev3d] = useState<number | null>(null);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (index: number, direction: 'next' | 'prev' = 'next') => {
      const next = ((index % slides.length) + slides.length) % slides.length;
      setDir(direction);
      setPrev3d(current);
      setCurrent(next);
      setTimeout(() => setPrev3d(null), 700);
    },
    [current, slides.length],
  );

  const goPrev = useCallback(() => go(current - 1, 'prev'), [current, go]);
  const goNext = useCallback(() => go(current + 1, 'next'), [current, go]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    timerRef.current = setTimeout(() => go(current + 1, 'next'), autoplayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, autoplayMs, go, slides.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  if (!slides.length) return null;

  return (
    <>
      <style>{`
        @keyframes slide3d-enter-next {
          from { opacity: 0; transform: perspective(1200px) rotateY(-12deg) scale(0.92) translateX(6%); }
          to   { opacity: 1; transform: perspective(1200px) rotateY(0deg)   scale(1)    translateX(0); }
        }
        @keyframes slide3d-enter-prev {
          from { opacity: 0; transform: perspective(1200px) rotateY(12deg)  scale(0.92) translateX(-6%); }
          to   { opacity: 1; transform: perspective(1200px) rotateY(0deg)   scale(1)    translateX(0); }
        }
        @keyframes slide3d-exit-next {
          from { opacity: 1; transform: perspective(1200px) rotateY(0deg)  scale(1)    translateX(0); }
          to   { opacity: 0; transform: perspective(1200px) rotateY(10deg) scale(0.94) translateX(-4%); }
        }
        @keyframes slide3d-exit-prev {
          from { opacity: 1; transform: perspective(1200px) rotateY(0deg)   scale(1)    translateX(0); }
          to   { opacity: 0; transform: perspective(1200px) rotateY(-10deg) scale(0.94) translateX(4%); }
        }
        @keyframes hero-text-in {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slider-progress {
          from { width: 0; }
          to   { width: 100%; }
        }
        .slide-enter-next { animation: slide3d-enter-next 0.7s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .slide-enter-prev { animation: slide3d-enter-prev 0.7s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .slide-exit-next  { animation: slide3d-exit-next  0.65s cubic-bezier(0.55,0,1,0.45) forwards; }
        .slide-exit-prev  { animation: slide3d-exit-prev  0.65s cubic-bezier(0.55,0,1,0.45) forwards; }
        .hero-text-in     { animation: hero-text-in 0.6s 0.25s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .hero-text-in-delay { animation: hero-text-in 0.6s 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .hero-text-in-btn   { animation: hero-text-in 0.6s 0.55s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      `}</style>

      <div
        ref={trackRef}
        className="relative overflow-hidden rounded-2xl bg-sand-200"
        style={{ perspective: '1200px' }}
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
        <div className={compact ? 'relative min-h-[320px] lg:min-h-[400px]' : 'relative min-h-[460px] lg:min-h-[540px]'}>
          {slides.map((slide, i) => {
            const isActive = i === current;
            const isExiting = i === prev3d;
            if (!isActive && !isExiting) return null;
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={!isActive}
                className={cn(
                  'absolute inset-0',
                  isActive  && dir === 'next' ? 'z-10 slide-enter-next' : '',
                  isActive  && dir === 'prev' ? 'z-10 slide-enter-prev' : '',
                  isExiting && dir === 'next' ? 'z-0  slide-exit-next'  : '',
                  isExiting && dir === 'prev' ? 'z-0  slide-exit-prev'  : '',
                )}
              >
                <img
                  src={slide.image}
                  alt=""
                  width={1600}
                  height={760}
                  {...(i === 0 ? { fetchPriority: 'high' } : { loading: 'lazy' })}
                  className="absolute inset-0 h-full w-full object-cover object-[78%_center] lg:object-right"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent" aria-hidden />
                {isActive && slide.title && (
                  <div className="relative flex h-full flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
                    <h2 className={cn('hero-text-in max-w-xl font-serif font-semibold leading-[1.1] text-white drop-shadow-sm line-clamp-3', compact ? 'text-3xl lg:text-4xl' : 'text-4xl lg:text-6xl')}>{slide.title}</h2>
                    {slide.subtitle && (
                      <p className="hero-text-in-delay mt-4 max-w-md text-base text-white/85 line-clamp-2 lg:text-lg">{slide.subtitle}</p>
                    )}
                    <div className="hero-text-in-btn mt-7 flex flex-wrap gap-3">
                      {slide.ctaHref && slide.ctaLabel && (
                        <ButtonLink to={slide.ctaHref} size="lg" className="!bg-white !text-gray-900 hover:!bg-sand-100 shadow-md font-semibold">
                          {slide.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                        </ButtonLink>
                      )}
                      {slide.secondaryLabel && slide.secondaryHref && (
                        <ButtonLink to={slide.secondaryHref} size="lg" variant="ghost" className="border border-white/50 text-white hover:bg-white/15 backdrop-blur">
                          {slide.secondaryLabel}
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {overlay && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex max-w-2xl flex-col justify-center pl-16 pr-6 lg:pl-20 [&_a]:pointer-events-auto">
            <div className="hero-text-in">{overlay}</div>
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button onClick={goPrev} aria-label="Previous slide" className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white backdrop-blur transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goNext} aria-label="Next slide" className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white backdrop-blur transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slide indicators">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i, i > current ? 'next' : 'prev')}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  i === current ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        )}

        {slides.length > 1 && !paused && (
          <div
            key={`${current}-progress`}
            className="absolute bottom-0 left-0 z-20 h-0.5 bg-white/60"
            style={{ animation: `slider-progress ${autoplayMs}ms linear forwards` }}
            aria-hidden
          />
        )}
      </div>
    </>
  );
}
