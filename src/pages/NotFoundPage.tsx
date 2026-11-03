import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="container-site">
      <EmptyState
        icon={<Compass className="h-7 w-7" aria-hidden />}
        title={t('notFound.title')}
        body={t('notFound.body')}
        actions={
          <>
            <ButtonLink to="/">{t('notFound.home')}</ButtonLink>
            <ButtonLink to="/shop" variant="outline">
              {t('notFound.shop')}
            </ButtonLink>
          </>
        }
        className="py-24"
      />
    </div>
  );
}
