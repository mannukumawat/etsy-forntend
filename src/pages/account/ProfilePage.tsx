import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { useAuth, useCheckout } from '@/store/session';
import { useUi } from '@/store/ui';
import { profileSchema, type ProfileValues } from '@/utils/validation';
import { cn } from '@/utils/cn';

type Tab = 'primary' | 'other' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'other', label: 'Other Info' },
  { key: 'settings', label: 'Settings' },
];

// ---- Reusable select/input field ----
function ExtField({
  label, value, onChange, type = 'text', options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  options?: string[];
}) {
  const cls = 'w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none';
  if (options) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} className={cn(cls, 'placeholder:text-ink-muted')} />
    </div>
  );
}

const DELETE_BULLETS = [
  'Your account will be permanently deleted after 14 days, during which you can reactivate it by signing in with the same credentials.',
  'You will not be able to return/cancel your orders that are not delivered yet.',
  'You will not be able to check your old orders.',
  'You will not be able to check your saved addresses, payment methods, and wishlist.',
  'You will lose out on the latest offers, discounts, and sale updates.',
  'You will lose access to your earned loyalty coins and store balance.',
];

// ---- Delete account ----
function DeleteAccountSection() {
  const signOutUser = useAuth((s) => s.signOut);
  const resetCheckout = useCheckout((s) => s.reset);
  const toast = useUi((s) => s.toast);
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle');
  const [err, setErr] = useState<string | null>(null);

  const handleDelete = async () => {
    setStep('loading');
    setErr(null);
    try {
      await authService.deleteAccount();
      authService.logout().catch(() => {});
      signOutUser();
      resetCheckout();
      toast('Your account has been scheduled for deletion. You have 14 days to reactivate it.', 'info');
    } catch (e: any) {
      setErr(e.message ?? 'Something went wrong.');
      setStep('confirm');
    }
  };

  if (step === 'idle') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-5">
        <h3 className="text-sm font-semibold text-red-900">Delete My Account</h3>
        <p className="mt-1 text-xs text-red-700">
          You will not be able to access your personal data including your old orders, saved addresses, payment methods etc.
        </p>
        <button
          type="button"
          onClick={() => { setStep('confirm'); setErr(null); }}
          className="mt-4 rounded-lg border border-red-400 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
        >
          Delete My Account
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sand-200 bg-white">
      {/* Header */}
      <div className="border-b border-sand-100 px-5 py-4">
        <h3 className="text-base font-bold text-ink tracking-wide uppercase">Delete Account</h3>
      </div>

      {/* Body */}
      <div className="px-5 py-6 space-y-5">
        <p className="text-sm font-semibold text-ink">Once you delete your account</p>
        <ul className="space-y-3">
          {DELETE_BULLETS.map((text) => (
            <li key={text} className="flex items-start gap-3 text-sm text-ink-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-muted" />
              {text}
            </li>
          ))}
        </ul>
        {err && <p className="text-xs text-red-700">{err}</p>}
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 border-t border-sand-100 px-5 py-4">
        <button
          type="button"
          onClick={() => { setStep('idle'); setErr(null); }}
          disabled={step === 'loading'}
          className="flex-1 rounded-lg border border-sand-300 bg-white py-3 text-sm font-semibold text-ink hover:bg-sand-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={step === 'loading'}
          className="flex-1 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {step === 'loading' ? 'Please wait…' : 'Continue'}
        </button>
      </div>
    </div>
  );

}

