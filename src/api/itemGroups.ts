import { apiClient } from "./client";
import type { Product } from "@/types";

export interface PublicItemGroup {
  id: string;
  nameEn: string;
  nameHi: string;
  slug: string;
  position: number;
  isActive: boolean;
  imageId: string | null;
}

export async function fetchItemGroups(signal?: AbortSignal): Promise<PublicItemGroup[]> {
  const { items } = await apiClient.get<{ items: PublicItemGroup[] }>("/api/item-groups", { signal });
  return items;
}

export type PublicItemGroupWithProducts = PublicItemGroup & { products: Product[] };

export async function fetchItemGroupsWithProducts(limit = 10, signal?: AbortSignal): Promise<PublicItemGroupWithProducts[]> {
  const { items } = await apiClient.get<{ items: PublicItemGroupWithProducts[] }>("/api/item-groups/with-products", {
    query: { limit },
    signal,
  });
  return items;
}
