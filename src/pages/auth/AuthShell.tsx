import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-sand-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="card p-6 sm:p-8">
          <h1 className="text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
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
