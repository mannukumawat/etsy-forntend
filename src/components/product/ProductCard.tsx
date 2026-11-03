import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '@/hooks/useLocale';
import type { Product } from '@/types';
import { stockStatus, totalStock } from '@/utils/variants';
import { Badge, Skeleton } from '../ui/Feedback';
import { VariantPrice } from '../ui/Price';
import { Rating } from '../ui/Rating';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const status = stockStatus(totalStock(product));
  const onSale = product.variants.some((v) => v.salePrice !== undefined);
  const swatchOption = product.options.find((o) => o.type === 'swatch');
  const [first, second] = product.images;

  return (
    <article className="group relative flex flex-col">
      <Link to={`/product/${product.slug}`} className="block rounded-xl">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
          <img
            src={first.src}
            alt={loc(first.alt)}
            width={800}
            height={800}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
          {second && (
            <img
              src={second.src}
              alt=""
              aria-hidden
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
            />
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {status === 'out_of_stock' && <Badge tone="muted">{t('common.soldOut')}</Badge>}
            {status !== 'out_of_stock' && onSale && <Badge tone="sale">{t('common.sale')}</Badge>}
            {product.isNew && <Badge tone="new">{t('common.new')}</Badge>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 font-sans text-[15px] font-medium leading-snug text-ink group-hover:underline group-hover:underline-offset-2">
          {loc(product.name)}
        </h3>
      </Link>
      <VariantPrice variants={product.variants} size="sm" className="mt-1" />
      {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} className="mt-1" />}
      {swatchOption && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="sr-only">{t('a11y.availableColours', { count: swatchOption.values.length })}</span>
          {swatchOption.values.slice(0, 5).map((v) => (
            <span
              key={v.id}
              title={loc(v.label)}
              aria-hidden
              className="h-3.5 w-3.5 rounded-full border border-white ring-1 ring-sand-300"
              style={{ background: v.swatch }}
            />
          ))}
        </div>
      )}
      {status === 'low_stock' && <p className="mt-1 text-xs font-medium text-amber-800">{t('common.lowStock', { count: totalStock(product) })}</p>}
      <WishlistButton product={product} className="absolute right-2.5 top-2.5" />
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-2 h-3 w-1/4" />
    </div>
  );
}

export function ProductGrid({ products, eagerCount = 0, columns = 4 }: { products: Product[]; eagerCount?: number; columns?: 3 | 4 }) {
  return (
    <ul className={columns === 4 ? 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6' : 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-6'}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('common.loading')}>
      <div className={columns === 4 ? 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6' : 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-6'}>
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
