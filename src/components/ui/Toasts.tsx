import { useTranslation } from 'react-i18next';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUi } from '@/store/ui';
import { cn } from '@/utils/cn';

export function ToastViewport() {
  const { t } = useTranslation();
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return (
    <section aria-label={t('a11y.notifications')} className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      <div aria-live="polite" aria-atomic="false" className="flex w-full flex-col items-center gap-2 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lift',
              toast.tone === 'error' ? 'border-red-200' : 'border-sand-200',
            )}
          >
            {toast.tone === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />}
            {toast.tone === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden />}
            {toast.tone === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden />}
            <p className="flex-1 pt-0.5 text-ink">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                className="shrink-0 rounded px-1 pt-0.5 font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
                onClick={() => {
                  toast.action!.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(toast.id)} className="shrink-0 rounded p-0.5 text-ink-muted hover:text-ink" aria-label={t('a11y.dismiss')}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
