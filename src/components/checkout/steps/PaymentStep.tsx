import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, CreditCard, Smartphone, Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { WalletTopupModal } from '@/components/checkout/WalletTopupModal';
import { useCheckout, useAuth } from '@/store/session';
import { walletApi } from '@/api/wallet';
import type { PaymentMethodPreview } from '@/types';
import { cn } from '@/utils/cn';

const RAZORPAY_CONFIGURED = Boolean((import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)?.trim());

function formatPaise(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(paise / 100);
}

interface PaymentStepProps {
  onBack: () => void;
  onPlace: () => void;
  walletInfo?: { balancePaise: number; maxApplicablePaise: number } | null;
  total: string;
  submitting: boolean;
  error: string | null;
  blocked: boolean;
}

type WalletMode = 'full' | 'partial' | null;

const NON_WALLET_METHODS: { id: PaymentMethodPreview; icon: typeof CreditCard; descKey: string }[] = [
  { id: 'card', icon: CreditCard, descKey: 'checkout.paymentMethods.card' },
  { id: 'upi', icon: Smartphone, descKey: 'checkout.paymentMethods.upi' },
];

export function PaymentStep({ onBack, onPlace, walletInfo, total, submitting, error, blocked }: PaymentStepProps) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const method = useCheckout((s) => s.paymentMethod);
  const setMethod = useCheckout((s) => s.setPaymentMethod);
  const walletBalancePaise = useCheckout((s) => s.walletBalancePaise);
  const setWalletBalance = useCheckout((s) => s.setWalletBalance);
  const useWallet = useCheckout((s) => s.useWallet);
  const setUseWallet = useCheckout((s) => s.setUseWallet);
  const walletPartialPaise = useCheckout((s) => s.walletPartialPaise);
  const setWalletPartialPaise = useCheckout((s) => s.setWalletPartialPaise);

  const [showTopup, setShowTopup] = useState(false);
  const [walletMode, setWalletMode] = useState<WalletMode>(null);

  useEffect(() => {
    if (!user) return;
    walletApi.getBalance().then((b) => setWalletBalance(b.balancePaise)).catch(() => {});
  }, [user, setWalletBalance]);

  const balance = walletInfo?.balancePaise ?? walletBalancePaise ?? 0;
  const orderTotalPaise = walletInfo?.maxApplicablePaise ?? 0;
  const canCoverFull = balance >= orderTotalPaise && orderTotalPaise > 0;
  const hasPartialBalance = balance > 0 && balance < orderTotalPaise;
  const shortfallRupees = orderTotalPaise > 0 ? Math.ceil((orderTotalPaise - balance) / 100) : 0;

  const walletSelected = method === 'wallet';

  function selectWallet() {
    setMethod('wallet');
    setUseWallet(false);
    setWalletPartialPaise(null);
    setWalletMode(null);
  }

  function pickWalletMode(mode: WalletMode) {
    setWalletMode(mode);
    if (mode === 'full') {
      setUseWallet(true);
      setWalletPartialPaise(null);
    } else if (mode === 'partial') {
      setUseWallet(false);
      setWalletPartialPaise(balance);
    } else {
      setUseWallet(false);
      setWalletPartialPaise(null);
    }
  }

  function onTopupSuccess(newBalance: number) {
    setWalletBalance(newBalance);
    setShowTopup(false);
  }

  const placeDisabled = blocked || (
    method === 'wallet'
      ? (!useWallet && !walletPartialPaise)
      : !RAZORPAY_CONFIGURED
  );

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-base font-semibold text-ink">
          {t('checkout.paymentTitle')}
        </legend>
        <div className="divide-y divide-sand-100 overflow-hidden rounded-xl border border-sand-200 bg-white">

          {/* Wallet row — only for signed-in users */}
          {user && (
            <>
              <div
                role="radio"
                aria-checked={walletSelected}
                tabIndex={0}
                onClick={selectWallet}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectWallet()}
                className={cn(
                  'flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors',
                  walletSelected ? 'bg-brand-50/40' : 'hover:bg-sand-50',
                )}
              >
                <Wallet className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {t('checkout.paymentMethods.wallet', { defaultValue: 'Store Wallet' })}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {balance > 0
                      ? t('checkout.walletBalance', { balance: formatPaise(balance), defaultValue: `Balance: ${formatPaise(balance)}` })
                      : t('checkout.walletEmpty', { defaultValue: 'No balance — tap to add money' })}
                  </p>
                </div>
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  walletSelected ? 'border-brand-600 bg-brand-600' : 'border-sand-300 bg-white',
                )}>
                  {walletSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </div>

              {/* Expanded wallet panel */}
              {walletSelected && (
                <div className="bg-brand-50/30 px-4 py-4 space-y-3">
                  {/* Case 1: No balance */}
                  {balance === 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-amber-700">
                        {t('checkout.walletNoFunds', { defaultValue: 'Wallet is empty. Add money to pay.' })}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setShowTopup(true)} icon={<Plus className="h-3.5 w-3.5" />}>
                        {t('wallet.addMoney', { defaultValue: 'Add Money' })}
                      </Button>
                    </div>
                  )}

                  {/* Case 2: Balance covers full order */}
                  {canCoverFull && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">
                        {t('checkout.walletChooseHow', { defaultValue: 'How would you like to pay?' })}
                      </p>
                      <label className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors',
                        walletMode === 'full' ? 'border-brand-400 bg-white' : 'border-sand-200 bg-white hover:border-brand-200',
                      )}>
                        <input type="radio" name="wallet-mode" className="sr-only" checked={walletMode === 'full'} onChange={() => pickWalletMode('full')} />
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2', walletMode === 'full' ? 'border-brand-600 bg-brand-600' : 'border-sand-300')}>
                          {walletMode === 'full' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">
                            {t('checkout.walletFullPay', { amount: formatPaise(orderTotalPaise), defaultValue: `Pay full ${formatPaise(orderTotalPaise)} from wallet` })}
                          </p>
                          <p className="text-xs text-emerald-700">
                            {t('checkout.walletAfter', { after: formatPaise(balance - orderTotalPaise), defaultValue: `Remaining balance: ${formatPaise(balance - orderTotalPaise)}` })}
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Case 3: Partial balance */}
                  {hasPartialBalance && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">
                        {t('checkout.walletChooseHow', { defaultValue: 'How would you like to pay?' })}
                      </p>

                      {/* Option A: use partial + pay rest */}
                      <label className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors',
                        walletMode === 'partial' ? 'border-brand-400 bg-white' : 'border-sand-200 bg-white hover:border-brand-200',
                      )}>
                        <input type="radio" name="wallet-mode" className="sr-only" checked={walletMode === 'partial'} onChange={() => pickWalletMode('partial')} />
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2', walletMode === 'partial' ? 'border-brand-600 bg-brand-600' : 'border-sand-300')}>
                          {walletMode === 'partial' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">
                            {t('checkout.walletPartialUse', { wallet: formatPaise(balance), rest: formatPaise(orderTotalPaise - balance), defaultValue: `Use ${formatPaise(balance)} from wallet + pay ${formatPaise(orderTotalPaise - balance)} via card/UPI` })}
                          </p>
                          <p className="text-xs text-ink-muted">{t('checkout.walletPartialNote', { defaultValue: 'Remaining will be charged via Razorpay.' })}</p>
                        </div>
                      </label>

                      {/* Option B: add money */}
                      <div className={cn(
                        'flex items-center justify-between gap-3 rounded-lg border border-sand-200 bg-white px-3 py-3',
                      )}>
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {t('checkout.walletAddShortfall', { amount: `₹${shortfallRupees}`, defaultValue: `Add ₹${shortfallRupees} to wallet` })}
                          </p>
                          <p className="text-xs text-ink-muted">{t('checkout.walletThenFullPay', { defaultValue: 'Then pay full order from wallet.' })}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowTopup(true)} icon={<Plus className="h-3.5 w-3.5" />}>
                          {t('wallet.addMoney', { defaultValue: 'Add' })}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Card & UPI rows */}
          {NON_WALLET_METHODS.map(({ id, icon: Icon, descKey }) => (
            <label key={id} className={cn(
              'flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-sand-50',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600',
              method === id && 'bg-brand-50/40',
            )}>
              <input
                type="radio"
                name="payment-method"
                className="sr-only"
                checked={method === id}
                disabled={!RAZORPAY_CONFIGURED}
                onChange={() => { setMethod(id); setUseWallet(false); setWalletPartialPaise(null); }}
              />
              <Icon className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
              <div className="flex-1">
                <p className={cn('text-sm font-medium', !RAZORPAY_CONFIGURED ? 'text-ink-muted' : 'text-ink')}>{t(descKey)}</p>
                <p className="text-xs text-ink-muted">
                  {!RAZORPAY_CONFIGURED ? t('checkout.gatewayNotConfigured') : total}
                </p>
              </div>
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                method === id ? 'border-brand-600 bg-brand-600' : 'border-sand-300 bg-white',
              )}>
                {method === id && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
            </label>
          ))}
        </div>

        {RAZORPAY_CONFIGURED && method !== 'wallet' && (
          <p className="mt-2 text-xs text-ink-muted">
            {t('checkout.razorpayNote', { defaultValue: 'You will be redirected to Razorpay to complete payment securely.' })}
          </p>
        )}
      </fieldset>

      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}

      {/* Sticky footer on mobile, static on desktop */}
      <div className="mobile-action-bar fixed inset-x-0 bottom-0 z-50 border-t border-sand-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(45,37,29,0.08)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" aria-hidden />} disabled={submitting} className="shrink-0">
            {t('common.back')}
          </Button>
          <div className="flex shrink-0 items-center gap-3">
            {total && <span className="hidden text-sm font-semibold text-ink sm:block">{total}</span>}
            <Button size="lg" onClick={onPlace} loading={submitting} disabled={placeDisabled} icon={!submitting ? <Lock className="h-4 w-4" aria-hidden /> : undefined}>
              {submitting ? t('checkout.placingReal') : t('checkout.placeOrderReal', { total, defaultValue: 'Place Order' })}
            </Button>
          </div>
        </div>
      </div>
      <div className="h-20 sm:hidden" aria-hidden />

      {showTopup && (
        <WalletTopupModal
          suggestedRupees={shortfallRupees || undefined}
          onClose={() => setShowTopup(false)}
          onSuccess={onTopupSuccess}
        />
      )}
    </div>
  );
}
