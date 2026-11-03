import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HUB_COLOR, HubHero, HubSection } from '@/components/hub/Hub';
import { ProductGridSkeleton } from '@/components/product/ProductCard';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/data/categories';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import { usePreferences } from '@/store/preferences';

/** Category page in the same hub style as the Wedding Guide: hero, circles to the other
 *  categories, then the category's products with Filters (picks first, then everything). */
export default function CategoryHubPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { slug = '' } = useParams();
  const currency = usePreferences((s) => s.currency);
  const category = CATEGORY_BY_SLUG[slug];
  const list = useAsync(category ? `catalog:category-hub:${slug}:${currency}` : null, () =>
    productService.list({ categories: [slug], currency, sort: 'featured', pageSize: 200 }),
  );
  useDocumentTitle(category ? loc(category.name) : t('common.notFound'));

  if (!category) {
    return (
      <div className="container-site py-16">
        <EmptyState title={t('common.notFound')} className="py-24" />
      </div>
    );
  }

  const products = list.data?.items ?? [];
  const picks = products.filter((p) => p.isFeatured || p.isBestseller);

  return (
    <div className="pb-16">
      <HubHero
        title={loc(category.name)}
        subtitle={loc(category.description)}
        color={HUB_COLOR}
        circles={CATEGORIES.filter((c) => c.slug !== slug).slice(0, 12).map((c) => ({ label: loc(c.name), href: `/category/${c.slug}`, image: c.image.src }))}
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
        <>
          {picks.length > 0 && picks.length < products.length && <HubSection title={t('hub.ourPicks')} products={picks} />}
          <HubSection title={t('hub.allIn', { name: loc(category.name) })} products={products} />
          {products.length === 0 && <p className="container-site mt-12 text-center text-ink-muted">{t('hub.noMatch')}</p>}
        </>
      )}
    </div>
  );
}
