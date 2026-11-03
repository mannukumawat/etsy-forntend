import { apiClient } from '@/api';

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
