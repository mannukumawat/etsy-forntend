import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Heart, LogIn, Package, User } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { useLocalized } from '@/hooks/useLocale';
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

  const item = 'flex items-center justify-between rounded-lg px-2 py-3 text-[15px] font-medium text-ink hover:bg-sand-100';

  return (
    <Drawer open={open} onClose={onClose} title={t('a11y.menu')} side="left">
      <nav aria-label={t('a11y.primaryNav')}>
        <ul className="divide-y divide-sand-200/70">
          <li>
            <Link to="/new-in" className={item} onClick={onClose}>
              {t('nav.newIn')} <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden />
            </Link>
          </li>
          {CATEGORIES.map((c) => (
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
