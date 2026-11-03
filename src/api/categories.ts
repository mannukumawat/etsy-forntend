import type { Category } from "@/types";
import { apiClient } from "./client";
import type { CategoryListResponse } from "./types";

/** Active categories, in display order. */
export async function fetchCategories(
  signal?: AbortSignal
): Promise<Category[]> {
  const { items } = await apiClient.get<CategoryListResponse>(
    "/api/categories",
    { signal }
  );
  return items;
}
