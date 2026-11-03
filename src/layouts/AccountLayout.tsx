import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, MapPin, Package, RotateCcw, User } from 'lucide-react';
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
    { to: '/account', label: t('nav.profile'), icon: User, end: true },
    { to: '/account/orders', label: t('nav.orders'), icon: Package, end: false },
    { to: '/account/returns', label: t('returns.title'), icon: RotateCcw, end: false },
    { to: '/account/addresses', label: t('nav.addresses'), icon: MapPin, end: false },
  ];

  return (
    <RequireAuth>
      <div className="container-site py-8 lg:py-12">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl lg:text-5xl">{t('account.title')}</h1>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav aria-label={t('account.title')}>
            <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
              {links.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-sand-100',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-sand-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {t('common.signOut')}
                </button>
              </li>
            </ul>
          </nav>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
