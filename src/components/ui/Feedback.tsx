import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Info, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-sand-200/70 motion-reduce:animate-none', className)} aria-hidden />;
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 py-10 text-ink-muted', className)}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sand-300 border-t-brand-600 motion-reduce:animate-none" aria-hidden />
      <span className="text-sm">{label ?? t('common.loading')}</span>
    </div>
  );
}

type Tone = 'info' | 'success' | 'warning' | 'error' | 'demo';

const toneStyles: Record<Tone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  demo: 'border-brand-200 bg-brand-50 text-brand-900',
};

const toneIcon: Record<Tone, ReactNode> = {
  info: <Info className="h-5 w-5 shrink-0" aria-hidden />,
  success: <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />,
  error: <XCircle className="h-5 w-5 shrink-0" aria-hidden />,
  demo: <Info className="h-5 w-5 shrink-0" aria-hidden />,
};

export function Notice({
  tone = 'info',
  title,
  children,
  className,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}) {
  return (
    <div role={role} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', toneStyles[tone], className)}>
      {toneIcon[tone]}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center', className)}>
      {icon && <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100 text-brand-700">{icon}</div>}
      <h2 className="text-3xl">{title}</h2>
      {body && <p className="mt-2 text-ink-muted">{body}</p>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, title, body }: { onRetry?: () => void; title?: ReactNode; body?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<AlertTriangle className="h-7 w-7" aria-hidden />}
      title={title ?? t('common.errorTitle')}
      body={body ?? t('common.errorBody')}
      actions={
        onRetry && (
          <Button variant="outline" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" aria-hidden />}>
            {t('common.retry')}
          </Button>
        )
      }
    />
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'sale' | 'new' | 'warning' | 'muted' | 'success'; className?: string }) {
  const styles = {
    neutral: 'bg-white/95 text-ink border border-sand-200',
    sale: 'bg-brand-600 text-white',
    new: 'bg-sage-700 text-white',
    warning: 'bg-amber-100 text-amber-900',
    muted: 'bg-ink/80 text-white',
    success: 'bg-emerald-100 text-emerald-900',
  }[tone];
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', styles, className)}>{children}</span>;
}
