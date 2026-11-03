import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HubHero, HubSection } from '@/components/hub/Hub';
import { ProductGridSkeleton } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/Feedback';
import { fetchCollection } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalized } from '@/hooks/useLocale';

export default function CollectionPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = useAsync(slug ? `collection:${slug}` : null, () => fetchCollection(slug));
  useDocumentTitle(data ? loc(data.title) : null);

  if (isLoading || !data) {
    if (isError) {
      return (
        <div className="container-site py-16">
          <EmptyState title={t('common.notFound')} className="py-24" />
        </div>
      );
    }
    return (
      <div className="container-site py-10">
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <HubHero
        title={loc(data.title)}
        subtitle={data.subtitle.en ? loc(data.subtitle) : undefined}
        color={data.heroColor}
        image={data.heroImage}
        circles={data.circles.map((c) => ({ label: loc(c.label), href: c.href, image: c.image }))}
      />
      {data.description.en && <p className="container-site mt-12 max-w-3xl text-center text-lg text-ink-soft">{loc(data.description)}</p>}
      {data.sections.map((s, i) => (
        <HubSection key={i} title={loc(s.title)} products={s.products} />
      ))}
    </div>
  );
}
