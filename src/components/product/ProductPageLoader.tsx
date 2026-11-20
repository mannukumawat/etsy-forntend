import { BrandedLoader } from '@/components/ui/Feedback';

export function ProductPageLoader() {
  return (
    <div className="container-site flex min-h-[calc(100dvh-210px)] items-center justify-center py-8">
      <BrandedLoader label="Preparing your handcrafted product…" className="min-h-0" />
    </div>
  );
}
