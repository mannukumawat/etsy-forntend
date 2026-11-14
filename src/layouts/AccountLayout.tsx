import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, IndianRupee, LogOut, MapPin, Package, RotateCcw, User } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth, useCheckout } from '@/store/session';
import { useUi } from '@/store/ui';
import { cn } from '@/utils/cn';

/** After an explicit sign-out: go home, then clear the flag so later visits get the normal login redirect. */
function HomeAfterSignOut() {
  useEffect(() => () => useAuth.setState({ signedOut: false }), []);
  return <Navigate to="/" replace />;
}

/** Redirects to /login when signed out, remembering where to return. */
export function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuth((s) => s.user);
  const signedOut = useAuth((s) => s.signedOut);
  const location = useLocation();
  if (!user && signedOut) return <HomeAfterSignOut />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

export function AccountLayout() {
  const { t } = useTranslation();
  const signOutUser = useAuth((s) => s.signOut);
  const resetCheckout = useCheckout((s) => s.reset);
  const toast = useUi((s) => s.toast);

  // RequireAuth sends the visitor home once the user is cleared.
  const signOut = () => {
    authService.logout().catch(() => {});
    signOutUser();
    resetCheckout();
    toast(t('account.signedOut'), 'info');
  };

  const links = [
    { to: '/account/profile', label: t('nav.profile', { defaultValue: 'Profile' }), icon: User, end: false },
    { to: '/account', label: t('nav.overview', { defaultValue: 'Overview' }), icon: User, end: true },
    { to: '/account/orders', label: t('nav.orders'), icon: Package, end: false },
    { to: '/account/returns', label: t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' }), icon: RotateCcw, end: false },
    { to: '/account/addresses', label: t('nav.addresses'), icon: MapPin, end: false },
    { to: '/account/bank-upi', label: 'Bank & UPI', icon: CreditCard, end: false },
    { to: '/account/payments', label: 'My Payments', icon: IndianRupee, end: false },
  ];

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mt-0 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          {/* Sidebar / mobile top nav */}
          <nav aria-label={t('account.title')} className="hidden lg:block lg:self-start lg:sticky lg:top-8">
            {/* Mobile: horizontal scroll strip */}
            <ul className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
              {links.map(({ to, label, icon: Icon, end }) => (
                <li key={to} className="shrink-0 snap-start">
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition-colors',
                        isActive ? 'border-ink bg-ink text-white' : 'border-sand-300 text-ink-soft hover:border-ink-muted hover:text-ink',
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={signOut}
                  className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-sand-300 px-4 text-xs font-semibold text-ink-soft hover:border-ink-muted hover:text-ink"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  {t('common.signOut')}
                </button>
              </li>
            </ul>

            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:gap-0.5">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                      isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-sand-100 hover:text-ink',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </NavLink>
              ))}
              <div className="mt-4 border-t border-sand-200 pt-4">
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft hover:bg-sand-100 hover:text-ink"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  {t('common.signOut')}
                </button>
              </div>
            </div>
          </nav>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
