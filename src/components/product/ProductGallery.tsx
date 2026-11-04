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
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      <ul className="scrollbar-none flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
        {images.map((img, i) => (
          <li key={i} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('a11y.showImage', { index: i + 1, total: images.length })}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'block h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors md:h-20 md:w-20',
                i === index ? 'border-ink' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              <img src={img.src} alt="" width={80} height={80} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative flex-1">
        <div className="aspect-square overflow-hidden rounded-2xl bg-sand-100 lg:aspect-auto lg:h-[min(76vh,720px)]">
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
