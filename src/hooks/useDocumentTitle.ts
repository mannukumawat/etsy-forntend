import { useEffect } from 'react';
import { useSiteSettings } from '@/store/siteSettings';

export function useDocumentTitle(title: string | null | undefined) {
  const storeName = useSiteSettings((s) => s.store.name);
  useEffect(() => {
    document.title = title ? `${title} | ${storeName}` : storeName;
  }, [title, storeName]);
}
