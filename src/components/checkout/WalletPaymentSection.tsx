import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet } from 'lucide-react';

/** Format INR paise as ₹X.XX */
function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(paise / 100);
}

interface WalletPaymentSectionProps {
  /** Customer's current wallet balance in paise. */
  walletBalancePaise: number;
  /** Max applicable wallet amount for this order (paise). 0 means balance is insufficient. */
  maxApplicablePaise: number;
  /** Order total in paise (INR only). */
  orderTotalPaise: number;
  /** Whether the wallet is currently selected for full payment. */
  useWallet: boolean;
  /** Callback when checkbox toggles. */
  onChange: (useWallet: boolean) => void;
}

/**
 * Shown in the checkout payment step for signed-in customers who have a wallet balance.
 * Supports full wallet payment only (no split payment).
 */
export function WalletPaymentSection({
  walletBalancePaise,
  maxApplicablePaise,
  orderTotalPaise,
  useWallet,
  onChange,
}: WalletPaymentSectionProps) {
  const { t } = useTranslation();

  const canCover = maxApplicablePaise >= orderTotalPaise;

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-brand-100 p-1.5">
          <Wallet className="h-4 w-4 text-brand-600" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {t('checkout.walletTitle', { defaultValue: 'Pay with Store Wallet' })}
            </p>
            <span className="text-sm font-bold text-brand-700">
              {formatPaise(walletBalancePaise)} {t('checkout.walletAvailable', { defaultValue: 'available' })}
            </span>
          </div>

          {canCover ? (
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sand-300 text-brand-600 focus:ring-brand-500"
                checked={useWallet}
                onChange={(e) => onChange(e.target.checked)}
              />
              {t('checkout.walletApply', { defaultValue: 'Use wallet balance for this order' })}
              <span className="ml-1 text-emerald-700 font-medium">({formatPaise(orderTotalPaise)})</span>
            </label>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-amber-700">
                {t('checkout.walletInsufficient', {
                  defaultValue: 'Insufficient balance. Add more to pay with wallet.',
                })}
              </p>
              <Link
                to="/account/wallet"
                className="mt-1 inline-block text-xs text-brand-600 underline hover:text-brand-800"
              >
                {t('checkout.walletAddMore', { defaultValue: 'Add money to wallet →' })}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
