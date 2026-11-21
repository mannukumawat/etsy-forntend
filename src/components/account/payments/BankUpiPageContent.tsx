import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Smartphone, Trash2 } from 'lucide-react';
import { bankAccountsApi } from '@/api/bankAccounts';
import { upiApi, type UpiId } from '@/api/upi';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { cn } from '@/utils/cn';
import type { BankAccount } from '@/types';

// ---- Bank account row ----
function BankRow({ account, onRemove }: { account: BankAccount; onRemove: () => void }) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remove = async () => {
    setLoading(true); setErr(null);
    try { await bankAccountsApi.remove(account.id); onRemove(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : t('toast.error')); setLoading(false); }
  };

  return (
    <li className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-100">
        <CreditCard className="h-4.5 w-4.5 text-ink-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{account.accountHolderName}</p>
        <p className="text-xs text-ink-muted mt-0.5">{account.accountNumberMasked} · {account.ifscCode}</p>
        {err && <p className="mt-0.5 text-xs text-red-700">{err}</p>}
      </div>
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="text-ink-muted hover:text-red-600 transition-colors" aria-label={t('common.remove')}>
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={remove} disabled={loading} className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">
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

// ---- Add bank account form ----
function AddBankForm({ onAdded }: { onAdded: (a: BankAccount) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ accountHolderName: '', accountNumber: '', accountNumberConfirm: '', ifscCode: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.accountNumber !== form.accountNumberConfirm) { setErr(t('returns.accountNumberMismatch')); return; }
    setLoading(true); setErr(null);
    try {
      const acct = await bankAccountsApi.add(form);
      invalidateQueries('bank-accounts:');
      onAdded(acct);
      setForm({ accountHolderName: '', accountNumber: '', accountNumberConfirm: '', ifscCode: '' });
      setOpen(false);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : t('toast.error')); }
    finally { setLoading(false); }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-sand-300 w-full px-4 py-3 text-sm font-medium text-ink-muted hover:border-brand-400 hover:text-brand-700 transition-colors">
        <CreditCard className="h-4 w-4" /> {t('returns.addBankAccount')}
      </button>
    );
  }

  const FIELDS: { key: keyof typeof form; label: string }[] = [
    { key: 'accountHolderName', label: t('returns.accountHolderName') },
    { key: 'accountNumber', label: t('returns.accountNumber') },
    { key: 'accountNumberConfirm', label: t('returns.confirmAccountNumber') },
    { key: 'ifscCode', label: t('returns.ifscCode') },
  ];

  return (
    <form onSubmit={submit} className="rounded-xl border border-sand-200 bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-ink">{t('returns.newBankAccount')}</p>
      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-ink-muted">{label}</label>
          <input
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: key === 'ifscCode' ? e.target.value.toUpperCase() : e.target.value }))}
            className={cn('w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none', key === 'ifscCode' && 'font-mono uppercase')}
          />
        </div>
      ))}
      {err && <p className="text-xs text-red-700">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50">
          {loading ? t('common.saving') : t('returns.saveAccount')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-sand-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-100">
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

// ---- UPI row ----
function UpiRow({ item, onRemove }: { item: UpiId; onRemove: () => void }) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remove = async () => {
    setLoading(true); setErr(null);
    try { await upiApi.remove(item.id); onRemove(); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : t('toast.error')); setLoading(false); }
  };

  return (
    <li className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-100">
        <Smartphone className="h-4.5 w-4.5 text-ink-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink font-mono">{item.upiId}</p>
        <p className="text-xs text-ink-muted mt-0.5">{item.holderName}</p>
        {err && <p className="mt-0.5 text-xs text-red-700">{err}</p>}
      </div>
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="text-ink-muted hover:text-red-600 transition-colors" aria-label={t('common.remove')}>
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={remove} disabled={loading} className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">
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

// ---- Add UPI form ----
function AddUpiForm({ onAdded }: { onAdded: (u: UpiId) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [holderName, setHolderName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const item = await upiApi.add({ upiId: upiId.trim(), holderName: holderName.trim() });
      invalidateQueries('upi-ids:');
      onAdded(item);
      setUpiId(''); setHolderName('');
      setOpen(false);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : t('toast.error')); }
    finally { setLoading(false); }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-sand-300 w-full px-4 py-3 text-sm font-medium text-ink-muted hover:border-brand-400 hover:text-brand-700 transition-colors">
        <Smartphone className="h-4 w-4" /> {t('account.addUpiId')}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-sand-200 bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-ink">{t('account.newUpiId')}</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">{t('account.upiIdLabel')}</label>
        <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank"
          className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">{t('returns.accountHolderName')}</label>
        <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder={t('account.fullNamePlaceholder')}
          className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50">
          {loading ? t('common.saving') : t('account.saveUpiId')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-sand-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-100">
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

// ---- Section card ----
function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-100">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// ---- Page ----
export default function BankUpiPage() {
  const { t } = useTranslation();
  useDocumentTitle('Bank & UPI Details');
  const user = useAuth((s) => s.user)!;

  // Bank accounts
  const { data: bankData, error: bankErr, isLoading: bankLoading, reload: bankReload } = useAsync(
    `bank-accounts:${user.id}`, bankAccountsApi.list,
  );
  const [localBanks, setLocalBanks] = useState<BankAccount[] | null>(null);
  const banks = localBanks ?? bankData?.items ?? [];

  // UPI IDs
  const { data: upiData, error: upiErr, isLoading: upiLoading, reload: upiReload } = useAsync(
    `upi-ids:${user.id}`, upiApi.list,
  );
  const [localUpis, setLocalUpis] = useState<UpiId[] | null>(null);
  const upis = localUpis ?? upiData?.items ?? [];

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-ink">Bank & UPI Details</h1>

      {/* Bank accounts */}
      <Section
        icon={<CreditCard className="h-5 w-5 text-ink-muted" />}
        title={t('account.bankAccountsTitle')}
        subtitle={t('account.bankAccountsSubtitle')}
      >
        {bankLoading ? <Spinner /> : bankErr ? <ErrorState onRetry={bankReload} /> : (
          <>
            {banks.length === 0 ? (
              <EmptyState icon={<CreditCard className="h-7 w-7" />} title={t('account.noBankAccountsTitle')} body={t('account.noBankAccountsBody')} />
            ) : (
              <ul className="space-y-2">
                {banks.map((a) => (
                  <BankRow key={a.id} account={a} onRemove={() => setLocalBanks(banks.filter((x) => x.id !== a.id))} />
                ))}
              </ul>
            )}
            <AddBankForm onAdded={(a) => setLocalBanks([a, ...banks])} />
          </>
        )}
      </Section>

      {/* UPI IDs */}
      <Section
        icon={<Smartphone className="h-5 w-5 text-ink-muted" />}
        title={t('account.upiIdsTitle')}
        subtitle={t('account.upiIdsSubtitle')}
      >
        {upiLoading ? <Spinner /> : upiErr ? <ErrorState onRetry={upiReload} /> : (
          <>
            {upis.length === 0 ? (
              <EmptyState icon={<Smartphone className="h-7 w-7" />} title={t('account.noUpiIdsTitle')} body={t('account.noUpiIdsBody')} />
            ) : (
              <ul className="space-y-2">
                {upis.map((u) => (
                  <UpiRow key={u.id} item={u} onRemove={() => setLocalUpis(upis.filter((x) => x.id !== u.id))} />
                ))}
              </ul>
            )}
            <AddUpiForm onAdded={(u) => setLocalUpis([u, ...upis])} />
          </>
        )}
      </Section>
    </div>
  );
}
