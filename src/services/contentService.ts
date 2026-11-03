import { fetchHomepageContent, fetchPageContent, type ContentPageKey } from "@/api";
import type { PublishedContentResponse, StorefrontHomepageContent, StorefrontPageContent } from "@/api/types";

export const contentService = {
  getHomepage(signal?: AbortSignal): Promise<PublishedContentResponse<StorefrontHomepageContent>> {
    return fetchHomepageContent(signal);
  },

  getPage(key: ContentPageKey, signal?: AbortSignal): Promise<PublishedContentResponse<StorefrontPageContent>> {
    return fetchPageContent(key, signal);
  },
};
