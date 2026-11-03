import { apiClient } from "./client";
import type { PublicSettingsResponse, PublishedContentResponse, StorefrontHomepageContent, StorefrontPageContent } from "./types";

/** Published homepage content, or `{ published: false }` when nothing has been published yet. */
export function fetchHomepageContent(signal?: AbortSignal): Promise<PublishedContentResponse<StorefrontHomepageContent>> {
  return apiClient.get<PublishedContentResponse<StorefrontHomepageContent>>("/api/content/homepage", { signal });
}

const PAGE_KEYS = ["about", "contact", "faq", "shipping", "returns", "privacy", "terms"] as const;
export type ContentPageKey = (typeof PAGE_KEYS)[number];

/** Published content for one of the 7 fixed info/policy pages. */
export function fetchPageContent(key: ContentPageKey, signal?: AbortSignal): Promise<PublishedContentResponse<StorefrontPageContent>> {
  return apiClient.get<PublishedContentResponse<StorefrontPageContent>>(`/api/content/pages/${key}`, { signal });
}

export function fetchPublicSettings(signal?: AbortSignal): Promise<PublicSettingsResponse> {
  return apiClient.get<PublicSettingsResponse>("/api/settings", { signal });
}
