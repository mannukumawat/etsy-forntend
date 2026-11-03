import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BannerSlide {
  image: string;
  ctaHref?: string;
}

interface ShopBannerProps {
  slides: BannerSlide[];
  autoplayMs?: number;
}

export function ShopBanner({ slides, autoplayMs = 5000 }: ShopBannerProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (index: number) => setCurrent(((index % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  const prev = useCallback(() => go(current - 1), [current, go]);
  const next = useCallback(() => go(current + 1), [current, go]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    timerRef.current = setTimeout(() => go(current + 1), autoplayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, autoplayMs, go, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const d = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(d) > 40) d < 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-sand-100"
      style={{ height: 'clamp(180px, 28vw, 420px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Shop banner"
      role="region"
    >
      {slides.map((slide, i) => (
        <img
          key={i}
          src={slide.image}
          alt=""
          loading={i === 0 ? undefined : 'lazy'}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0',
          )}
        />
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <ChevronLeft className="h-4 w-4 text-ink" />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <ChevronRight className="h-4 w-4 text-ink" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/55',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
