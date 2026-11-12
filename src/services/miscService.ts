import { apiClient } from '@/api';

export interface HelpCategory {
  id: string; slug: string;
  name: { en: string; hi: string };
  description: { en: string; hi: string };
  icon: string; position: number; isActive: boolean;
}
export interface HelpArticle {
  id: string; categoryId: string; slug: string;
  title: { en: string; hi: string };
  body: { en: string; hi: string };
  position: number; isActive: boolean;
}

export const helpService = {
  getCategories: () => apiClient.get<{ items: HelpCategory[] }>('/api/help/categories'),
  getCategory: (slug: string) => apiClient.get<{ category: HelpCategory; articles: HelpArticle[] }>(`/api/help/categories/${slug}`),
  getArticle: (catSlug: string, slug: string) => apiClient.get<{ category: HelpCategory; article: HelpArticle }>(`/api/help/categories/${catSlug}/articles/${slug}`),
};

export const newsletterService = {
  subscribe(email: string): Promise<{ ok: true }> {
    return apiClient.post<{ ok: true }>('/api/newsletter', { email });
  },
};

export const contactService = {
  send(message: { name: string; email: string; subject: string; message: string }): Promise<{ reference: string }> {
    return apiClient.post<{ reference: string }>('/api/contact', message);
  },
};
