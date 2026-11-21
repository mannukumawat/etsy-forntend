import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { walletApi } from '@/api/wallet';
import { usePreferences } from '@/store/preferences';

interface WalletTopupModalProps {
  /** Pre-fill the amount field with this value in display-currency major units (e.g. the shortfall). */
  suggestedMajor?: number;
  onClose: () => void;
  /** Called with the new wallet balance (USD cents) after a successful topup. */
  onSuccess: (newBalanceMinor: number) => void;
}

export function WalletTopupModal({ suggestedMajor, onClose, onSuccess }: WalletTopupModalProps) {
  const { t } = useTranslation();
  const currency = usePreferences((s) => s.currency);
  const [amountMajor, setAmountMajor] = useState(suggestedMajor ? String(Math.ceil(suggestedMajor)) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopup() {
    const amount = parseFloat(amountMajor);
    if (!amount || amount <= 0) {
      setError(t('wallet.invalidAmount', { defaultValue: 'Enter a valid amount.' }));
      return;
    }
    const amountMinor = Math.round(amount * 100);
    setLoading(true);
    setError(null);
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Razorpay.'));
          document.head.appendChild(s);
        });
      }
      const { topupId, razorpayOrderId, razorpayKeyId, amountMinor: actualMinor, currency: actualCurrency } = await walletApi.createTopup(amountMinor, currency);
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: actualMinor,
        currency: actualCurrency,
        name: t('wallet.topupTitle', { defaultValue: 'Add Money to Wallet' }),
        description: t('wallet.topupDesc', { defaultValue: 'Wallet top-up' }),
        order_id: razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
          setLoading(true);
          try {
            const result = await walletApi.verifyTopup(topupId, response.razorpay_payment_id, response.razorpay_signature);
            onSuccess(result.balanceMinor);
          } catch {
            setError(t('wallet.verifyFailed', { defaultValue: 'Verification failed. Contact support.' }));
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        prefill: {},
      });
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('wallet.topupError', { defaultValue: 'Failed to initiate top-up.' }));
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">
            {t('wallet.addMoney', { defaultValue: 'Add Money to Wallet' })}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-ink-muted hover:bg-sand-100" disabled={loading}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-ink-soft">
          {t('wallet.amountLabel', { defaultValue: 'Amount', currency })}
        </label>
        <input
          type="number"
          min="1"
          step="1"
          className="input mb-4 w-full"
          placeholder="10"
          value={amountMajor}
          onChange={(e) => setAmountMajor(e.target.value)}
          disabled={loading}
          autoFocus
        />

        {/* Quick amount buttons — currency-specific */}
        <div className="mb-4 flex flex-wrap gap-2">
          {({ USD: [5, 10, 25, 50], INR: [100, 200, 500, 1000], EUR: [5, 10, 25, 50], GBP: [5, 10, 20, 50] }[currency] ?? [5, 10, 25, 50]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmountMajor(String(v))}
              className="rounded-full border border-sand-300 px-3 py-1 text-xs font-medium text-ink hover:border-brand-600 hover:text-brand-700"
              disabled={loading}
            >
              {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="flex-1">
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={handleTopup} loading={loading} className="flex-1">
            {t('wallet.proceed', { defaultValue: 'Add Money' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
