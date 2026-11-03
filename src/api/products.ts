import type { Product } from '@/types';
import { apiClient } from './client';
import type { ProductListParams, ProductListResponse, ProductResponse } from './types';

// Endpoint functions for the public catalog. Paths are relative and carry the `/api` prefix once;
// the origin comes from api/config.ts.

/** Active products in active categories. Draft and archived products are never returned. */
export async function fetchProducts(params: ProductListParams = {}, signal?: AbortSignal): Promise<Product[]> {
  const { items } = await apiClient.get<ProductListResponse>('/api/products', { query: { ...params }, signal });
  return items;
}

/** One active product by slug. Throws ApiError('not_found') for draft, archived or unknown slugs. */
export function fetchProductBySlug(slug: string, signal?: AbortSignal): Promise<Product> {
  return apiClient.get<ProductResponse>(`/api/products/${encodeURIComponent(slug)}`, { signal });
}

export function fetchProductsByIds(ids: string[], signal?: AbortSignal): Promise<Product[]> {
  if (!ids.length) return Promise.resolve([]);
  return fetchProducts({ ids: ids.join(',') }, signal);
}
