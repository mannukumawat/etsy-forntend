import { MessageCircle, Star } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';
import { useSiteSettings } from '@/store/siteSettings';
import { cn } from '@/utils/cn';

export function ShopProfile() {
  const storeName = useSiteSettings((s) => s.store.name);
  const location = useSiteSettings((s) => s.store.location);
  const stats = useSiteSettings((s) => s.store.stats);

  const rating = stats?.rating ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const salesCount = stats?.salesCount ?? 0;
  const years = stats?.yearsOnPlatform;

  // Full-star / half-star count
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;

  return (
    <div className="relative z-10 -mt-10 border-b border-sand-200 bg-ivory-50/95 shadow-sm backdrop-blur-sm">
      {/* Identity row */}
      <div className="container-site flex flex-wrap items-center gap-4 py-4">
        {/* Logo + name + location */}
        <div className="flex items-center gap-3">
          <img
            src={logoMark}
            alt=""
            className="h-14 w-14 rounded-lg border border-sand-200 bg-white object-contain p-1 shadow-sm"
          />
          <div>
            <p className="text-lg font-semibold uppercase tracking-wider text-ink">
              {storeName}
            </p>
            {location && (
              <p className="text-sm text-ink-muted">{location}</p>
            )}
            {/* Star rating + sales */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {rating > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <span className="flex text-amber-400" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3.5 w-3.5',
                          i < fullStars
                            ? 'fill-amber-400 text-amber-400'
                            : i === fullStars && halfStar
                              ? 'fill-amber-200 text-amber-400'
                              : 'fill-transparent text-sand-300',
                        )}
                      />
                    ))}
                  </span>
                  <span className="font-medium text-ink">{rating.toFixed(1)}</span>
                  <span className="text-ink-muted">({reviewCount.toLocaleString()})</span>
                </span>
              )}
              {salesCount > 0 && (
                <span className="text-sm text-ink-muted">
                  <span className="font-medium text-ink">{salesCount.toLocaleString()}</span> sales
                </span>
              )}
              {years != null && years > 0 && (
                <span className="text-sm text-ink-muted">
                  <span className="font-medium text-ink">{years}</span> year{years !== 1 ? 's' : ''} on platform
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <a
            href="mailto:"
            className="flex items-center gap-1.5 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-sand-50"
          >
            <MessageCircle className="h-4 w-4 text-ink-muted" aria-hidden />
            Contact
          </a>
          <button className="flex items-center gap-1.5 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-sand-50">
            <svg className="h-4 w-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Follow
          </button>
        </div>
      </div>

    </div>
  );
}
