import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ChevronRight, Heart, Lock, Menu, MapPin, Plus, Search, ShoppingBag, User, X } from 'lucide-react';
import logoMark from '@/assets/logo-mark.webp';
import { fetchCollections, fetchNavLinks } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { selectCartCount, useCart } from '@/store/cart';
import { useAuth } from '@/store/session';
import { useSiteSettings } from '@/store/siteSettings';
import { useUi } from '@/store/ui';
import { useWishlist } from '@/store/wishlist';
import { usePreferences } from '@/store/preferences';
import { getCountry } from '@/data/countries';
import { authService } from '@/services/authService';
import { cn } from '@/utils/cn';
import { IconButton } from '../ui/Button';
import { Modal } from '../ui/Dialog';
import { CategoriesMenu } from './CategoriesMenu';
import { MobileMenu } from './MobileMenu';
import { NotificationBell } from './NotificationBell';
import { SettingsButton } from './Preferences';
import { SearchBar } from './SearchBar';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span aria-hidden className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  // H1: the logo comes from the live store settings (GET /api/settings → store.logo.url,
  // admin-uploaded and served via Cloudinary); the bundled mark is only the fallback
  // while settings have not loaded or no logo is configured.
  const logoUrl = useSiteSettings((s) => s.store.logo?.url);
  return (
    <Link to="/" className={cn('flex shrink-0 items-center', className)}>
      <img src={logoUrl ?? logoMark} alt="Home" className="h-9 w-9 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12" />
    </Link>
  );
}

