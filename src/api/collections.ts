import { apiClient } from "./client";
import type { Localized, Product } from "@/types";

export interface PublicCollectionCircle {
  label: Localized;
  image: string | null;
  href: string;
}

export interface PublicCollectionSection {
  title: Localized;
  products: Product[];
}

export interface PublicCollection {
  slug: string;
  title: Localized;
  subtitle: Localized;
  description: Localized;
  heroImage: string | null;
  heroColor: string;
  circles: PublicCollectionCircle[];
  sections: PublicCollectionSection[];
}

export function fetchCollection(slug: string, signal?: AbortSignal): Promise<PublicCollection> {
  return apiClient.get<PublicCollection>(`/api/collections/${encodeURIComponent(slug)}`, { signal });
}

export interface CollectionSummary {
  slug: string;
  title: Localized;
  image: string | null;
}

/** Published collections (title + cover photo) for the Categories menu. */
export async function fetchCollections(signal?: AbortSignal): Promise<CollectionSummary[]> {
  const { items } = await apiClient.get<{ items: CollectionSummary[] }>('/api/collections', { signal });
  return items;
}
