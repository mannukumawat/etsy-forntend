import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Trash2 } from 'lucide-react';
import { bankAccountsApi } from '@/api/bankAccounts';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import type { BankAccount } from '@/types';

function AddForm({ onAdded }: { onAdded: (a: BankAccount) => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ accountHolderName: '', accountNumber: '', accountNumberConfirm: '', ifscCode: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.accountNumber !== form.accountNumberConfirm) {
      setErr(t('returns.accountNumberMismatch', { defaultValue: 'Account numbers do not match.' })); return;
    }
    setLoading(true); setErr(null);
    try {
      const acct = await bankAccountsApi.add(form);
      invalidateQueries('bank-accounts:');
      onAdded(acct);
      setForm({ accountHolderName: '', accountNumber: '', accountNumberConfirm: '', ifscCode: '' });
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const field = (key: keyof typeof form, placeholder: string, extra?: object) => (
    <div>
      <label className="block text-xs font-medium text-ink mb-1">{placeholder}</label>
      <input
        {...extra}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: key === 'ifscCode' ? e.target.value.toUpperCase() : e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-md border border-sand-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <h3 className="font-semibold text-sm">{t('returns.addBankAccount', { defaultValue: 'Add bank account' })}</h3>
      {field('accountHolderName', t('returns.accountHolderName', { defaultValue: 'Account holder name' }))}
      {field('accountNumber', t('returns.accountNumber', { defaultValue: 'Account number' }), { type: 'text', inputMode: 'numeric', pattern: '[0-9]{9,18}', autoComplete: 'off' })}
      {field('accountNumberConfirm', t('returns.confirmAccountNumber', { defaultValue: 'Confirm account number' }), { type: 'text', inputMode: 'numeric', pattern: '[0-9]{9,18}', autoComplete: 'off' })}
      {field('ifscCode', t('returns.ifscCode', { defaultValue: 'IFSC code' }), { className: 'w-full rounded-md border border-sand-300 px-3 py-2 text-sm font-mono uppercase focus:border-brand-600 focus:outline-none' })}
      {err && <p className="text-xs text-red-700">{err}</p>}
      <button type="submit" disabled={loading}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50">
        {loading ? t('common.saving') : t('returns.saveAccount', { defaultValue: 'Save account' })}
      </button>
    </form>
  );
}

function AccountRow({ account, onRemove }: { account: BankAccount; onRemove: () => void }) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remove = async () => {
    setLoading(true); setErr(null);
    try {
      await bankAccountsApi.remove(account.id);
      onRemove();
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-sand-200 px-4 py-3">
      <CreditCard className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{account.accountHolderName}</p>
        <p className="text-xs text-ink-muted">{account.accountNumberMasked} · {account.ifscCode}</p>
        {err && <p className="text-xs text-red-700 mt-0.5">{err}</p>}
      </div>
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)}
          className="text-ink-muted hover:text-red-700 transition-colors" aria-label={t('common.remove', { defaultValue: 'Remove' })}>
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <button type="button" onClick={remove} disabled={loading}
            className="text-xs text-red-700 font-semibold hover:text-red-900 disabled:opacity-50">
            {loading ? t('common.saving') : t('common.confirm')}
          </button>
          <button type="button" onClick={() => setConfirm(false)} className="text-xs text-ink-muted hover:text-ink">
            {t('common.cancel')}
          </button>
        </div>
      )}
    </li>
  );
}

export default function BankAccountsPage() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle(t('account.refundAccounts', { defaultValue: 'Refund accounts' }));

  const { data, error, isLoading, reload } = useAsync(`bank-accounts:${user.id}`, bankAccountsApi.list);
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState onRetry={reload} />;

  const items = accounts ?? data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t('account.refundAccounts', { defaultValue: 'Refund accounts' })}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t('account.refundAccountsDesc', { defaultValue: 'Saved bank accounts for refunds. Account numbers are stored encrypted.' })}</p>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map(a => (
            <AccountRow key={a.id} account={a} onRemove={() => setAccounts(items.filter(x => x.id !== a.id))} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CreditCard className="h-7 w-7" aria-hidden />}
          title={t('account.noBankAccounts', { defaultValue: 'No saved accounts' })}
          body={t('account.noBankAccountsDesc', { defaultValue: 'Add a bank account to receive refunds.' })}
        />
      )}

      <AddForm onAdded={a => setAccounts([a, ...items])} />
    </div>
  );
}
