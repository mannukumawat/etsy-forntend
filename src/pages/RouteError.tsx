import { Link, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStore } from '@/config/store';
import { buttonClasses } from '@/components/ui/Button';

/** Last-resort error boundary for routing/render errors (rendered outside the main layout). */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="font-serif text-3xl font-semibold">{getStore().name}</p>
      <h1 className="mt-6 text-4xl">{t('common.errorTitle')}</h1>
      <p className="mt-2 max-w-md text-ink-muted">{t('common.errorBody')}</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => window.location.reload()} className={buttonClasses('outline')}>
          {t('common.retry')}
        </button>
        <Link to="/" className={buttonClasses('primary')}>
          {t('notFound.home')}
        </Link>
      </div>
    </main>
  );
}
