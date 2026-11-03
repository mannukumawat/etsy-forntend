import { useTranslation } from 'react-i18next';
import { HUB_COLOR, HubHero, HubSection } from '@/components/hub/Hub';
import { ProductGridSkeleton } from '@/components/product/ProductCard';
import { ErrorState } from '@/components/ui/Feedback';
import { CATEGORIES } from '@/data/categories';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import { usePreferences } from '@/store/preferences';

/** "New in" in the hub style: newest products first, with category circles and Filters. */
export default function NewInPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const currency = usePreferences((s) => s.currency);
  const list = useAsync(`catalog:new-in:${currency}`, () => productService.list({ currency, sort: 'newest', pageSize: 200 }));
  useDocumentTitle(t('hub.newInTitle'));

  return (
    <div className="pb-16">
      <HubHero
        title={t('hub.newInTitle')}
        subtitle={t('hub.newInSubtitle')}
        color={HUB_COLOR}
        circles={CATEGORIES.slice(0, 12).map((c) => ({ label: loc(c.name), href: `/category/${c.slug}`, image: c.image.src }))}
      />
      {list.isError ? (
        <div className="container-site mt-12">
          <ErrorState onRetry={list.reload} />
        </div>
      ) : !list.data ? (
        <div className="container-site mt-12">
          <ProductGridSkeleton count={8} />
        </div>
      ) : (
        <HubSection title={t('hub.justAdded')} products={list.data.items} />
      )}
    </div>
  );
}
