import { useMemo } from 'react';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { productService } from '@/services/productService';
import { useCart } from '@/store/cart';
import { usePreferences } from '@/store/preferences';
import type { ShippingMethodId } from '@/types';
import { pricedLines, resolveCartLines } from '@/utils/cart';
import { calculateTotals } from '@/utils/pricing';
import { getDemoTaxRate, getShippingQuote } from '@/utils/shipping';
import { useAsync } from './useAsync';

/**
 * Cart lines joined with live product data, plus totals in the active currency.
 * Used by the cart page, cart drawer and checkout so every view shows identical numbers.
 */
export function useCartDetails(options: { country?: string | null; shippingMethod?: ShippingMethodId } = {}) {
  const lines = useCart((s) => s.lines);
  const couponCode = useCart((s) => s.couponCode);
  const currency = usePreferences((s) => s.currency);

  const ids = useMemo(() => [...new Set(lines.map((l) => l.productId))].sort(), [lines]);
  const key = ids.length ? `catalog:cart:${ids.join(',')}` : null;
  const { data: products, isLoading, isError, reload } = useAsync(key, () => productService.getByIds(ids), { keepPrevious: true });

  const resolved = useMemo(() => resolveCartLines(lines, products, isLoading), [lines, products, isLoading]);

  const country = options.country ?? null;
  const quote = country ? getShippingQuote(country, options.shippingMethod ?? 'standard', currency, RATE_SNAPSHOT) : null;
  const totals = useMemo(
    () =>
      calculateTotals({
        lines: pricedLines(resolved),
        currency,
        snapshot: RATE_SNAPSHOT,
        couponCode,
        shipping: quote?.amount ?? null,
        taxRate: country ? getDemoTaxRate(country) : 0,
      }),
    [resolved, currency, couponCode, quote?.amount, country],
  );

  const hasIssues = resolved.some((r) => r.status === 'issue');
  const isResolving = resolved.some((r) => r.status === 'loading');

  return {
    lines: resolved,
    totals,
    quote,
    couponCode,
    currency,
    isEmpty: lines.length === 0,
    isLoading: isResolving,
    isError: isError && !products,
    hasIssues,
    reload,
  };
}
