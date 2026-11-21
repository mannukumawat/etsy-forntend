import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { walletApi } from '@/api/wallet';
import type { WalletTransaction } from '@/api/wallet';
import { usePreferences } from '@/store/preferences';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { formatDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';
import { useLanguage } from '@/hooks/useLocale';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

const TX_TYPE_STYLES: Record<string, string> = {
  topup: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  spend: 'bg-red-50 text-red-800 border-red-200',
  refund: 'bg-sky-50 text-sky-800 border-sky-200',
  reversal: 'bg-amber-50 text-amber-800 border-amber-200',
};

function TxIcon({ type }: { type: string }) {
  if (type === 'topup' || type === 'refund' || type === 'reversal') {
    return <ArrowDownLeft className="h-4 w-4 text-emerald-600" aria-hidden />;
  }
  return <ArrowUpRight className="h-4 w-4 text-red-500" aria-hidden />;
}

interface TopupModalProps {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

function TopupModal({ onClose, onSuccess }: TopupModalProps) {
  const { t } = useTranslation();
  const currency = usePreferences((s) => s.currency);
  const [amountMajor, setAmountMajor] = useState('');
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
      // Load Razorpay script if not already present
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
          } catch (e) {
            setError(t('wallet.verifyFailed', { defaultValue: 'Payment verification failed. Please contact support.' }));
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        prefill: {},
      });
      rzp.open();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('wallet.topupError', { defaultValue: 'Failed to initiate top-up.' });
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          {t('wallet.addMoney', { defaultValue: 'Add Money' })}
        </h2>
        <label className="block text-sm font-medium text-ink-soft mb-1">
          {t('wallet.amountLabel', { defaultValue: 'Amount', currency })}
        </label>
        <input
          type="number"
          min="1"
          step="1"
          className="input w-full mb-4"
          placeholder="10"
          value={amountMajor}
          onChange={(e) => setAmountMajor(e.target.value)}
          disabled={loading}
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="flex-1">
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={handleTopup} disabled={loading} className="flex-1">
            {loading ? t('common.processing', { defaultValue: 'Processing…' }) : t('wallet.proceed', { defaultValue: 'Proceed' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle(t('account.wallet', { defaultValue: 'My Wallet' }));

  const [page, setPage] = useState(1);
  const [showTopup, setShowTopup] = useState(false);
  const [balanceOverride, setBalanceOverride] = useState<number | null>(null);

  const { data: balData, error: balErr, isLoading: balLoading, reload: reloadBal } =
    useAsync(`wallet:balance:${user.id}`, walletApi.getBalance);

  const { data: txData, error: txErr, isLoading: txLoading, reload: reloadTx } =
    useAsync(`wallet:tx:${user.id}:${page}`, () => walletApi.listTransactions(page));

  // No numbered pagination: transactions accumulate page by page behind a
  // "Show more" button, like the Shop's infinite scroll. The server still
  // pages (page/pageSize); we just append each fetched page.
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  // Layout effect (not a plain effect) so the list is populated before paint:
  // otherwise the "No transactions yet" empty state flashes for one frame on
  // every page load.
  useLayoutEffect(() => {
    if (!txData) return;
    setAllTransactions((prev) => {
      if (page === 1) return txData.items;
      const seen = new Set(prev.map((tx) => tx.id));
      return [...prev, ...txData.items.filter((tx) => !seen.has(tx.id))];
    });
  }, [txData, page]);

  const topupEnabled = balData?.topupEnabled ?? false;
  const balanceMinor = balanceOverride ?? balData?.balanceMinor ?? 0;

  function handleTopupSuccess(newBalanceMinor: number) {
    setBalanceOverride(newBalanceMinor);
    setShowTopup(false);
    setPage(1);
    reloadTx();
    reloadBal();
  }

  if (balLoading) return <Spinner />;
  if (balErr) return <ErrorState onRetry={reloadBal} />;

  const transactions = allTransactions;

  return (
    <div className="space-y-6">
      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={handleTopupSuccess}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">
          {t('account.wallet', { defaultValue: 'My Wallet' })}
        </h1>
        {topupEnabled && (
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" aria-hidden />}
            onClick={() => setShowTopup(true)}
          >
            {t('wallet.addMoney', { defaultValue: 'Add Money' })}
          </Button>
        )}
      </div>

      {/* Balance card */}
      <div className="card flex items-center gap-4 p-5">
        <div className="rounded-xl bg-brand-50 p-3">
          <Wallet className="h-6 w-6 text-brand-600" aria-hidden />
        </div>
        <div>
          <p className="text-sm text-ink-soft">{t('wallet.availableBalance', { defaultValue: 'Available Balance' })}</p>
          <p className="text-3xl font-bold text-ink">{formatMoney(balanceMinor, 'USD', lang)}</p>
        </div>
      </div>

      {/* Transaction list */}
      <section aria-labelledby="tx-section">
        <h2 id="tx-section" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t('wallet.transactions', { defaultValue: 'Transactions' })}
        </h2>

        {txLoading && <Spinner />}
        {!!txErr && <ErrorState onRetry={reloadTx} />}

        {!txLoading && !txErr && transactions.length === 0 && (
          <EmptyState
            icon={<RotateCcw className="h-7 w-7" aria-hidden />}
            title={t('wallet.noTransactions', { defaultValue: 'No transactions yet' })}
          />
        )}

        {!txLoading && !txErr && transactions.length > 0 && (
          <ul className="space-y-2">
            {transactions.map((tx: WalletTransaction) => (
              <li key={tx.id}>
                <div className="card flex items-center gap-3 p-4">
                  <TxIcon type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        TX_TYPE_STYLES[tx.type] ?? TX_TYPE_STYLES.spend,
                      )}>
                        {t(`wallet.type.${tx.type}`, { defaultValue: tx.type })}
                      </span>
                      <span className="text-xs text-ink-muted truncate">{tx.reference}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">{formatDate(tx.createdAt, lang)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-semibold', tx.amountMinor >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                      {tx.amountMinor >= 0 ? '+' : ''}{formatMoney(tx.amountMinor, 'USD', lang)}
                    </p>
                    <p className="text-xs text-ink-muted">{t('wallet.balance', { defaultValue: 'Bal:' })} {formatMoney(tx.balanceAfter, 'USD', lang)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {txData && txData.pageCount > 1 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-ink-muted">
              {t('account.showingTransactions', { shown: transactions.length, total: txData.total })}
            </p>
            {page < txData.pageCount && (
              <Button variant="outline" size="sm" disabled={txLoading} onClick={() => setPage((p) => p + 1)}>
                {txLoading ? t('common.loading') : t('hub.showMore')}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
