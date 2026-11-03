import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';
import { fetchCollections, fetchNavLinks } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { selectCartCount, useCart } from '@/store/cart';
import { useSiteSettings } from '@/store/siteSettings';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';
import { useWishlist } from '@/store/wishlist';
import { cn } from '@/utils/cn';
import { IconButton } from '../ui/Button';
import { CategoriesMenu } from './CategoriesMenu';
import { MobileMenu } from './MobileMenu';
import { SettingsButton } from './Preferences';
import { SearchBar } from './SearchBar';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  const name = useSiteSettings((s) => s.store.name);
  return (
    <Link to="/" className={cn('flex shrink-0 items-center gap-2', className)}>
      <img src={logoMark} alt="" className="h-9 w-9 object-contain lg:h-10 lg:w-10" />
      <span className="font-serif text-[22px] font-semibold leading-none tracking-tight text-ink lg:text-[26px]">{name}</span>
    </Link>
  );
}

function NavLinksBar() {
  const loc = useLocalized();
  const { data: navLinks } = useAsync('nav-links', () => fetchNavLinks());
  const { data: collections } = useAsync('collections:nav', () => fetchCollections());
  const navCollections = collections?.filter((collection) => collection.showInNavigation) ?? [];
  const collectionHrefs = new Set(navCollections.map((collection) => `/collection/${collection.slug}`));
  const customLinks = navLinks?.filter((link) => !collectionHrefs.has(link.href)) ?? [];
  if (!navCollections.length && !customLinks.length) return null;
  return (
    <nav aria-label="Quick links" className="hidden border-t border-sand-200 lg:block">
      <ul className="container-site scrollbar-none flex gap-1 overflow-x-auto py-2">
        {navCollections.map((collection) => (
          <li key={collection.slug}>
            <Link to={`/collection/${collection.slug}`} className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-100 hover:text-brand-700">
              {loc(collection.title)}
            </Link>
          </li>
        ))}
        {customLinks.map((link) => (
          <li key={link.id}>
            {link.href.startsWith('/') ? (
              <Link to={link.href} className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-100 hover:text-brand-700">
                {loc(link.label)}
              </Link>
            ) : (
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-sand-100 hover:text-brand-700">
                {loc(link.label)}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Header() {
  const { t } = useTranslation();
  const cartCount = useCart(selectCartCount);
  const wishCount = useWishlist((s) => s.items.length);
  const user = useAuth((s) => s.user);
  const openCart = useUi((s) => s.openCart);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-ivory-50/95 backdrop-blur supports-[backdrop-filter]:bg-ivory-50/85">
      <div className="container-site flex h-16 items-center gap-2 lg:h-[76px] lg:gap-6">
        <IconButton label={t('a11y.openMenu')} className="-ml-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-haspopup="dialog">
          <Menu className="h-6 w-6" aria-hidden />
        </IconButton>

        <Logo className="mr-auto md:mr-0" />

        <CategoriesMenu className="hidden lg:block" />

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar className="max-w-xl" />
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="hidden items-center gap-1 lg:flex">
            <SettingsButton />
          </div>
          <IconButton
            label={searchOpen ? t('a11y.closeSearch') : t('a11y.openSearch')}
            className="md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
          >
            {searchOpen ? <X className="h-5 w-5" aria-hidden /> : <Search className="h-5 w-5" aria-hidden />}
          </IconButton>
          <Link
            to={user ? '/account' : '/login'}
            aria-label={user ? t('header.signedInAs', { name: user.name }) : t('a11y.accountLink')}
            title={user ? t('header.signedInAs', { name: user.name }) : t('a11y.accountLink')}
            className="relative hidden h-10 w-10 items-center justify-center rounded-full hover:bg-sand-100 sm:flex"
          >
            <User className="h-5 w-5" aria-hidden />
            {user && <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-ivory-50" aria-hidden />}
          </Link>
          <Link
            to="/wishlist"
            aria-label={t('a11y.wishlistLink', { count: wishCount })}
            title={t('common.wishlist')}
            className="relative hidden h-10 w-10 items-center justify-center rounded-full hover:bg-sand-100 sm:flex"
          >
            <Heart className="h-5 w-5" aria-hidden />
            <CountBadge count={wishCount} />
          </Link>
          <IconButton label={t('a11y.openCart', { count: cartCount })} onClick={openCart} aria-haspopup="dialog" className="-mr-2 sm:mr-0">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <CountBadge count={cartCount} />
          </IconButton>
        </div>
      </div>

      {searchOpen && (
        <div id="mobile-search" className="container-site pb-3 md:hidden">
          <SearchBar autoFocus onNavigate={() => setSearchOpen(false)} />
        </div>
      )}

      <NavLinksBar />

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
