import type { ReturnRequest } from '@/types';
import { apiClient } from './client';

export const returnsApi = {
  cancelItem: (orderId: string, lineId: string, data: { qty: number; reason: string; note?: string }) =>
    apiClient.post<{ success: true }>(`/api/customer/orders/${orderId}/lines/${lineId}/cancel`, data),

  createReturn: (data: {
    orderId: string;
    lineId: string;
    qty: number;
    reason: string;
    note?: string;
    photos?: string[];
    shippingMethod?: 'self_ship' | 'pickup';
    refundAccountId?: string;
  }) => apiClient.post<{ reference: string; return: ReturnRequest }>('/api/customer/returns', data),

  listReturns: (): Promise<{ items: ReturnRequest[] }> =>
    apiClient.get('/api/customer/returns'),

  getReturn: (ref: string): Promise<ReturnRequest> =>
    apiClient.get(`/api/customer/returns/${encodeURIComponent(ref)}`),

  withdrawReturn: (ref: string) =>
    apiClient.delete<{ success: true }>(`/api/customer/returns/${encodeURIComponent(ref)}`),
};
