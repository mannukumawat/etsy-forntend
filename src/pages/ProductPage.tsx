import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronDown, Gem, Globe2, Hand, Leaf, PackageX } from 'lucide-react';
import { DeliveryEstimate } from '@/components/product/DeliveryEstimate';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductReviews } from '@/components/product/ProductReviews';
import { StoreReviews } from '@/components/product/StoreReviews';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { VariantSelector } from '@/components/product/VariantSelector';
import { WishlistButton } from '@/components/product/WishlistButton';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { VariantPrice } from '@/components/ui/Price';
import { QuantityInput } from '@/components/ui/QuantityInput';
import { Rating } from '@/components/ui/Rating';
import { CATEGORY_BY_SLUG } from '@/data/categories';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { productService } from '@/services/productService';
import { useCart } from '@/store/cart';
import { usePreferences } from '@/store/preferences';
import type { Product } from '@/types';
import {
  findVariant,
  findVariantById,
  imagesForSelection,
  matchingVariants,
  maxAddable,
  missingOptions,
  stockStatus,
  totalStock,
  type Selection,
} from '@/utils/variants';

function ProductSkeleton() {
  return (
    <div className="container-site grid gap-10 py-8 md:grid-cols-2" role="status" aria-label="Loading">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

/** Etsy-style collapsible panel for the right column. */
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-5 text-ink-soft">{children}</div>
    </details>
  );
}

