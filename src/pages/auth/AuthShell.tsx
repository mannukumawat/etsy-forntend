import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="container-site py-10 lg:py-16">
      <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-[1fr_320px]">
        <div className="card p-6 sm:p-8">
          <h1 className="text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {aside && <aside className="space-y-4">{aside}</aside>}
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
