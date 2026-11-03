import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useDialog } from '@/hooks/useDialog';
import { cn } from '@/utils/cn';
import { IconButton } from './Button';

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

interface DrawerProps extends BaseProps {
  side?: 'left' | 'right';
}

/** Off-canvas panel (cart, mobile menu, mobile filters). */
export function Drawer({ open, onClose, title, children, footer, side = 'right', className }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { t } = useTranslation();
  useDialog(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 flex w-full max-w-md flex-col bg-ivory-50 shadow-drawer outline-none',
          side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <h2 id={titleId} className="text-2xl">
            {title}
          </h2>
          <IconButton label={t('a11y.closeDialog')} onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-sand-200 bg-white px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Centred modal dialog. */
export function Modal({ open, onClose, title, children, footer, className }: BaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { t } = useTranslation();
  useDialog(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full max-w-lg animate-toast-in flex-col rounded-t-2xl bg-ivory-50 shadow-drawer outline-none sm:rounded-2xl',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-sand-200 px-5 py-4">
          <h2 id={titleId} className="text-2xl">
            {title}
          </h2>
          <IconButton label={t('a11y.closeDialog')} onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-sand-200 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
