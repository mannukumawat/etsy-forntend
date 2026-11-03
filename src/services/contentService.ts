import { API_MODE, fetchHomepageContent, fetchPageContent, type ContentPageKey } from "@/api";
import type { PublishedContentResponse, StorefrontHomepageContent, StorefrontPageContent } from "@/api/types";

// Published homepage/page content, backend-owned. In mock mode there is nothing to fetch — every
// consumer falls back to its existing i18next copy, which stays the single source of truth there.
const EMPTY = { published: false, content: null } as const;

export const contentService = {
  getHomepage(signal?: AbortSignal): Promise<PublishedContentResponse<StorefrontHomepageContent>> {
    if (!API_MODE) return Promise.resolve(EMPTY);
    return fetchHomepageContent(signal);
  },

  getPage(key: ContentPageKey, signal?: AbortSignal): Promise<PublishedContentResponse<StorefrontPageContent>> {
    if (!API_MODE) return Promise.resolve(EMPTY);
    return fetchPageContent(key, signal);
  },
};
