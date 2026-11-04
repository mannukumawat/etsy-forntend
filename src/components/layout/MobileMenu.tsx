import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Heart, LogIn, Package, User } from 'lucide-react';
import { fetchCollections, fetchNavLinks } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { productService } from '@/services/productService';
import { useAuth } from '@/store/session';
import { useSiteSettings } from '@/store/siteSettings';
import { useWishlist } from '@/store/wishlist';
import { Drawer } from '../ui/Dialog';
import { SettingsButton } from './Preferences';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const user = useAuth((s) => s.user);
  const wishCount = useWishlist((s) => s.items.length);
  const storeName = useSiteSettings((s) => s.store.name);
  const { data: navLinks } = useAsync(open ? 'nav-links' : null, () => fetchNavLinks());
  const { data: collections } = useAsync(open ? 'collections:nav' : null, () => fetchCollections());
  const { data: categories } = useAsync(open ? 'catalog:categories' : null, () => productService.listCategories());
  const navCollections = collections?.filter((collection) => collection.showInNavigation) ?? [];
  const collectionHrefs = new Set(navCollections.map((collection) => `/collection/${collection.slug}`));
  const customLinks = navLinks?.filter((link) => !collectionHrefs.has(link.href)) ?? [];

  const item = 'flex items-center justify-between rounded-lg px-2 py-3 text-[15px] font-medium text-ink hover:bg-sand-100';

  return (
    <Drawer open={open} onClose={onClose} title={t('a11y.menu')} side="left">
      {(navCollections.length > 0 || customLinks.length > 0) && (
        <div className="scrollbar-none -mx-2 mb-4 flex gap-2 overflow-x-auto px-2">
          {navCollections.map((collection) => (
            <Link key={collection.slug} to={`/collection/${collection.slug}`} onClick={onClose} className="shrink-0 rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-200">
              {loc(collection.title)}
            </Link>
          ))}
          {customLinks.map((link) => (
            link.href.startsWith('/') ? (
              <Link key={link.id} to={`/shop?nav=${link.id}`} onClick={onClose} className="shrink-0 rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-200">
                {loc(link.label)}
              </Link>
            ) : (
              <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className="shrink-0 rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-200">
                {loc(link.label)}
              </a>
            )
          ))}
        </div>
      )}

      <nav aria-label={t('a11y.primaryNav')}>
        <ul className="divide-y divide-sand-200/70">
          <li>
            <Link to="/new-in" className={item} onClick={onClose}>
              {t('nav.newIn')} <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden />
            </Link>
          </li>
          {(categories ?? []).map((c) => (
            <li key={c.slug}>
              <Link to={`/category/${c.slug}`} className={item} onClick={onClose}>
                <span className="flex items-center gap-3">
                  <img src={c.image.src} alt="" className="h-9 w-9 rounded-full object-cover" />
                  {loc(c.name)}
                </span>
                <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-2">
        <Link to={user ? '/account' : '/login'} className={item} onClick={onClose}>
          <span className="flex items-center gap-3">
            {user ? <User className="h-5 w-5" aria-hidden /> : <LogIn className="h-5 w-5" aria-hidden />}
            {user ? t('nav.myAccount') : t('common.signIn')}
          </span>
        </Link>
        <Link to="/wishlist" className={item} onClick={onClose}>
          <span className="flex items-center gap-3">
            <Heart className="h-5 w-5" aria-hidden />
            {t('common.wishlist')}
          </span>
          {wishCount > 0 && <span className="text-sm text-ink-muted">{wishCount}</span>}
        </Link>
        <Link to="/track-order" className={item} onClick={onClose}>
          <span className="flex items-center gap-3">
            <Package className="h-5 w-5" aria-hidden />
            {t('nav.trackOrder')}
          </span>
        </Link>
      </div>

      <section aria-labelledby="mobile-prefs" className="mt-6 space-y-4">
        <h3 id="mobile-prefs" className="font-sans text-sm font-semibold text-ink">
          {t('header.preferences')}
        </h3>
        <SettingsButton variant="full" />
      </section>

      <ul className="mt-8 grid grid-cols-2 gap-2 text-sm text-ink-muted">
        {(['contact', 'faq', 'shipping', 'returns', 'privacy', 'terms'] as const).map((k) => (
          <li key={k}>
            <Link to={`/${k}`} className="hover:text-ink hover:underline" onClick={onClose}>
              {t(`nav.${k}`)}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-ink-faint">{storeName}</p>
    </Drawer>
  );
}