// ---- Main page ----
export default function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user)!;
  const setUser = useAuth((s) => s.setUser);
  const toast = useUi((s) => s.toast);
  useDocumentTitle(t('account.profile'));

  const [tab, setTab] = useState<Tab>('primary');
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatarUrl);
  const [avatarData, setAvatarData] = useState<{ fileName: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; base64: string; width: number | null; height: number | null }>();

  // Extended fields (Primary tab extras)
  const [gender, setGender] = useState(user.gender ?? '');
  const [languages, setLanguages] = useState(user.languages ?? '');
  const [occupation, setOccupation] = useState(user.occupation ?? '');
  const [pincode, setPincode] = useState(user.pincode ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [state, setState] = useState(user.state ?? '');

  // Other info fields
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth ?? '');
  const [maritalStatus, setMaritalStatus] = useState(user.maritalStatus ?? '');
  const [numberOfKids, setNumberOfKids] = useState(user.numberOfKids ?? '');
  const [education, setEducation] = useState(user.education ?? '');
  const [monthlyIncome, setMonthlyIncome] = useState(user.monthlyIncome ?? '');

  // Profile form (backend fields)
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? '' },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Choose a JPEG, PNG or WebP image.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Profile photos must be 5 MB or smaller.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAvatarPreview(url);
      setAvatarData({ fileName: file.name, mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp', base64: url.split(',')[1] ?? '', width: null, height: null });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onSubmitPrimary = async (values: ProfileValues) => {
    try {
      const avatarUser = avatarData ? await authService.uploadAvatar(avatarData) : user;
      const updated = await authService.updateProfile({
        ...values,
        avatarUrl: avatarUser.avatarUrl,
        gender: gender || undefined,
        languages: languages || undefined,
        occupation: occupation || undefined,
        pincode: pincode || undefined,
        city: city || undefined,
        state: state || undefined,
      });
      setUser(updated);
      setAvatarData(undefined);
      reset({ name: updated.name, email: updated.email, phone: updated.phone ?? '' });
      toast(t('account.profileSaved'), 'success');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'email_taken')
        setError('email', { message: 'auth.errors.email_taken' });
      else toast(t('toast.error'), 'error');
    }
  };

  const [otherSaving, setOtherSaving] = useState(false);
  const onSubmitOther = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtherSaving(true);
    try {
      const updated = await authService.updateProfile({
        name: user.name, email: user.email, phone: user.phone,
        dateOfBirth: dateOfBirth || undefined,
        maritalStatus: maritalStatus || undefined,
        numberOfKids: numberOfKids || undefined,
        education: education || undefined,
        monthlyIncome: monthlyIncome || undefined,
      });
      setUser(updated);
      toast(t('account.profileSaved'), 'success');
    } catch { toast(t('toast.error'), 'error'); }
    finally { setOtherSaving(false); }
  };

  const hasUnsavedAvatar = !!avatarData;

  return (
    <div className="space-y-6">
      {/* Avatar + name header */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-full border-2 border-sand-200 bg-sand-100 overflow-hidden flex items-center justify-center">
            {avatarPreview
              ? <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              : <User className="h-9 w-9 text-ink-muted" aria-hidden />
            }
          </div>
          <button type="button" onClick={() => avatarRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow hover:bg-ink/80"
            aria-label="Change photo">
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-xl font-semibold text-ink">{user.name}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
          {hasUnsavedAvatar && <p className="text-xs text-brand-700 mt-0.5">New photo — save to apply</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-sand-200">
        <nav className="flex gap-1" aria-label="Profile tabs">
          {TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink hover:border-sand-300',
              )}>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Primary */}
      {tab === 'primary' && (
        <form onSubmit={handleSubmit(onSubmitPrimary)} noValidate className="space-y-6">
          <div className="rounded-xl border border-sand-200 bg-white p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="pf-name" label="Full Name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
              <TextField id="pf-phone" type="tel" label="Phone Number" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
              <TextField id="pf-email" type="email" label="Email ID" autoComplete="email" required error={errors.email?.message} {...register('email')} />
              <ExtField label="Gender" value={gender} onChange={setGender} options={['Male', 'Female', 'Non-binary', 'Prefer not to say']} />
              <ExtField label="Languages Spoken" value={languages} onChange={setLanguages} />
              <ExtField label="Occupation" value={occupation} onChange={setOccupation} />
              <ExtField label="Pincode" value={pincode} onChange={setPincode} />
              <ExtField label="City" value={city} onChange={setCity} />
              <ExtField label="State" value={state} onChange={setState} />
            </div>
          </div>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty && !hasUnsavedAvatar}>
            {isSubmitting ? t('common.saving') : t('account.saveProfile')}
          </Button>
        </form>
      )}

      {/* Tab: Other Info */}
      {tab === 'other' && (
        <form onSubmit={onSubmitOther} className="space-y-6">
          <div className="rounded-xl border border-sand-200 bg-white p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <ExtField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
              <ExtField label="Marital Status" value={maritalStatus} onChange={setMaritalStatus}
                options={['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say']} />
              <ExtField label="Number of Kids" value={numberOfKids} onChange={setNumberOfKids}
                options={['0', '1', '2', '3', '4', '5+']} />
              <ExtField label="Education" value={education} onChange={setEducation}
                options={['High School', 'Diploma', "Bachelor's", "Master's", 'PhD', 'Other']} />
              <ExtField label="Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome}
                options={['Below ₹25k', '₹25k–50k', '₹50k–1L', '₹1L–2L', 'Above ₹2L', 'Prefer not to say']} />
            </div>
          </div>
          <Button type="submit" loading={otherSaving}>
            {otherSaving ? t('common.saving') : 'Save Changes'}
          </Button>
        </form>
      )}

      {/* Tab: Settings */}
      {tab === 'settings' && (
        <div className="space-y-8">
          <DeleteAccountSection />
        </div>
      )}
    </div>
  );
}