function NavLinksBar() {
  const { t } = useTranslation();
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
      'relative block whitespace-nowrap px-2 py-2.5 text-[13px] font-medium transition-colors',
      'after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:transition-colors',
      active ? 'text-brand-700 after:bg-brand-600' : 'text-ink hover:text-brand-700 after:bg-transparent hover:after:bg-brand-600/40',
    );
  const linkCls = (href: string) => itemCls(location.pathname === href || location.pathname.startsWith(href + '/'));
  const activeNavId = location.pathname === '/shop' ? new URLSearchParams(location.search).get('nav') : null;
  const navCls = (id: string) => itemCls(activeNavId === id);

  return (
    <div className="hidden lg:block">
      <div className="container-chrome flex h-10 items-center">
        {hasLinks && (
          <nav aria-label={t('a11y.quickLinks')} className="scrollbar-none min-w-0 flex-1 overflow-x-auto">
            <ul className="mx-auto flex w-max items-center gap-6">
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
  const deliveryCountry = usePreferences((s) => s.deliveryCountry);
  const delivery = getCountry(deliveryCountry);
  const addresses = useAsync(user ? `addresses:header:${user.id}` : null, () => authService.listAddresses());
  const [selectedAddressId, setSelectedAddressId] = useState(() => localStorage.getItem('etcy:delivery-address'));
  const [locationOpen, setLocationOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAccountRoute = pathname.startsWith('/account');
  const isProductRoute = pathname.startsWith('/product/');
  const isCartRoute = pathname === '/cart';
  const isCheckoutRoute = pathname === '/checkout';
  const isFeedbackRoute = /^\/account\/orders\/[^/]+\/review\/[^/]+/.test(pathname);
  const isOrderDetailRoute = /^\/account\/orders\/[^/]+/.test(pathname);
  const accountMobileTitle = isFeedbackRoute
    ? t('product.writeTitle', { defaultValue: 'Add feedback' })
    : isOrderDetailRoute
    ? t('order.detailsTitle', { defaultValue: 'Order details' })
    : pathname.startsWith('/account/orders')
      ? t('account.orders')
    : pathname.startsWith('/account/addresses')
      ? t('account.addresses')
      : t('account.title');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const selectedAddress = addresses.data?.find((address) => address.id === selectedAddressId)
    ?? addresses.data?.find((address) => address.isDefault)
    ?? addresses.data?.[0];
  const deliveryLabel = selectedAddress
    ? `${selectedAddress.city}${selectedAddress.postalCode ? ` - ${selectedAddress.postalCode}` : ''}`
    : (delivery?.name ?? deliveryCountry);

  useEffect(() => {
    if (!selectedAddress || selectedAddressId) return;
    setSelectedAddressId(selectedAddress.id);
  }, [selectedAddress, selectedAddressId]);

  const selectDeliveryAddress = (id: string) => {
    setSelectedAddressId(id);
    localStorage.setItem('etcy:delivery-address', id);
    setLocationOpen(false);
  };

  return (
    <header className="relative border-b border-sand-200 bg-ivory-50 shadow-sm">
      {isCartRoute ? (
        <div className="md:hidden">
          <div className="container-chrome flex h-16 items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} aria-label={t('common.back', { defaultValue: 'Back' })} className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink"><ArrowLeft className="h-5 w-5" aria-hidden /></button>
            <span className="ml-1 flex-1 text-sm font-semibold uppercase tracking-wide text-ink">{t('cart.title')}</span>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{t('checkout.stepCount', { defaultValue: 'Step 1/3' })}</span>
          </div>
        </div>
      ) : isCheckoutRoute ? (
        <div className="md:hidden">
          <div className="container-chrome flex h-16 items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} aria-label={t('common.back', { defaultValue: 'Back' })} className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="ml-1 flex-1 text-sm font-semibold uppercase tracking-wide text-ink">{t('checkout.title')}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-sage-700" title={t('checkout.secure', { defaultValue: 'Secure checkout' })}>
              <Lock className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
      ) : isProductRoute ? (
        <div className="md:hidden">
          <div className="container-chrome flex h-14 items-center gap-1">
            <button type="button" onClick={() => navigate(-1)} aria-label={t('common.back', { defaultValue: 'Back' })} className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="ml-auto flex items-center gap-1">
              <SettingsButton variant="icon" />
              <Link to="/shop" aria-label={t('a11y.openSearch')} className="flex h-10 w-10 items-center justify-center rounded-full text-ink"><Search className="h-5 w-5" aria-hidden /></Link>
              <Link to="/wishlist" aria-label={t('a11y.wishlistLink', { count: wishCount })} className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink"><Heart className="h-5 w-5" aria-hidden /><CountBadge count={wishCount} /></Link>
              <button type="button" onClick={openCart} aria-label={t('a11y.openCart', { count: cartCount })} className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink"><ShoppingBag className="h-5 w-5" aria-hidden /><CountBadge count={cartCount} /></button>
            </div>
          </div>
          <button type="button" onClick={() => setLocationOpen(true)} className="flex w-full items-center gap-2 border-t border-sand-200 bg-sand-100/70 px-4 py-2.5 text-left text-sm font-semibold text-ink">
            <MapPin className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{t('header.deliveringTo', { defaultValue: 'Delivering to' })} {deliveryLabel}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          </button>
        </div>
      ) : isAccountRoute ? (
        <div className="md:hidden">
          <div className="container-chrome flex h-16 items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} aria-label={t('common.back', { defaultValue: 'Back' })} className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="ml-1 flex-1 text-sm font-semibold uppercase tracking-wide text-ink">
              {accountMobileTitle}
            </span>
            <Link to="/shop" aria-label={t('a11y.openSearch')} className={cn('h-10 w-10 items-center justify-center rounded-full text-ink', isFeedbackRoute ? 'hidden' : 'flex')}>
              <Search className="h-5 w-5" aria-hidden />
            </Link>
            <button type="button" onClick={openCart} aria-label={t('a11y.openCart', { count: cartCount })} className={cn('relative h-10 w-10 items-center justify-center rounded-full text-ink', isFeedbackRoute ? 'hidden' : 'flex')}>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <CountBadge count={cartCount} />
            </button>
          </div>
        </div>
      ) : (
      <div className="md:hidden">
        <div className="container-chrome flex h-14 items-center gap-2">
          <Link
            to={user ? '/account' : '/login'}
            aria-label={user ? t('header.signedInAs', { name: user.name }) : t('a11y.accountLink')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 font-semibold text-ink"
          >
            {user ? user.name.trim().charAt(0).toUpperCase() : <User className="h-5 w-5" aria-hidden />}
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <SettingsButton variant="icon" />
            <Link to="/wishlist" aria-label={t('a11y.wishlistLink', { count: wishCount })} className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink">
              <Heart className="h-5 w-5" aria-hidden />
              <CountBadge count={wishCount} />
            </Link>
            <button type="button" onClick={openCart} aria-label={t('a11y.openCart', { count: cartCount })} className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink">
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <CountBadge count={cartCount} />
            </button>
          </div>
        </div>
        <div className="container-chrome pb-3">
          <SearchBar />
        </div>
        <button type="button" onClick={() => setLocationOpen(true)} className="flex w-full items-center gap-2 border-t border-sand-200 bg-sand-100/70 px-4 py-2.5 text-left text-sm font-semibold text-ink">
          <MapPin className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {t('header.deliveringTo', { defaultValue: 'Delivering to' })} {deliveryLabel}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
        </button>
      </div>
      )}

      <div className="hidden md:block">
        <div className="container-chrome flex h-14 items-center gap-2 sm:h-16 sm:gap-4 lg:gap-0">
          <IconButton label={t('a11y.openMenu')} className="-ml-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-haspopup="dialog">
            <Menu className="h-5 w-5" aria-hidden />
          </IconButton>

          <Logo />

          <span className="mx-5 hidden h-7 w-px shrink-0 bg-sand-200 lg:block" aria-hidden />

          <CategoriesMenu className="mr-3 hidden shrink-0 lg:block" />

          <div className="hidden flex-1 md:flex">
            <SearchBar className="w-full" />
          </div>

          <span className="mx-5 hidden h-7 w-px shrink-0 bg-sand-200 lg:block" aria-hidden />

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

            {user && <NotificationBell />}

            <Link
              to={user ? '/account' : '/login'}
              aria-label={user ? t('header.signedInAs', { name: user.name }) : t('a11y.accountLink')}
              title={user ? t('header.signedInAs', { name: user.name }) : t('a11y.accountLink')}
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink sm:flex"
            >
              <User className="h-[18px] w-[18px]" aria-hidden />
              {user && <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden />}
            </Link>

            <Link
              to="/wishlist"
              aria-label={t('a11y.wishlistLink', { count: wishCount })}
              title={t('common.wishlist')}
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink sm:flex"
            >
              <Heart className="h-[18px] w-[18px]" aria-hidden />
              <CountBadge count={wishCount} />
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={t('a11y.openCart', { count: cartCount })}
              aria-haspopup="dialog"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink sm:flex"
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
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
      <Modal open={locationOpen} onClose={() => setLocationOpen(false)} title={t('account.changeDeliveryLocation', { defaultValue: 'Change delivery location' })} className="max-w-xl">
        {user ? (
          <div>
            {addresses.data && addresses.data.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                {addresses.data.map((address) => {
                  const active = selectedAddress?.id === address.id;
                  return (
                    <li key={address.id}>
                      <button type="button" onClick={() => selectDeliveryAddress(address.id)} className={cn('relative h-full min-h-36 w-full rounded-xl border bg-white p-4 text-left transition min-[390px]:min-h-44', active ? 'border-brand-600 ring-1 ring-brand-600' : 'border-sand-300')}>
                        {active && <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow"><Check className="h-5 w-5" aria-hidden /></span>}
                        <span className="block font-semibold text-ink">{address.label || address.fullName}</span>
                        <span className="mt-2 line-clamp-4 block text-sm leading-5 text-ink-soft">{address.fullName}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city}{address.region ? `, ${address.region}` : ''}{address.postalCode ? `, ${address.postalCode}` : ''}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : addresses.data ? <p className="py-6 text-center text-sm text-ink-muted">{t('account.noAddresses')}</p> : <div className="h-44 animate-pulse rounded-xl bg-sand-100" />}
            <Link to="/account/addresses" onClick={() => setLocationOpen(false)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-brand-600 font-semibold text-brand-700"><Plus className="h-4 w-4" aria-hidden />{t('account.addAddress')}</Link>
          </div>
        ) : (
          <div className="py-4 text-center"><p className="text-sm text-ink-muted">{t('auth.loginSubtitle')}</p><Link to="/login" onClick={() => setLocationOpen(false)} className="mt-4 inline-flex rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white">{t('auth.submitLogin')}</Link></div>
        )}
      </Modal>
    </header>
  );
}
