import { apiClient } from './client';

export interface UpiId {
  id: string;
  upiId: string;
  holderName: string;
  createdAt: string;
}

export const upiApi = {
  list: (): Promise<{ items: UpiId[] }> => apiClient.get('/api/customer/upi-ids'),
  add: (data: { upiId: string; holderName: string }): Promise<UpiId> => apiClient.post('/api/customer/upi-ids', data),
  remove: (id: string): Promise<{ ok: true }> => apiClient.delete(`/api/customer/upi-ids/${encodeURIComponent(id)}`),
};
