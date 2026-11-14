import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalized } from '@/hooks/useLocale';
import type { ProductImage } from '@/types';
import { cn } from '@/utils/cn';

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [index, setIndex] = useState(0);

  // New variant images -> back to the first image.
  const signature = images.map((i) => i.src.length).join('|') + images[0]?.src.slice(-40);
  useEffect(() => setIndex(0), [signature]);

  if (!images.length) return null;
  const current = images[Math.min(index, images.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col-reverse gap-2 md:flex-row md:gap-4">
      <ul className="scrollbar-none flex justify-center gap-2 overflow-x-auto px-4 md:w-[72px] md:flex-col md:justify-start md:overflow-visible md:px-0">
        {images.map((img, i) => (
          <li key={i} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('a11y.showImage', { index: i + 1, total: images.length })}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'block h-2 w-6 overflow-hidden rounded-full border-0 transition-colors md:h-[72px] md:w-[72px] md:rounded-lg md:border-2',
                i === index ? 'border-ink' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              <img src={img.src} alt="" width={80} height={80} className="hidden h-full w-full object-cover md:block" loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative flex-1">
        <div className="aspect-square overflow-hidden bg-sand-100 md:rounded-xl lg:aspect-auto lg:h-[min(66vh,560px)] xl:h-[min(68vh,600px)]">
          <img key={current.src.slice(-60)} src={current.src} alt={loc(current.alt)} width={800} height={800} className="h-full w-full animate-fade-in object-cover" decoding="async" />
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t('common.previous')}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('common.next')}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <p className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-ink" aria-hidden>
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
