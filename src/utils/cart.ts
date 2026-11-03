import type { CartLine, Minor, Product, ProductVariant } from '@/types';
import { effectivePrice, maxLineQuantity } from './variants';

export type LineIssue = 'unavailable' | 'out_of_stock' | 'insufficient';

export interface ResolvedLine {
  line: CartLine;
  status: 'loading' | 'ok' | 'issue';
  product?: Product;
  variant?: ProductVariant;
  issue?: LineIssue;
  /** Highest quantity the customer may hold for this line. */
  maxQuantity: number;
  unitBase?: Minor;
}

/** Joins persisted cart lines with live catalogue data and flags stock problems. */
export function resolveCartLines(lines: CartLine[], products: Product[] | undefined, loading: boolean): ResolvedLine[] {
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      return loading || !products
        ? { line, status: 'loading', maxQuantity: line.quantity }
        : { line, status: 'issue', issue: 'unavailable', maxQuantity: 0 };
    }
    const variant = product.variants.find((v) => v.id === line.variantId);
    if (!variant) return { line, product, status: 'issue', issue: 'unavailable', maxQuantity: 0 };
    const maxQuantity = maxLineQuantity(variant);
    const base = { line, product, variant, maxQuantity, unitBase: effectivePrice(variant) };
    if (variant.stock <= 0) return { ...base, status: 'issue', issue: 'out_of_stock' };
    if (line.quantity > maxQuantity) return { ...base, status: 'issue', issue: 'insufficient' };
    return { ...base, status: 'ok' };
  });
}

/** Lines that count towards totals: everything priced except unavailable / sold-out items. */
export function pricedLines(resolved: ResolvedLine[]) {
  return resolved
    .filter((r) => r.unitBase !== undefined && r.issue !== 'out_of_stock' && r.issue !== 'unavailable')
    .map((r) => ({ unitBase: r.unitBase as Minor, quantity: r.line.quantity }));
}
