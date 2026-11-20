import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';
import { CATEGORY_BY_SLUG } from '@/data/categories';
import { useLocalized } from '@/hooks/useLocale';
import { useAddToCart } from '@/hooks/useAddToCart';
import type { Product } from '@/types';
import { productService } from '@/services/productService';
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
  const category = CATEGORY_BY_SLUG[product.categoryId];
  const href = `/product/${product.slug}`;
  const [first, second] = product.images;
  const addToCart = useAddToCart();
  const quickVariant = product.variants.length === 1 ? product.variants[0] : undefined;
  const canQuickAdd = quickVariant && status !== 'out_of_stock';

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      onPointerEnter={() => void productService.preloadProduct(product.slug)}
      onFocus={() => void productService.preloadProduct(product.slug)}
      onTouchStart={() => void productService.preloadProduct(product.slug)}
    >
      <Link to={href} tabIndex={-1} aria-hidden className="block">
        <div className="relative aspect-square overflow-hidden bg-sand-100">
          {first?.src && (
            <img
              src={first.src}
              alt=""
              width={800}
              height={800}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          )}
          {second && (
            <img
              src={second.src}
              alt=""
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {status === 'out_of_stock' && <Badge tone="muted">{t('common.soldOut')}</Badge>}
            {status !== 'out_of_stock' && onSale && <Badge tone="sale">{t('common.sale')}</Badge>}
            {product.isNew && <Badge tone="new">{t('common.new')}</Badge>}
          </div>
        </div>
      </Link>

      <div className={`flex flex-1 flex-col px-3 pt-3 min-[390px]:px-3.5 md:pb-3.5 ${canQuickAdd ? 'pb-14' : 'pb-3.5'}`}>
        {category && <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{loc(category.name)}</p>}
        <Link to={href} className="mt-1 rounded">
          <h3 className="line-clamp-2 font-sans text-[14px] font-medium leading-snug text-ink transition-colors group-hover:text-brand-700">{loc(product.name)}</h3>
        </Link>
        <div className="mt-auto pt-3">
          <VariantPrice variants={product.variants} size="sm" />
          {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} className="mt-1" />}
          {swatchOption && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="sr-only">{t('a11y.availableColours', { count: swatchOption.values.length })}</span>
              {swatchOption.values.slice(0, 5).map((v) => (
                <span key={v.id} title={loc(v.label)} aria-hidden className="h-3.5 w-3.5 rounded-full border border-white ring-1 ring-sand-300" style={{ background: v.swatch }} />
              ))}
            </div>
          )}
          {status === 'low_stock' && <p className="mt-1 text-xs font-medium text-amber-800">{t('common.lowStock', { count: totalStock(product) })}</p>}
        </div>
      </div>

      <WishlistButton product={product} className="absolute right-3 top-3" />
      {canQuickAdd ? (
        <button
          type="button"
          onClick={() => addToCart(product, quickVariant, 1, { openDrawer: false })}
          aria-label={t('product.addToCart')}
          title={t('product.addToCart')}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift transition active:scale-95 md:opacity-0 md:group-hover:opacity-100"
        >
          <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
        </button>
      ) : null}
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-sand-200 bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="px-3.5 pb-3.5 pt-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
        <Skeleton className="mt-4 h-4 w-1/3" />
      </div>
    </div>
  );
}

const GRID = {
  4: 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 2xl:grid-cols-6',
  3: 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 2xl:grid-cols-6',
} as const;

export function ProductGrid({ products, eagerCount = 0, columns = 4 }: { products: Product[]; eagerCount?: number; columns?: 3 | 4 }) {
  return (
    <ul className={GRID[columns]}>
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
      <div className={GRID[columns]}>
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
