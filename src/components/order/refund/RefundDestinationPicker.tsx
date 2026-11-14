import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
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
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    accountNumberConfirm: '',
    ifscCode: '',
  });
  const [addErr, setAddErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadAccounts = async () => {
    if (accounts !== null) return;
    setLoading(true);
    try {
      const res = await bankAccountsApi.list();
      setAccounts(res.items);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isCod) {
    return (
      <div className="rounded-md bg-sand-50 border border-sand-200 px-3 py-2 text-xs text-ink-muted">
        {t('returns.refundToOriginal', { defaultValue: 'Refund will be issued to your original payment method.' })}
      </div>
    );
  }

  if (accounts === null) {
    return (
      <button
        type="button"
        onClick={loadAccounts}
        disabled={loading}
        className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900 disabled:opacity-50"
      >
        {loading
          ? t('common.loading', { defaultValue: 'Loading…' })
          : t('returns.selectBankAccount', { defaultValue: 'Select bank account for refund' })}
      </button>
    );
  }

  const addAccount = async () => {
    if (!addForm.accountHolderName || !addForm.accountNumber || !addForm.ifscCode) {
      setAddErr(t('validation.required'));
      return;
    }
    if (addForm.accountNumber !== addForm.accountNumberConfirm) {
      setAddErr(t('returns.accountNumberMismatch', { defaultValue: 'Account numbers do not match.' }));
      return;
    }
    setAdding(true);
    setAddErr(null);
    try {
      const acct = await bankAccountsApi.add(addForm);
      setAccounts((prev) => [acct, ...(prev ?? [])]);
      onSelect(acct.id);
      setShowAdd(false);
    } catch (e: unknown) {
      setAddErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink">
        {t('returns.refundDestination', { defaultValue: 'Refund destination (bank transfer)' })}
      </p>
      {accounts.map((a) => (
        <label
          key={a.id}
          className={cn(
            'flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer',
            selectedAccountId === a.id ? 'border-brand-600 bg-brand-50' : 'border-sand-300 hover:border-brand-400',
          )}
        >
          <input
            type="radio"
            name="refundAccount"
            value={a.id}
            checked={selectedAccountId === a.id}
            onChange={() => onSelect(a.id)}
            className="sr-only"
          />
          <span className="flex-1">
            <span className="font-medium">{a.accountHolderName}</span>
            <span className="ml-2 text-ink-muted">{a.accountNumberMasked}</span>
            <span className="ml-2 text-ink-muted">· {a.ifscCode}</span>
          </span>
          {selectedAccountId === a.id && <Check className="h-3.5 w-3.5 text-brand-700" />}
        </label>
      ))}
      {accounts.length === 0 && !showAdd && (
        <p className="text-xs text-ink-muted">
          {t('returns.noBankAccounts', { defaultValue: 'No saved bank accounts.' })}
        </p>
      )}
      {!showAdd && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="text-xs text-brand-700 underline underline-offset-2 hover:text-brand-900"
        >
          {t('returns.addBankAccount', { defaultValue: '+ Add bank account' })}
        </button>
      )}
      {showAdd && (
        <div className="rounded-md border border-sand-200 p-3 space-y-2 text-xs">
          <p className="font-medium text-ink">
            {t('returns.newBankAccount', { defaultValue: 'New bank account' })}
          </p>
          <input
            value={addForm.accountHolderName}
            onChange={(e) => setAddForm((f) => ({ ...f, accountHolderName: e.target.value }))}
            placeholder={t('returns.accountHolderName', { defaultValue: 'Account holder name' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs"
          />
          <input
            value={addForm.accountNumber}
            onChange={(e) => setAddForm((f) => ({ ...f, accountNumber: e.target.value }))}
            placeholder={t('returns.accountNumber', { defaultValue: 'Account number' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs"
          />
          <input
            value={addForm.accountNumberConfirm}
            onChange={(e) => setAddForm((f) => ({ ...f, accountNumberConfirm: e.target.value }))}
            placeholder={t('returns.confirmAccountNumber', { defaultValue: 'Confirm account number' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs"
          />
          <input
            value={addForm.ifscCode}
            onChange={(e) => setAddForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
            placeholder={t('returns.ifscCode', { defaultValue: 'IFSC code' })}
            className="w-full rounded-md border border-sand-300 px-2 py-1.5 text-xs font-mono uppercase"
          />
          {addErr && <p className="text-red-700">{addErr}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={addAccount}
              disabled={adding}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
            >
              {adding ? t('common.saving') : t('returns.saveAccount', { defaultValue: 'Save account' })}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-md border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand-100"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
