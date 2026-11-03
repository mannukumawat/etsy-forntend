import type { ReturnRequest } from '@/types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const csrf = () => document.cookie.match(/ys_csrf=([^;]+)/)?.[1] ?? '';
const headers = () => ({ 'content-type': 'application/json', 'x-csrf-token': csrf() });

async function handle<T>(r: Response): Promise<T> {
  if (r.ok) return r.json();
  const j = await r.json().catch(() => ({}));
  throw new Error((j as any).message ?? 'Error');
}

export const returnsApi = {
  cancelItem: (orderId: string, lineId: string, data: { qty: number; reason: string; note?: string }) =>
    fetch(`${BASE}/api/customer/orders/${orderId}/lines/${lineId}/cancel`, {
      method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify(data),
    }).then(r => handle<{ success: true }>(r)),

  createReturn: (data: {
    orderId: string; lineId: string; qty: number; reason: string;
    note?: string; photos?: string[]; shippingMethod?: 'self_ship' | 'pickup';
  }) =>
    fetch(`${BASE}/api/customer/returns`, {
      method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify(data),
    }).then(r => handle<{ reference: string; return: ReturnRequest }>(r)),

  listReturns: (): Promise<{ items: ReturnRequest[] }> =>
    fetch(`${BASE}/api/customer/returns`, { credentials: 'include' }).then(r => handle(r)),

  getReturn: (ref: string): Promise<ReturnRequest> =>
    fetch(`${BASE}/api/customer/returns/${encodeURIComponent(ref)}`, { credentials: 'include' }).then(r => handle(r)),

  withdrawReturn: (ref: string) =>
    fetch(`${BASE}/api/customer/returns/${encodeURIComponent(ref)}`, {
      method: 'DELETE', headers: headers(), credentials: 'include',
    }).then(r => handle<{ success: true }>(r)),
};
