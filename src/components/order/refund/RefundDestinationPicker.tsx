import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Check, Landmark } from 'lucide-react';
import { bankAccountsApi } from '@/api/bankAccounts';
import type { BankAccount } from '@/types';
import { cn } from '@/utils/cn';

export function RefundDestinationPicker({
  isCod,
  selectedAccountId,
  onSelect,
}: {
  isCod: boolean;
  selectedAccountId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(isCod);

  useEffect(() => {
    if (!isCod) return;
    let active = true;
    setLoading(true);
    bankAccountsApi.list()
      .then((res) => {
        if (active) setAccounts(res.items);
      })
      .catch(() => {
        if (active) setAccounts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isCod]);

  if (!isCod) {
    return (
      <div className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs text-ink-muted">
        {t('returns.refundToOriginal', { defaultValue: 'Refund will be issued to your original payment method.' })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white px-4 py-3 text-xs text-ink-muted">
        {t('common.loading', { defaultValue: 'Loading…' })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-ink">
          {t('returns.refundDestination', { defaultValue: 'Refund destination (bank transfer)' })}
        </p>
        <Link to="/account/bank-upi" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
          {t('returns.manageBankAccounts', { defaultValue: 'Manage accounts' })}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {accounts.map((account) => (
        <label
          key={account.id}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-xs transition-colors',
            selectedAccountId === account.id ? 'border-ink ring-1 ring-ink' : 'border-sand-300 hover:border-ink',
          )}
        >
          <input type="radio" name="refundAccount" value={account.id} checked={selectedAccountId === account.id}
            onChange={() => onSelect(account.id)} className="sr-only" />
          <Landmark className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">{account.accountHolderName}</span>
            <span className="mt-0.5 block text-ink-muted">{account.accountNumberMasked} · {account.ifscCode}</span>
          </span>
          <span className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selectedAccountId === account.id ? 'border-ink bg-ink text-white' : 'border-sand-300 text-transparent',
          )}>
            <Check className="h-3 w-3" aria-hidden />
          </span>
        </label>
      ))}

      {accounts.length === 0 && (
        <div className="rounded-xl border border-dashed border-sand-300 bg-white px-4 py-4 text-center">
          <Landmark className="mx-auto h-5 w-5 text-ink-muted" aria-hidden />
          <p className="mt-2 text-xs text-ink-muted">
            {t('returns.noBankAccounts', { defaultValue: 'No saved bank accounts.' })}
          </p>
          <Link to="/account/bank-upi" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90">
            {t('returns.addBankAccount', { defaultValue: 'Add bank account in Bank & UPI' })}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
