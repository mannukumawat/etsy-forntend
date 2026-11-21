import { useTranslation } from 'react-i18next';
import { BrandedLoader } from '@/components/ui/Feedback';

export function ProductPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="container-site flex min-h-[calc(100dvh-210px)] items-center justify-center py-8">
      <BrandedLoader label={t('product.preparing')} className="min-h-0" />
    </div>
  );
}
