import type { Product } from '@/types';

// Products are managed through the admin panel and served by the backend API.
// This file intentionally contains no sample data.

export const PRODUCTS: Product[] = [];
export const PRODUCT_BY_ID: Record<string, Product> = {};
export const PRODUCT_BY_SLUG: Record<string, Product> = {};
