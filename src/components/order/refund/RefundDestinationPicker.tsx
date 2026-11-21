import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Building2, Smartphone } from 'lucide-react';
import type { BankAccount } from '@/types';
import { bankAccountsApi } from '@/api/bankAccounts';
import { upiApi, type UpiId } from '@/api/upi';
import { walletApi } from '@/api/wallet';
import { cn } from '@/utils/cn';
import { formatMoney } from '@/utils/money';
import { useLanguage } from '@/hooks/useLocale';

type Option =
  | { id: 'wallet'; label: string; sub: string; icon: typeof Wallet }
  | { id: string; label: string; sub: string; icon: typeof Building2 | typeof Smartphone }
  | { id: 'original'; label: string; sub: string; icon: typeof Wallet };

export function RefundDestinationPicker({
  selectedAccountId,
  onSelect,
}: {
  selectedAccountId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const lang = useLanguage();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [upiIds, setUpiIds] = useState<UpiId[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      const [walletResult, bankResult, upiResult] = await Promise.allSettled([
        walletApi.getBalance(),
        bankAccountsApi.list(),
        upiApi.list(),
      ]);
      if (cancelled) return;
      if (walletResult.status === 'fulfilled') setWalletBalance(walletResult.value.balanceMinor);
      if (bankResult.status === 'fulfilled') setBankAccounts(bankResult.value.items);
      if (upiResult.status === 'fulfilled') setUpiIds(upiResult.value.items);
      setLoading(false);
    };
    void fetchAll();
    return () => { cancelled = true; };
  }, []);

  const options: Option[] = [
    {
      id: 'wallet',
      label: t('returns.refundToWallet', { defaultValue: 'Store Wallet' }),
      sub: walletBalance !== null
        ? t('returns.walletCurrentBalance', { defaultValue: 'Current balance: {{balance}}', balance: formatMoney(walletBalance, 'USD', lang) })
        : t('returns.walletBalance', { defaultValue: 'Instant credit to your wallet' }),
      icon: Wallet,
    },
    ...bankAccounts.map((b) => ({
      id: `bank:${b.id}`,
      label: `${b.accountHolderName} — ••••${b.accountNumberMasked.slice(-4)}`,
      sub: `IFSC: ${b.ifscCode}`,
      icon: Building2 as typeof Building2,
    })),
    ...upiIds.map((u) => ({
      id: `upi:${u.id}`,
      label: u.holderName,
      sub: u.upiId,
      icon: Smartphone as typeof Smartphone,
    })),
    {
      id: 'original',
      label: t('returns.refundToOriginal', { defaultValue: 'Original payment method' }),
      sub: t('returns.refundToOriginalSub', { defaultValue: 'Refunded to the card/UPI used for the order' }),
      icon: Wallet,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-lg border border-sand-200 bg-white px-4 py-3 text-sm text-ink-muted animate-pulse">
        {t('common.loading', { defaultValue: 'Loading…' })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = selectedAccountId === opt.id;
        const Icon = opt.icon;
        return (
          <label
            key={opt.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
              selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-sand-200 bg-white hover:border-sand-400',
            )}
          >
            <input
              type="radio"
              name="refund-destination"
              className="sr-only"
              checked={selected}
              onChange={() => onSelect(opt.id)}
            />
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-brand-600' : 'text-ink-muted')} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', selected ? 'text-brand-800' : 'text-ink')}>{opt.label}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{opt.sub}</p>
            </div>
            <div className={cn('mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors', selected ? 'border-brand-600 bg-brand-600' : 'border-sand-400 bg-white')}>
              {selected && <div className="m-0.5 h-2.5 w-2.5 rounded-full bg-white" />}
            </div>
          </label>
        );
      })}
    </div>
  );
}
