import { Heart, Home, LayoutGrid, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store/session';
import { useWishlist } from '@/store/wishlist';
import { cn } from '@/utils/cn';

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function MobileBottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useAuth((s) => s.user);
  const wishlistCount = useWishlist((s) => s.items.length);

  if (/^\/(login|register|forgot-password|reset-password|checkout|product|cart)(\/|$)/.test(pathname) || /\/account\/orders\/[^/]+\/review\//.test(pathname)) return null;

  const items = [
    { to: '/', label: t('nav.home', { defaultValue: 'Home' }), icon: Home, active: pathname === '/' },
    { to: '/shop', label: t('nav.categories', { defaultValue: 'Categories' }), icon: LayoutGrid, active: pathname === '/shop' || pathname.startsWith('/category/') || pathname.startsWith('/collection/') },
    { to: '/wishlist', label: t('common.wishlist'), icon: Heart, active: pathname === '/wishlist', badge: wishlistCount },
    { to: user ? '/account/orders' : '/login', label: t('nav.orders', { defaultValue: 'Orders' }), icon: Package, active: pathname.startsWith('/account/orders') },
  ];

  return (
    <nav aria-label={t('a11y.primaryNav')} className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-sand-200 bg-white/95 shadow-[0_-8px_24px_rgba(45,37,29,0.08)] backdrop-blur md:hidden">
      <div className="grid h-[58px] grid-cols-4 items-stretch">
        {items.map(({ to, label, icon: Icon, active, badge }) => (
          <Link key={to} to={to} aria-label={label} title={label} aria-current={active ? 'page' : undefined} className={cn('relative flex min-w-0 items-center justify-center', active ? 'text-brand-700' : 'text-ink-muted')}>
            {active && <span className="absolute top-0 h-0.5 w-9 rounded-b-full bg-brand-600" aria-hidden />}
            <span className={cn('relative flex h-10 w-12 items-center justify-center rounded-2xl transition-colors', active && 'bg-brand-50')}><Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} aria-hidden /><Badge count={badge ?? 0} /></span>
            <span className="sr-only">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
