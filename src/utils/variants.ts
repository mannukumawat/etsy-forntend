import { LOW_STOCK_THRESHOLD, MAX_QTY_PER_LINE } from '@/config/store';
import type { Localized, Minor, Product, ProductImage, ProductVariant } from '@/types';

export type Selection = Record<string, string>;
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export const effectivePrice = (v: Pick<ProductVariant, 'price' | 'salePrice'>): Minor => v.salePrice ?? v.price;

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

export function hasOptions(product: Product): boolean {
  return product.options.length > 0;
}

/** Variants compatible with a (possibly partial) selection. */
export function matchingVariants(product: Product, selection: Selection): ProductVariant[] {
  return product.variants.filter((v) =>
    Object.entries(selection).every(([optionId, valueId]) => !valueId || v.options[optionId] === valueId),
  );
}

export function isSelectionComplete(product: Product, selection: Selection): boolean {
  return product.options.every((o) => !!selection[o.id]);
}

/** The single variant for a complete selection (or the only variant of a product without options). */
export function findVariant(product: Product, selection: Selection): ProductVariant | undefined {
  if (!hasOptions(product)) return product.variants[0];
  if (!isSelectionComplete(product, selection)) return undefined;
  return matchingVariants(product, selection)[0];
}

export function findVariantById(product: Product, variantId: string | undefined): ProductVariant | undefined {
  return variantId ? product.variants.find((v) => v.id === variantId) : undefined;
}

export function missingOptions(product: Product, selection: Selection) {
  return product.options.filter((o) => !selection[o.id]);
}

/** Images update as soon as a colour is picked, even before the selection is complete. */
export function imagesForSelection(product: Product, selection: Selection): ProductImage[] {
  return matchingVariants(product, selection)[0]?.images ?? product.images;
}

/** Whether choosing `valueId` for `optionId` (with the rest of the selection) leads to any in-stock variant. */
export function isValueInStock(product: Product, selection: Selection, optionId: string, valueId: string): boolean {
  const next = { ...selection, [optionId]: valueId };
  return matchingVariants(product, next).some((v) => v.stock > 0);
}

export interface PriceRange {
  min: Minor;
  max: Minor;
  /** Original (pre-sale) price when every matching variant shares one sale. */
  compareAt?: Minor;
}

export function priceRange(variants: ProductVariant[]): PriceRange {
  const prices = variants.map(effectivePrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const onSale = variants.filter((v) => v.salePrice !== undefined);
  const compareAt = min === max && onSale.length === variants.length ? variants[0].price : undefined;
  return { min, max, compareAt };
}

export function variantLabel(product: Product, variant: ProductVariant | undefined): Localized | null {
  if (!variant || !hasOptions(product)) return null;
  const parts = product.options.map((o) => o.values.find((v) => v.id === variant.options[o.id])?.label).filter(Boolean) as Localized[];
  if (!parts.length) return null;
  return {
    en: parts.map((p) => p.en).join(' / '),
  };
}

/** Maximum quantity a customer may add, given stock and what is already in the cart. */
export function maxAddable(variant: ProductVariant | undefined, inCart: number): number {
  if (!variant) return 0;
  return Math.max(0, Math.min(variant.stock, MAX_QTY_PER_LINE) - inCart);
}

export function maxLineQuantity(variant: ProductVariant | undefined): number {
  if (!variant) return 0;
  return Math.min(variant.stock, MAX_QTY_PER_LINE);
}
