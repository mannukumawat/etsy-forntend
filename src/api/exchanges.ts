import type { ExchangeRequest } from '@/types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const csrf = () => document.cookie.match(/ys_csrf=([^;]+)/)?.[1] ?? '';
const headers = () => ({ 'content-type': 'application/json', 'x-csrf-token': csrf() });

async function handle<T>(r: Response): Promise<T> {
  if (r.ok) return r.json();
  const j = await r.json().catch(() => ({}));
  throw new Error((j as any).error?.message ?? (j as any).message ?? 'Something went wrong. Please try again.');
}

export const exchangesApi = {
  createExchange: (data: {
    orderId: string; lineId: string; qty: number; reason: string;
    note?: string; replacementVariantId: string;
  }) =>
    fetch(`${BASE}/api/customer/exchanges`, {
      method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify(data),
    }).then(r => handle<ExchangeRequest>(r)),

  listExchanges: (): Promise<{ items: ExchangeRequest[] }> =>
    fetch(`${BASE}/api/customer/exchanges`, { credentials: 'include' }).then(r => handle(r)),

  getExchange: (ref: string): Promise<ExchangeRequest> =>
    fetch(`${BASE}/api/customer/exchanges/${encodeURIComponent(ref)}`, { credentials: 'include' }).then(r => handle(r)),

  withdrawExchange: (ref: string) =>
    fetch(`${BASE}/api/customer/exchanges/${encodeURIComponent(ref)}`, {
      method: 'DELETE', headers: headers(), credentials: 'include',
    }).then(r => handle<{ ok: true }>(r)),
};
