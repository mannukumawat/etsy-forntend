import { PackageX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductPageLoader } from '@/components/product/ProductPageLoader';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { ApiError } from '@/services/api';
import { productService } from '@/services/productService';

export default function ProductPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { slug = '' } = useParams();
  const { data, error, isLoading, isError, reload } = useAsync(`catalog:product:${slug}`, () => productService.getBySlug(slug));
  useDocumentTitle(data ? loc(data.name) : isError ? t('product.notFoundTitle') : null);

  if (isLoading) return <ProductPageLoader />;
  if (isError) {
    if (error instanceof ApiError && error.code === 'not_found') {
      return (
        <EmptyState
          icon={<PackageX className="h-7 w-7" aria-hidden />}
          title={t('product.notFoundTitle')}
          body={t('product.notFoundBody')}
          actions={<ButtonLink to="/shop">{t('product.backToShop')}</ButtonLink>}
          className="py-24"
        />
      );
    }
    return <ErrorState onRetry={reload} />;
  }
  if (!data) return null;
  return <ProductDetail key={data.id} product={data} onReviewsChanged={reload} />;
}
