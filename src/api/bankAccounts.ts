import type { BankAccount } from '@/types';
import { API_BASE_URL } from './config';
import { getCsrfToken } from './client';

const headers = () => ({ 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() ?? '' });

function errorMessage(j: unknown): string | undefined {
  if (typeof j !== 'object' || j === null) return undefined;
  const o = j as Record<string, unknown>;
  const nested = o.error;
  if (typeof nested === 'object' && nested !== null && typeof (nested as Record<string, unknown>).message === 'string') {
    return (nested as Record<string, unknown>).message as string;
  }
  return typeof o.message === 'string' ? o.message : undefined;
}

async function handle<T>(r: Response): Promise<T> {
  if (r.ok) return r.json();
  const j: unknown = await r.json().catch(() => ({}));
  throw new Error(errorMessage(j) ?? 'Something went wrong. Please try again.');
}

export const bankAccountsApi = {
  list: (): Promise<{ items: BankAccount[] }> =>
    fetch(`${API_BASE_URL}/api/customer/bank-accounts`, { credentials: 'include' }).then(r => handle(r)),

  add: (data: {
    accountHolderName: string;
    accountNumber: string;
    accountNumberConfirm: string;
    ifscCode: string;
  }) =>
    fetch(`${API_BASE_URL}/api/customer/bank-accounts`, {
      method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify(data),
    }).then(r => handle<BankAccount>(r)),

  remove: (id: string) =>
    fetch(`${API_BASE_URL}/api/customer/bank-accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: headers(), credentials: 'include',
    }).then(r => handle<{ ok: true }>(r)),
};
