import type { BankAccount } from '@/types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const csrf = () => document.cookie.match(/ys_csrf=([^;]+)/)?.[1] ?? '';
const headers = () => ({ 'content-type': 'application/json', 'x-csrf-token': csrf() });

async function handle<T>(r: Response): Promise<T> {
  if (r.ok) return r.json();
  const j = await r.json().catch(() => ({}));
  throw new Error((j as any).error?.message ?? (j as any).message ?? 'Something went wrong. Please try again.');
}

export const bankAccountsApi = {
  list: (): Promise<{ items: BankAccount[] }> =>
    fetch(`${BASE}/api/customer/bank-accounts`, { credentials: 'include' }).then(r => handle(r)),

  add: (data: {
    accountHolderName: string;
    accountNumber: string;
    accountNumberConfirm: string;
    ifscCode: string;
  }) =>
    fetch(`${BASE}/api/customer/bank-accounts`, {
      method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify(data),
    }).then(r => handle<BankAccount>(r)),

  remove: (id: string) =>
    fetch(`${BASE}/api/customer/bank-accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: headers(), credentials: 'include',
    }).then(r => handle<{ ok: true }>(r)),
};
