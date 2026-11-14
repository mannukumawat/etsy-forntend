import type { ExchangeRequest } from '@/types';
import { apiClient } from './client';

export const exchangesApi = {
  createExchange: (data: {
    orderId: string;
    lineId: string;
    qty: number;
    reason: string;
    note?: string;
    replacementVariantId: string;
  }) => apiClient.post<ExchangeRequest>('/api/customer/exchanges', data),

  listExchanges: (): Promise<{ items: ExchangeRequest[] }> =>
    apiClient.get('/api/customer/exchanges'),

  getExchange: (ref: string): Promise<ExchangeRequest> =>
    apiClient.get(`/api/customer/exchanges/${encodeURIComponent(ref)}`),

  withdrawExchange: (ref: string) =>
    apiClient.delete<{ ok: true }>(`/api/customer/exchanges/${encodeURIComponent(ref)}`),
};
