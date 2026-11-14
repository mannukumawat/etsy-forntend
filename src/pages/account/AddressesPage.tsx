import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Home, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { AddressBlock } from '@/components/checkout/AddressBlock';
import { AddressFields } from '@/components/checkout/AddressFields';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Dialog';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { CheckboxField, TextField } from '@/components/ui/Form';
import { useAsync, invalidateQueries } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '@/services/authService';
import { usePreferences } from '@/store/preferences';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import type { SavedAddress } from '@/types';
import { savedAddressSchema, type SavedAddressFormValues } from '@/utils/validation';

function AddressForm({ initial, onCancel, onSave }: { initial?: SavedAddress; onCancel: () => void; onSave: (values: SavedAddressFormValues) => Promise<void> }) {
  const { t } = useTranslation();
  const country = usePreferences((s) => s.deliveryCountry);
  const form = useForm<SavedAddressFormValues>({
    resolver: zodResolver(savedAddressSchema),
    mode: 'onTouched',
    defaultValues: initial
      ? { ...initial, line2: initial.line2 ?? '', region: initial.region ?? '', postalCode: initial.postalCode ?? '' }
      : { label: '', isDefault: false, fullName: '', phoneCountry: country, phone: '', country, line1: '', line2: '', city: '', region: '', postalCode: '' },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
      <TextField id="addr-label" label={t('address.label')} placeholder={t('address.labelPlaceholder')} required error={errors.label?.message} {...register('label')} />
      <AddressFields form={form} idPrefix="addr" />
      <CheckboxField id="addr-default" label={t('address.makeDefault')} {...register('isDefault')} />
      <div className="grid grid-cols-2 gap-2 border-t border-sand-200 pt-4 sm:flex sm:justify-end">
        <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('account.addresses'));
  const user = useAuth((s) => s.user)!;
  const toast = useUi((s) => s.toast);
  const key = `addresses:${user.id}`;
  const { data, isError, reload } = useAsync(key, () => authService.listAddresses());
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null);
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    invalidateQueries(key);
    reload();
  };

  const save = async (values: SavedAddressFormValues) => {
    try {
      await authService.saveAddress({ ...values, id: editing && editing !== 'new' ? editing.id : undefined });
      toast(t('account.addressSaved'), 'success');
      setEditing(null);
      refresh();
    } catch {
      toast(t('toast.error'), 'error');
    }
  };

  const setDefault = async (a: SavedAddress) => {
    setBusy(true);
    try {
      await authService.saveAddress({ ...a, isDefault: true });
      refresh();
    } catch {
      toast(t('toast.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await authService.deleteAddress(deleting.id);
      toast(t('account.addressDeleted'), 'info');
      setDeleting(null);
      refresh();
    } catch {
      toast(t('toast.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="addr-title" className="pb-4">
      <div className="hidden items-center justify-between gap-3 md:flex">
        <h2 id="addr-title" className="text-2xl">
          {t('account.addresses')}
        </h2>
        <Button onClick={() => setEditing('new')} icon={<Plus className="h-4 w-4" aria-hidden />}>
          {t('account.addAddress')}
        </Button>
      </div>

      <div className="md:hidden">
        <p className="text-sm text-ink-muted">{t('account.addresses')}</p>
        <button type="button" onClick={() => setEditing('new')} className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-brand-300 bg-white px-4 text-left text-sm font-semibold text-brand-700 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50"><Plus className="h-5 w-5" aria-hidden /></span>
          <span className="flex-1">{t('account.addAddress')}</span>
        </button>
      </div>

      <div className="mt-4 md:mt-6">
        {isError ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState icon={<MapPin className="h-7 w-7" aria-hidden />} title={t('account.noAddresses')} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 md:gap-4">
            {data.map((a) => (
              <li key={a.id} className="card flex flex-col overflow-hidden p-0 md:p-5">
                <div className="flex gap-3 p-4 md:block md:p-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand-100 text-brand-700 md:hidden">
                    <Home className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{a.label}</p>
                      {a.isDefault && <Badge tone="success">{t('address.default')}</Badge>}
                    </div>
                    <div className="text-sm leading-6 text-ink-soft">
                      <AddressBlock address={a} />
                    </div>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 border-t border-sand-200 text-sm md:flex md:flex-wrap md:gap-x-4 md:gap-y-2 md:border-0 md:pt-4">
                  <button type="button" className="flex min-h-12 items-center justify-center gap-2 border-r border-sand-200 font-semibold text-brand-700 md:min-h-0 md:justify-start md:border-0 md:font-medium md:underline md:underline-offset-2" onClick={() => setEditing(a)}>
                    <Pencil className="h-4 w-4 md:hidden" aria-hidden /> {t('common.edit')} <span className="sr-only">{a.label}</span>
                  </button>
                  {!a.isDefault && (
                    <button type="button" className="col-span-2 order-last min-h-11 border-t border-sand-200 px-3 font-medium text-brand-700 md:order-none md:min-h-0 md:border-0 md:p-0 md:underline md:underline-offset-2" onClick={() => setDefault(a)} disabled={busy}>
                      {t('account.makeDefault')} <span className="sr-only">{a.label}</span>
                    </button>
                  )}
                  <button type="button" className={`${a.isDefault ? 'col-start-2' : ''} flex min-h-12 items-center justify-center gap-2 font-semibold text-red-700 hover:text-red-800 md:min-h-0 md:font-medium md:underline md:underline-offset-2`} onClick={() => setDeleting(a)}>
                    <Trash2 className="h-4 w-4 md:hidden" aria-hidden /> {t('common.delete')} <span className="sr-only">{a.label}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? t('account.addAddress') : t('account.editAddress')} className="max-w-2xl">
        {editing !== null && <AddressForm initial={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSave={save} />}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('common.delete')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)} data-autofocus>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={busy}>
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        <p>{deleting && t('account.confirmDelete', { label: deleting.label })}</p>
      </Modal>
    </section>
  );
}
