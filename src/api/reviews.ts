import type { OwnReview, Review, ReviewInput, ReviewPage, ReviewSort } from '@/types';
import { apiClient } from './client';

// Public: published reviews only, no private customer fields.
export function fetchProductReviews(slug: string, params: { page?: number; pageSize?: number; sort?: ReviewSort; rating?: number | null } = {}, signal?: AbortSignal) {
  return apiClient.get<ReviewPage>(`/api/products/${encodeURIComponent(slug)}/reviews`, {
    query: { page: params.page, pageSize: params.pageSize, sort: params.sort, rating: params.rating ?? undefined },
    signal,
  });
}

// Signed-in customer: eligibility is decided by the server from their delivered orders.
export function fetchMyProductReview(productId: string, signal?: AbortSignal) {
  return apiClient.get<{ eligible: boolean; review: OwnReview | null }>(`/api/customer/reviews/product/${encodeURIComponent(productId)}`, { signal });
}

export async function createReview(productId: string, input: ReviewInput): Promise<OwnReview> {
  const { review } = await apiClient.post<{ review: OwnReview }>('/api/customer/reviews', { productId, ...input });
  return review;
}

export async function updateReview(id: string, input: ReviewInput): Promise<OwnReview> {
  const { review } = await apiClient.put<{ review: OwnReview }>(`/api/customer/reviews/${encodeURIComponent(id)}`, input);
  return review;
}

export async function deleteReview(id: string): Promise<void> {
  await apiClient.delete(`/api/customer/reviews/${encodeURIComponent(id)}`);
}

export async function uploadReviewPhoto(file: File): Promise<{ id: string; url: string }> {
  const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/customer/reviews/upload-photo`, {
    method: 'POST',
    headers: { 'content-type': file.type, 'x-csrf-token': document.cookie.match(/ys_csrf=([^;]+)/)?.[1] ?? '' },
    credentials: 'include',
    body: file,
  });
  if (!resp.ok) { const j = await resp.json().catch(() => ({})); throw new Error((j as any).message ?? 'Upload failed'); }
  return resp.json();
}

export interface StoreReview extends Review {
  product: { slug: string; name: { en: string; hi: string }; image: string | null };
}

export function fetchStoreReviews(params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) {
  return apiClient.get<{ items: StoreReview[]; total: number; page: number; pageCount: number; pageSize: number; summary: { average: number; count: number } }>('/api/reviews', {
    query: { page: params.page, pageSize: params.pageSize },
    signal,
  });
}
