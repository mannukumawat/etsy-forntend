import { apiClient } from './client';

export interface WalletBalance {
  balancePaise: number;
  topupEnabled: boolean;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  type: 'topup' | 'spend' | 'refund' | 'reversal';
  amountPaise: number;
  balanceAfter: number;
  reference: string;
  orderId: string | null;
  topupId: string | null;
  note: string | null;
  createdAt: string;
}

export interface WalletTransactionList {
  items: WalletTransaction[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface TopupCreateResult {
  topupId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountPaise: number;
}

export interface TopupVerifyResult {
  alreadyCredited: boolean;
  balancePaise: number;
}

export const walletApi = {
  getBalance: (): Promise<WalletBalance> =>
    apiClient.get('/api/customer/wallet'),

  listTransactions: (page = 1, pageSize = 20): Promise<WalletTransactionList> =>
    apiClient.get('/api/customer/wallet/transactions', { query: { page, pageSize } }),

  createTopup: (amountPaise: number): Promise<TopupCreateResult> =>
    apiClient.post('/api/customer/wallet/topup/create', { amountPaise }),

  verifyTopup: (topupId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<TopupVerifyResult> =>
    apiClient.post('/api/customer/wallet/topup/verify', { topupId, razorpayPaymentId, razorpaySignature }),
};
