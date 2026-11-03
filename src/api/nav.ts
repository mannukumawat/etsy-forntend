import { apiClient } from "./client";
import type { Localized } from "@/types";

export interface PublicNavLink {
  id: string;
  label: Localized;
  href: string;
}

export async function fetchNavLinks(signal?: AbortSignal): Promise<PublicNavLink[]> {
  const { items } = await apiClient.get<{ items: PublicNavLink[] }>("/api/nav-links", { signal });
  return items;
}