function ProductDetail({ product, onReviewsChanged }: { product: Product; onReviewsChanged: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const addToCart = useAddToCart();
  const lines = useCart((s) => s.lines);
  const currency = usePreferences((s) => s.currency);

  const initialSelection = (): Selection => {
    const v = findVariantById(product, params.get('variant') ?? undefined);
    if (v) return { ...v.options };
    return {};
  };
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [missing, setMissing] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const wantsReview = params.get('review') === '1';

  const variant = findVariant(product, selection);
  const images = imagesForSelection(product, selection);
  const candidates = variant ? [variant] : matchingVariants(product, selection);
  const inCart = variant ? (lines.find((l) => l.variantId === variant.id)?.quantity ?? 0) : 0;
  const addable = maxAddable(variant, inCart);
  const allSoldOut = totalStock(product) === 0;
  const variantStatus = variant ? stockStatus(variant.stock) : null;
  const category = CATEGORY_BY_SLUG[product.categoryId];

  // Keep the URL in sync with a fully selected variant so links are shareable.
  useEffect(() => {
    if (!product.options.length) return;
    const current = params.get('variant');
    if (variant && current !== variant.id) {
      setParams({ variant: variant.id }, { replace: true, preventScrollReset: true });
    }
  }, [variant, product.options.length, params, setParams]);

  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, Math.max(addable, 1))));
  }, [addable]);

  const choose = (optionId: string, valueId: string) => {
    setSelection((s) => ({ ...s, [optionId]: valueId }));
    setMissing((m) => m.filter((id) => id !== optionId));
  };

  const validate = () => {
    const miss = missingOptions(product, selection).map((o) => o.id);
    if (miss.length) {
      setMissing(miss);
      document.getElementById(`pdp-${miss[0]}`)?.focus();
      return null;
    }
    return variant ?? null;
  };

  const onAdd = () => {
    const v = validate();
    if (!v || v.stock <= 0) return;
    addToCart(product, v, quantity);
  };

  const onBuyNow = () => {
    const v = validate();
    if (!v || v.stock <= 0) return;
    const added = addable > 0 ? addToCart(product, v, quantity, { openDrawer: false, silent: true }) : 0;
    if (added > 0 || inCart > 0) navigate('/checkout');
  };

  const perks = [
    { icon: Hand, label: t('product.perks.handmade') },
    { icon: Globe2, label: t('product.perks.worldwide') },
    { icon: Leaf, label: t('product.perks.packaging') },
  ];

  const related = useAsync(`catalog:related:${product.id}`, () => productService.getRelated(product));

  return (
    <div className="container-site py-6 lg:py-8">
      <Breadcrumbs
        items={[
          { label: t('common.home'), to: '/' },
          { label: loc(category.name), to: `/category/${category.slug}` },
          { label: loc(product.name) },
        ]}
      />

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-x-12 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ProductGallery images={images} />
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Link to={`/category/${category.slug}`} className="eyebrow hover:underline">
            {loc(category.name)}
          </Link>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-4xl leading-tight lg:text-[44px]">{loc(product.name)}</h1>
            <WishlistButton product={product} variantId={variant?.id} className="mt-1 shrink-0 border border-sand-200" />
          </div>
          <VariantPrice variants={candidates} size="lg" className="mt-3" />
          {currency !== 'USD' && <p className="mt-1 text-xs text-ink-muted">{t('product.priceNote', { currency })}</p>}
          {product.reviewCount > 0 && (
            <button type="button" onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="mt-2 block rounded">
              <Rating value={product.rating} count={product.reviewCount} />
            </button>
          )}
          <p className="mt-4 text-ink-soft">{loc(product.shortDescription)}</p>

          <div className="mt-6 space-y-6">
            {product.options.length > 0 && <VariantSelector product={product} selection={selection} onChange={choose} missing={missing} idPrefix="pdp" />}

            <div aria-live="polite" className="text-sm">
              {allSoldOut ? (
                <p className="flex items-center gap-2 font-medium text-ink-muted">
                  <PackageX className="h-4 w-4" aria-hidden /> {t('product.allSoldOut')}
                </p>
              ) : variantStatus === 'out_of_stock' ? (
                <p className="font-medium text-red-700">{t('product.variantSoldOut')}</p>
              ) : variantStatus === 'low_stock' ? (
                <p className="font-medium text-amber-800">{t('product.onlyLeft', { count: variant!.stock })}</p>
              ) : variantStatus === 'in_stock' ? (
                <p className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('product.inStock')}
                </p>
              ) : null}
              {inCart > 0 && <p className="mt-1 text-ink-muted">{t('product.inCart', { count: inCart })}</p>}
            </div>

            {!allSoldOut && (
              <div className="flex flex-wrap items-end gap-3">
                <QuantityInput value={quantity} onChange={setQuantity} max={Math.max(1, addable)} disabled={!variant || variant.stock <= 0 || addable === 0} />
                {variant && addable === 0 && variant.stock > 0 && <p className="pb-3 text-sm text-ink-muted">{t('product.maxInCart', { count: inCart })}</p>}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="lg" onClick={onAdd} disabled={allSoldOut || variant?.stock === 0} fullWidth>
                {allSoldOut || variant?.stock === 0 ? t('product.soldOut') : t('product.addToCart')}
              </Button>
              <Button size="lg" variant="outline" onClick={onBuyNow} disabled={allSoldOut || variant?.stock === 0} fullWidth>
                {t('product.buyNow')}
              </Button>
            </div>

            {/* Return / exchange policy badges */}
            <div className="flex flex-wrap gap-2 text-sm">
              {product.returnsAllowed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8.5 6 11.5 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('product.returnsAllowedShort', { days: product.returnDays })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  {t('product.noReturns')}
                </span>
              )}
              {product.exchangeAllowed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8.5 6 11.5 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('product.exchangeAllowedShort', { days: product.returnDays })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  {t('product.noExchange')}
                </span>
              )}
            </div>

            <ul className="grid gap-2 text-sm text-ink-soft sm:grid-cols-3">
              {perks.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

          </div>

          <div className="mt-8 divide-y divide-sand-200 border-y border-sand-200">
            <Accordion title={t('product.itemDetails')} defaultOpen>
              {loc(product.materials) && (
                <>
                  <p className="font-semibold text-ink">{t('product.highlights')}</p>
                  <p className="mt-2 flex items-start gap-2">
                    <Gem className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
                    <span>
                      {t('product.materialsLabel')}: {loc(product.materials)}
                    </span>
                  </p>
                </>
              )}
              <p className="mt-4 whitespace-pre-line">{loc(product.description)}</p>
              {(product.dimensions.length > 0 || variant) && (
                <dl className="mt-4 divide-y divide-sand-200 text-sm">
                  {product.dimensions.map((d) => (
                    <div key={d.key + d.value} className="flex justify-between gap-4 py-2">
                      <dt className="text-ink-muted">{t(`product.dims.${d.key}`)}</dt>
                      <dd className="text-right text-ink">{d.value}</dd>
                    </div>
                  ))}
                  {variant && (
                    <div className="flex justify-between gap-4 py-2">
                      <dt className="text-ink-muted">{t('product.sku')}</dt>
                      <dd className="text-right font-mono text-xs text-ink">{variant.sku}</dd>
                    </div>
                  )}
                </dl>
              )}
              <p className="mt-4 text-sm text-ink-muted">{t('product.handmadeNote')}</p>
            </Accordion>
            {loc(product.care) && (
              <Accordion title={t('product.careTitle')}>
                <p>{loc(product.care)}</p>
              </Accordion>
            )}
            <Accordion title={t('product.deliveryReturns')} defaultOpen>
              <DeliveryEstimate />
              <p className="mt-4">{t('product.shippingInfo')}</p>
              <div className="mt-3 space-y-1 text-sm">
                {product.returnsAllowed ? (
                  <p className="text-emerald-700">✓ {t('product.returnsAllowedText', { days: product.returnDays })}</p>
                ) : (
                  <p className="text-red-700">✗ {t('product.noReturns')}</p>
                )}
                {product.exchangeAllowed ? (
                  <p className="text-emerald-700">✓ {t('product.exchangeAllowedText', { days: product.returnDays })}</p>
                ) : (
                  <p className="text-red-700">✗ {t('product.noExchange')}</p>
                )}
              </div>
              <p className="mt-3 flex gap-4 text-sm">
                <Link to="/shipping" className="link">
                  {t('product.readShipping')}
                </Link>
                <Link to="/returns" className="link">
                  {t('product.readReturns')}
                </Link>
              </p>
            </Accordion>
          </div>
        </div>

        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
          <div className="border-t border-sand-200 pt-10 lg:border-t-0 lg:pt-4">
            <ProductReviews product={product} onChanged={onReviewsChanged} autoOpenForm={wantsReview} />
          </div>
          <StoreReviews />
        </div>
      </div>

      <section aria-labelledby="related-title" className="mt-16">
        <h2 id="related-title" className="mb-6 text-3xl">
          {t('product.relatedTitle')}
        </h2>
        {related.isError ? <ErrorState onRetry={related.reload} /> : related.data ? <ProductGrid products={related.data} /> : <ProductGridSkeleton count={4} />}
      </section>
    </div>
  );
}

export default function ProductPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { slug = '' } = useParams();
  const { data, error, isLoading, isError, reload } = useAsync(`catalog:product:${slug}`, () => productService.getBySlug(slug));
  useDocumentTitle(data ? loc(data.name) : isError ? t('product.notFoundTitle') : null);

  if (isLoading) return <ProductSkeleton />;
  if (isError) {
    if (error instanceof ApiError && error.code === 'not_found') {
      return (
        <EmptyState
          icon={<PackageX className="h-7 w-7" aria-hidden />}
          title={t('product.notFoundTitle')}
          body={t('product.notFoundBody')}
          actions={<ButtonLink to="/shop">{t('product.backToShop')}</ButtonLink>}
          className="py-24"
        />
      );
    }
    return <ErrorState onRetry={reload} />;
  }
  if (!data) return null;
  return <ProductDetail key={data.id} product={data} onReviewsChanged={reload} />;
}
