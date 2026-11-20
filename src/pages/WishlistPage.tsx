import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Share2, ShoppingBag, Trash2 } from 'lucide-react';
import { VariantSelector } from '@/components/product/VariantSelector';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Dialog';
import { Badge, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { VariantPrice } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { ProductGridSkeleton } from '@/components/product/ProductCard';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import { useUi } from '@/store/ui';
import { useWishlist } from '@/store/wishlist';
import type { Product, ProductVariant } from '@/types';
import { findVariant, findVariantById, imagesForSelection, missingOptions, totalStock, type Selection } from '@/utils/variants';

function ChooseOptions({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (v: ProductVariant) => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [selection, setSelection] = useState<Selection>({});
  const [missing, setMissing] = useState<string[]>([]);
  const variant = findVariant(product, selection);
  const image = imagesForSelection(product, selection)[0];

  const submit = () => {
    const miss = missingOptions(product, selection).map((o) => o.id);
    if (miss.length || !variant) {
      setMissing(miss);
      document.getElementById(`wl-${miss[0]}`)?.focus();
      return;
    }
    if (variant.stock > 0) onAdd(variant);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('wishlist.chooseTitle')}
      footer={
        <Button fullWidth onClick={submit} disabled={variant?.stock === 0}>
          {variant?.stock === 0 ? t('common.soldOut') : t('product.addToCart')}
        </Button>
      }
    >
      <div className="flex items-center gap-4">
        <img src={image.src} alt={loc(image.alt)} className="h-20 w-20 rounded-lg object-cover" />
        <div>
          <p className="font-medium">{loc(product.name)}</p>
          <VariantPrice variants={variant ? [variant] : product.variants} size="sm" />
        </div>
      </div>
      <div className="mt-5">
        <VariantSelector
          product={product}
          selection={selection}
          onChange={(o, v) => {
            setSelection((s) => ({ ...s, [o]: v }));
            setMissing((m) => m.filter((x) => x !== o));
          }}
          missing={missing}
          idPrefix="wl"
        />
      </div>
    </Modal>
  );
}

export default function WishlistPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  useDocumentTitle(t('wishlist.title'));
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const toast = useUi((s) => s.toast);
  const addToCart = useAddToCart();
  const [choosing, setChoosing] = useState<Product | null>(null);

  const ids = useMemo(() => items.map((i) => i.productId).sort(), [items]);
  const { data, isError, reload } = useAsync(ids.length ? `catalog:wish:${ids.join(',')}` : null, () => productService.getByIds(ids), { keepPrevious: true });
  const byId = new Map((data ?? []).map((p) => [p.id, p]));

  const moveToCart = (product: Product, variant: ProductVariant) => {
    const added = addToCart(product, variant, 1, { openDrawer: false, silent: true });
    if (added > 0) {
      remove(product.id);
      toast(t('wishlist.movedToCart', { name: loc(product.name) }), 'success');
    }
  };

  const onMove = (product: Product, savedVariantId?: string) => {
    const saved = findVariantById(product, savedVariantId);
    if (saved && saved.stock > 0) return moveToCart(product, saved);
    if (product.options.length === 0) return moveToCart(product, product.variants[0]);
    setChoosing(product);
  };

  const shareProduct = async (product: Product) => {
    const url = `${window.location.origin}/product/${product.slug}`;
    const name = loc(product.name);
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t('common.linkCopied', { defaultValue: 'Link copied' }), 'success');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast(t('toast.error'), 'error');
    }
  };

  return (
    <div className="container-site py-0 md:py-8 lg:py-12">
      <div className="hidden flex-wrap items-baseline justify-between gap-3 md:flex">
        <h1 className="text-3xl lg:text-4xl">{t('wishlist.title')}</h1>
        {items.length > 0 && <p className="text-ink-muted">{t('wishlist.subtitle', { count: items.length })}</p>}
      </div>
      <p className="mt-1 hidden text-sm text-ink-muted md:block">{t('wishlist.localNote')}</p>

      <div className="-mx-4 grid grid-cols-3 border-b border-sand-200 bg-white md:hidden">
        <button type="button" className="relative min-h-12 px-1 text-xs font-semibold text-brand-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-brand-600 min-[390px]:text-sm">
          {t('wishlist.title')}
        </button>
        <span className="flex min-h-12 items-center justify-center px-1 text-xs text-ink-muted min-[390px]:text-sm">{t('wishlist.shared', { defaultValue: 'Shared' })}</span>
        <span className="flex min-h-12 items-center justify-center px-1 text-xs text-ink-muted min-[390px]:text-sm">{t('wishlist.viewed', { defaultValue: 'Viewed' })}</span>
      </div>

      <div className="mt-0 md:mt-8">
        {items.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-7 w-7" aria-hidden />}
            title={t('wishlist.empty')}
            body={t('wishlist.emptyBody')}
            actions={<ButtonLink to="/shop">{t('cart.startShopping')}</ButtonLink>}
          />
        ) : isError && !data ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <ProductGridSkeleton count={Math.min(items.length, 8)} />
        ) : (
          <>
          <ul className="-mx-4 grid grid-cols-2 gap-px bg-sand-200 md:hidden">
            {items.map((item) => {
              const product = byId.get(item.productId);
              if (!product) return null;
              const soldOut = totalStock(product) === 0;
              const name = loc(product.name);
              return (
                <li key={item.productId} className="min-w-0 bg-white pb-3">
                  <div className="relative">
                    <Link to={`/product/${product.slug}`} className="block aspect-[0.86] overflow-hidden bg-sand-100">
                      <img src={product.images[0].src} alt={loc(product.images[0].alt)} className="h-full w-full object-cover" loading="lazy" />
                    </Link>
                    <button type="button" onClick={() => remove(product.id)} aria-label={t('a11y.removeFromWishlist', { name })} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow">
                      <Heart className="h-5 w-5 fill-current" aria-hidden />
                    </button>
                    <button type="button" onClick={() => shareProduct(product)} aria-label={t('common.share', { defaultValue: 'Share' })} className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow">
                      <Share2 className="h-5 w-5" aria-hidden />
                    </button>
                    {soldOut && (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-white/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink shadow">
                        {t('common.soldOut')}
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 pt-2.5">
                    <Link to={`/product/${product.slug}`}>
                      <h2 className="truncate font-sans text-xs font-medium text-ink-soft">{name}</h2>
                    </Link>
                    <VariantPrice variants={product.variants} size="sm" className="mt-1" />
                    {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} className="mt-1" />}
                  </div>
                </li>
              );
            })}
          </ul>
          <ul className="hidden grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((item) => {
              const product = byId.get(item.productId);
              if (!product) {
                return (
                  <li key={item.productId} className="card flex flex-col items-start gap-3 p-4">
                    <p className="text-sm text-ink-muted">{t('cart.issues.unavailable')}</p>
                    <Button variant="ghost" size="sm" onClick={() => remove(item.productId)} icon={<Trash2 className="h-4 w-4" aria-hidden />}>
                      {t('common.remove')}
                    </Button>
                  </li>
                );
              }
              const soldOut = totalStock(product) === 0;
              const name = loc(product.name);
              return (
                <li key={item.productId} className="flex flex-col">
                  <Link to={`/product/${product.slug}`} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-sand-100">
                      <img src={product.images[0].src} alt={loc(product.images[0].alt)} className="h-full w-full object-cover" loading="lazy" />
                      {soldOut && <Badge tone="muted" className="absolute left-2.5 top-2.5">{t('wishlist.unavailable')}</Badge>}
                    </div>
                    <h2 className="mt-3 font-sans text-[14px] font-medium leading-snug group-hover:underline">{name}</h2>
                  </Link>
                  <VariantPrice variants={product.variants} size="sm" className="mt-1" />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" disabled={soldOut} onClick={() => onMove(product, item.variantId)} icon={<ShoppingBag className="h-4 w-4" aria-hidden />}>
                      {soldOut ? t('common.soldOut') : t('wishlist.moveToCart')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(product.id)} aria-label={t('a11y.removeFromWishlist', { name })} title={t('a11y.removeFromWishlist', { name })}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          </>
        )}
      </div>

      {choosing && (
        <ChooseOptions
          product={choosing}
          onClose={() => setChoosing(null)}
          onAdd={(v) => {
            moveToCart(choosing, v);
            setChoosing(null);
          }}
        />
      )}
    </div>
  );
}
