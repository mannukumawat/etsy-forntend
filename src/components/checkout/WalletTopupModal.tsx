import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { walletApi } from '@/api/wallet';

interface WalletTopupModalProps {
  /** Pre-fill the amount field with this value in rupees (e.g. the shortfall). */
  suggestedRupees?: number;
  onClose: () => void;
  /** Called with the new balance after a successful topup. */
  onSuccess: (newBalancePaise: number) => void;
}

export function WalletTopupModal({ suggestedRupees, onClose, onSuccess }: WalletTopupModalProps) {
  const { t } = useTranslation();
  const [amountRupees, setAmountRupees] = useState(suggestedRupees ? String(Math.ceil(suggestedRupees)) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopup() {
    const amount = parseFloat(amountRupees);
    if (!amount || amount <= 0) {
      setError(t('wallet.invalidAmount', { defaultValue: 'Enter a valid amount.' }));
      return;
    }
    const amountPaise = Math.round(amount * 100);
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
      const { topupId, razorpayOrderId, razorpayKeyId, amountPaise: actualPaise } = await walletApi.createTopup(amountPaise);
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: actualPaise,
        currency: 'INR',
        name: t('wallet.topupTitle', { defaultValue: 'Add Money to Wallet' }),
        description: t('wallet.topupDesc', { defaultValue: 'Wallet top-up' }),
        order_id: razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
          setLoading(true);
          try {
            const result = await walletApi.verifyTopup(topupId, response.razorpay_payment_id, response.razorpay_signature);
            onSuccess(result.balancePaise);
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
          {t('wallet.amountLabel', { defaultValue: 'Amount (₹)' })}
        </label>
        <input
          type="number"
          min="1"
          step="1"
          className="input mb-4 w-full"
          placeholder="100"
          value={amountRupees}
          onChange={(e) => setAmountRupees(e.target.value)}
          disabled={loading}
          autoFocus
        />

        {/* Quick amount buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[100, 200, 500, 1000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmountRupees(String(v))}
              className="rounded-full border border-sand-300 px-3 py-1 text-xs font-medium text-ink hover:border-brand-600 hover:text-brand-700"
              disabled={loading}
            >
              ₹{v}
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
