import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus } from 'lucide-react';
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
      <div className="flex justify-end gap-2 border-t border-sand-200 pt-4">
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
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
  const { data, isError, reload } = useAsync(key, () => authService.listAddresses(user.id));
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null);
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    invalidateQueries(key);
    reload();
  };

  const save = async (values: SavedAddressFormValues) => {
    try {
      await authService.saveAddress(user.id, { ...values, id: editing && editing !== 'new' ? editing.id : undefined });
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
      await authService.saveAddress(user.id, { ...a, isDefault: true });
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
      await authService.deleteAddress(user.id, deleting.id);
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
    <section aria-labelledby="addr-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="addr-title" className="text-3xl">
          {t('account.addresses')}
        </h2>
        <Button onClick={() => setEditing('new')} icon={<Plus className="h-4 w-4" aria-hidden />}>
          {t('account.addAddress')}
        </Button>
      </div>

      <div className="mt-6">
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
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.map((a) => (
              <li key={a.id} className="card flex flex-col p-5">
                <div className="mb-2 flex items-center gap-2">
                  <p className="font-semibold">{a.label}</p>
                  {a.isDefault && <Badge tone="success">{t('address.default')}</Badge>}
                </div>
                <div className="text-sm">
                  <AddressBlock address={a} />
                </div>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-4 text-sm">
                  <button type="button" className="link" onClick={() => setEditing(a)}>
                    {t('common.edit')} <span className="sr-only">{a.label}</span>
                  </button>
                  {!a.isDefault && (
                    <button type="button" className="link" onClick={() => setDefault(a)} disabled={busy}>
                      {t('account.makeDefault')} <span className="sr-only">{a.label}</span>
                    </button>
                  )}
                  <button type="button" className="font-medium text-red-700 underline underline-offset-2 hover:text-red-800" onClick={() => setDeleting(a)}>
                    {t('common.delete')} <span className="sr-only">{a.label}</span>
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
