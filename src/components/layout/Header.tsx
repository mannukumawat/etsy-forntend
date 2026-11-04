import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';
import { fetchCollections, fetchNavLinks } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { selectCartCount, useCart } from '@/store/cart';
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
    <span aria-hidden className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex shrink-0 items-center', className)}>
      <img src={logoMark} alt="Home" className="h-14 w-14 object-contain lg:h-16 lg:w-16" />
    </Link>
  );
}

function NavLinksBar() {
  const loc = useLocalized();
  const location = useLocation();
  const { data: navLinks } = useAsync('nav-links', () => fetchNavLinks());
  const { data: collections } = useAsync('collections:nav', () => fetchCollections());
  const navCollections = collections?.filter((c) => c.showInNavigation) ?? [];
  const collectionHrefs = new Set(navCollections.map((c) => `/collection/${c.slug}`));
  const customLinks = navLinks?.filter((l) => !collectionHrefs.has(l.href)) ?? [];
  const hasLinks = navCollections.length > 0 || customLinks.length > 0;

  const itemCls = (active: boolean) =>
    cn(
      'relative block whitespace-nowrap px-2 py-3 text-[14.5px] font-medium transition-colors',
      'after:absolute after:inset-x-2 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-colors',
      active ? 'text-brand-700 after:bg-brand-600' : 'text-ink hover:text-brand-700 after:bg-transparent hover:after:bg-brand-600/40',
    );
  const linkCls = (href: string) => itemCls(location.pathname === href || location.pathname.startsWith(href + '/'));
  const activeNavId = location.pathname === '/shop' ? new URLSearchParams(location.search).get('nav') : null;
  const navCls = (id: string) => itemCls(activeNavId === id);

  return (
    <div className="hidden lg:block">
      <div className="container-chrome flex h-12 items-center">
        <CategoriesMenu className="shrink-0" />

        {hasLinks && <span className="mx-5 h-6 w-px shrink-0 bg-sand-200" aria-hidden />}

        {hasLinks && (
          <nav aria-label="Quick links" className="min-w-0 flex-1">
            <ul className="scrollbar-none flex items-center justify-between gap-6 overflow-x-auto">
              {navCollections.map((c) => (
                <li key={c.slug}>
                  <Link to={`/collection/${c.slug}`} className={linkCls(`/collection/${c.slug}`)}>
                    {loc(c.title)}
                  </Link>
                </li>
              ))}
              {customLinks.map((l) => (
                <li key={l.id}>
                  {l.href.startsWith('/') ? (
                    <Link to={`/shop?nav=${l.id}`} className={navCls(l.id)}>{loc(l.label)}</Link>
                  ) : (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkCls('')}>{loc(l.label)}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
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
    <header className="relative border-b border-sand-200 bg-ivory-50 shadow-sm">
      <div>
        <div className="container-chrome flex h-[72px] items-center gap-4 lg:gap-0">
          <IconButton label={t('a11y.openMenu')} className="-ml-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-haspopup="dialog">
            <Menu className="h-6 w-6" aria-hidden />
          </IconButton>

          <Logo />

          <span className="mx-6 hidden h-9 w-px shrink-0 bg-sand-200 lg:block" aria-hidden />

          <div className="hidden flex-1 md:flex">
            <SearchBar className="w-full" />
          </div>

          <span className="mx-6 hidden h-9 w-px shrink-0 bg-sand-200 lg:block" aria-hidden />

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <div className="hidden pr-2 lg:block">
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
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink sm:flex"
            >
              <User className="h-5 w-5" aria-hidden />
              {user && <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden />}
            </Link>

            <Link
              to="/wishlist"
              aria-label={t('a11y.wishlistLink', { count: wishCount })}
              title={t('common.wishlist')}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink sm:flex"
            >
              <Heart className="h-5 w-5" aria-hidden />
              <CountBadge count={wishCount} />
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={t('a11y.openCart', { count: cartCount })}
              aria-haspopup="dialog"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <CountBadge count={cartCount} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div id="mobile-search" className="container-chrome pb-3 md:hidden">
            <SearchBar autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Row 2: All Categories + Nav links */}
      <NavLinksBar />

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
