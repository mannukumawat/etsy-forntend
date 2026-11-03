import { Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEMO_COUPON } from '@/config/store';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Spinner } from '@/components/ui/Feedback';
import { ToastViewport } from '@/components/ui/Toasts';
import { API_MODE, setUnauthorizedHandler } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { authService } from '@/services/authService';
import { contentService } from '@/services/contentService';
import { useAuth } from '@/store/session';
import { useUi } from '@/store/ui';

/** Admin-published announcement when available; the original demo-coupon text as the mock-mode
 *  fallback (and before the first fetch resolves). */
function AnnouncementBar() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { data: homepage } = useAsync('content:homepage', () => contentService.getHomepage());
  const live = homepage?.content;

  if (live) {
    if (!live.announcement.enabled) return null;
    return <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-ivory sm:text-[13px]">{loc(live.announcement.text)}</div>;
  }
  return (
    <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-ivory sm:text-[13px]">
      {t('announcement.text', { code: DEMO_COUPON.code, percent: DEMO_COUPON.percentOff })}
    </div>
  );
}

export function MainLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const closeCart = useUi((s) => s.closeCart);
  const setUser = useAuth((s) => s.setUser);
  const signOut = useAuth((s) => s.signOut);
  const toast = useUi((s) => s.toast);

  useEffect(() => closeCart(), [pathname, closeCart]);

  // Restores the signed-in customer from the httpOnly session cookie after a page refresh, and signs
  // the customer out locally (no redirect loop) if the server ever rejects a request as unauthorized.
  useEffect(() => {
    if (!API_MODE) return;
    authService.me().then((user) => {
      if (user) setUser(user);
    });
    setUnauthorizedHandler(() => {
      if (useAuth.getState().user) {
        signOut();
        toast(t('auth.sessionExpired'), 'error');
      }
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('a11y.skipToContent')}
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<Spinner className="py-32" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <ToastViewport />
      <ScrollRestoration />
    </div>
  );
}
