import { apiClient } from "./client";

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
