import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-ivory-50 px-4 pb-10 pt-4 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-lg">
        <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-white text-ink shadow-sm sm:hidden">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="card overflow-hidden border-0 p-5 shadow-lift sm:border sm:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {aside && <div className="mt-4 space-y-4">{aside}</div>}
      </div>
    </div>
  );
}

/** Show/hide toggle for password fields. */
export function usePasswordToggle() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const button = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
      aria-pressed={visible}
      className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:text-ink"
    >
      {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
    </button>
  );
  return { type: visible ? 'text' : 'password', button };
}

/** Only allow same-origin relative redirects. */
export function safeRedirect(value: string | null, fallback = '/account'): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
