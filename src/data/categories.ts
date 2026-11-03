import type { Category, CategorySlug } from '@/types';

// Categories come from /api/categories, synced at startup. No bundled data.

export const CATEGORIES: Category[] = [];

export const CATEGORY_BY_SLUG: Record<CategorySlug, Category> = {} as Record<CategorySlug, Category>;

export function isCategorySlug(value: string | undefined): value is CategorySlug {
  return !!value && value in CATEGORY_BY_SLUG;
}

/** Replaces the category list with the live one from the store API.
 *  Called once at startup; on failure the list stays empty. */
export async function syncCategoriesFromApi(fetchLive: () => Promise<Category[]>): Promise<void> {
  try {
    const live = await fetchLive();
    if (!live.length) return;
    CATEGORIES.splice(0, CATEGORIES.length, ...live);
    for (const key of Object.keys(CATEGORY_BY_SLUG)) delete CATEGORY_BY_SLUG[key];
    for (const c of live) CATEGORY_BY_SLUG[c.slug] = c;
  } catch {
    /* keep empty list */
  }
}
