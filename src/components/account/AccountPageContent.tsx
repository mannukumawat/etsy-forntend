import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronRight, CreditCard, Heart, HelpCircle, IndianRupee, LogOut, MapPin, MessageCircle, Package, RotateCcw } from 'lucide-react';
import { OrderStatusBadge } from '@/components/order/OrderParts';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { orderService } from '@/services/orderService';
import { returnsApi } from '@/api/returns';
import { exchangesApi } from '@/api/exchanges';
import { authService } from '@/services/authService';
import { useAuth, useCheckout } from '@/store/session';
import { useUi } from '@/store/ui';
import { formatDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export default function AccountPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const loc = useLocalized();
  const user = useAuth((s) => s.user)!;
  const signOutUser = useAuth((s) => s.signOut);
  const resetCheckout = useCheckout((s) => s.reset);
  const toast = useUi((s) => s.toast);
  useDocumentTitle(t('account.title'));

  const orders = useAsync(`orders:${user.id}`, () => orderService.listForUser(user.id));
  const returnsData = useAsync(`returns:list:${user.id}`, returnsApi.listReturns);
  const exchangesData = useAsync(`exchanges:list:${user.id}`, exchangesApi.listExchanges);

  const latestOrder = orders.data?.[0];
  const activeReturns = (returnsData.data?.items ?? []).filter(
    (r) => !['withdrawn', 'closed', 'refunded'].includes(r.status),
  );
  const activeExchanges = (exchangesData.data?.items ?? []).filter(
    (e) => !['withdrawn', 'closed', 'delivered'].includes(e.status),
  );
  const activeRequests = [...activeReturns, ...activeExchanges];
  const referralMessage = t('account.referralMessage', {
    name: user.name,
    url: window.location.origin,
  });
  const whatsappReferralUrl = `https://wa.me/?text=${encodeURIComponent(referralMessage)}`;

  const signOut = () => {
    authService.logout().catch(() => {});
    signOutUser();
    resetCheckout();
    toast(t('account.signedOut'), 'info');
  };

  return (
    <>
      <div className="space-y-6 md:hidden">
        <Link to="/account/profile" className="flex items-center gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-semibold text-ink">{user.name}</span>
            <span className="mt-0.5 block truncate text-xs text-ink-muted">{user.email}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/help" className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-sand-200 bg-white p-4 text-center font-semibold text-ink shadow-sm">
            <HelpCircle className="h-7 w-7 text-brand-700" aria-hidden />
            {t('nav.help', { defaultValue: 'Help Centre' })}
          </Link>
          <a href={whatsappReferralUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-sand-200 bg-white p-4 text-center font-semibold text-ink shadow-sm">
            <MessageCircle className="h-7 w-7 text-emerald-600" aria-hidden />
            {t('account.referWhatsApp', { defaultValue: 'Refer on WhatsApp' })}
          </a>
          <Link to="/account/returns" className="col-span-2 flex min-h-16 items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 font-semibold text-ink shadow-sm">
            <RotateCcw className="h-7 w-7 text-brand-700" aria-hidden />
            <span className="flex-1">{t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' })}</span>
            <ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden />
          </Link>
        </div>

        <AccountMenuSection title={t('account.myAccount', { defaultValue: 'My Account' })} items={[
          { to: '/account/orders', label: t('nav.orders'), icon: Package },
          { to: '/account/addresses', label: t('nav.addresses'), icon: MapPin },
        ]} />

        <AccountMenuSection title={t('account.payments', { defaultValue: 'Payments & refunds' })} items={[
          { to: '/account/bank-upi', label: t('account.bankUpiDetails', { defaultValue: 'Bank & UPI Details' }), icon: CreditCard },
          { to: '/account/payments', label: t('account.myPayments', { defaultValue: 'My Payments' }), icon: IndianRupee },
        ]} />

        <section>
          <h2 className="mb-2 px-1 font-sans text-base font-semibold text-ink">{t('account.activity', { defaultValue: 'My Activity' })}</h2>
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
            <Link to="/wishlist" className="flex min-h-14 items-center gap-3 border-b border-sand-200 px-4 py-3 text-sm font-medium text-ink">
              <Heart className="h-5 w-5 text-brand-700" aria-hidden />
              <span className="flex-1">{t('common.wishlist')}</span>
              <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden />
            </Link>
            <button type="button" onClick={signOut} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-700">
              <LogOut className="h-5 w-5" aria-hidden />
              <span className="flex-1">{t('common.signOut')}</span>
            </button>
          </div>
        </section>
      </div>

      <div className="hidden space-y-8 md:block">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {t('account.welcome', { name: user.name.split(' ')[0] })}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t('account.memberSince', { date: formatDate(user.createdAt, lang, { month: 'long', year: 'numeric' }) })}
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { to: '/account/orders', label: t('nav.orders'), icon: Package },
          { to: '/account/returns', label: t('account.returnsAndExchanges', { defaultValue: 'Returns & exchanges' }), icon: RotateCcw },
          { to: '/account/addresses', label: t('nav.addresses'), icon: MapPin },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2.5 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm transition hover:border-sand-300 hover:shadow"
          >
            <Icon className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      {/* Latest order */}
      <section aria-labelledby="latest-order-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="latest-order-title" className="text-base font-semibold text-ink">
            {t('account.latestOrder', { defaultValue: 'Latest order' })}
          </h2>
          <Link
            to="/account/orders"
            className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            {t('common.viewAll')} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {orders.isError ? (
          <ErrorState onRetry={orders.reload} />
        ) : !orders.data ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : !latestOrder ? (
          <div className="rounded-xl border border-sand-200 bg-white px-5 py-4 text-sm text-ink-muted">
            {t('account.noOrders')}
          </div>
        ) : (
          <Link
            to={`/account/orders/${latestOrder.id}`}
            className="card block p-4 transition hover:shadow-lift sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-ink">{latestOrder.number}</span>
                  <OrderStatusBadge status={latestOrder.status} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">{formatDate(latestOrder.createdAt, lang)}</p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-ink">
                {formatMoney(latestOrder.total, latestOrder.currency, lang)}
              </span>
            </div>
            {latestOrder.lines.length > 0 && (
              <div className="mt-3 flex items-center gap-2 border-t border-sand-200 pt-3">
                <ul className="flex gap-1.5" aria-hidden>
                  {latestOrder.lines.slice(0, 4).map((l) => (
                    <li key={l.variantId}>
                      <img
                        src={l.image.src}
                        alt=""
                        title={loc(l.name)}
                        className="h-10 w-10 rounded-lg border border-sand-200 object-cover"
                        loading="lazy"
                      />
                    </li>
                  ))}
                  {latestOrder.lines.length > 4 && (
                    <li className="flex h-10 w-10 items-center justify-center rounded-lg border border-sand-200 bg-sand-100 text-xs font-semibold text-ink-muted">
                      +{latestOrder.lines.length - 4}
                    </li>
                  )}
                </ul>
                <p className="line-clamp-1 min-w-0 flex-1 text-xs text-ink-soft">
                  {latestOrder.lines.map((l) => loc(l.name)).join(', ')}
                </p>
              </div>
            )}
          </Link>
        )}
      </section>

      {/* Active return / exchange requests */}
      {(returnsData.data || exchangesData.data) && activeRequests.length > 0 && (
        <section aria-labelledby="active-requests-title">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="active-requests-title" className="text-base font-semibold text-ink">
              {t('account.activeRequests', { defaultValue: 'Active requests' })}
            </h2>
            <Link
              to="/account/returns"
              className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {activeRequests.slice(0, 3).map((req) => {
              const isReturn = 'refund' in req;
              const ref = req.reference;
              const to = isReturn ? `/account/returns/${ref}` : `/account/exchanges/${ref}`;
              return (
                <li key={ref}>
                  <Link to={to} className="card flex items-center gap-3 p-4 transition hover:shadow-lift">
                    <RotateCcw className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold text-ink">{ref}</span>
                      <span className={`ml-2 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isReturn ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                        {isReturn ? t('returns.typeReturn', { defaultValue: 'Return' }) : t('returns.typeExchange', { defaultValue: 'Exchange' })}
                      </span>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {t(`returns.status.${req.status}`, { defaultValue: req.status.replace(/_/g, ' ') })}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      </div>
    </>
  );
}

function AccountMenuSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ to: string; label: string; icon: typeof Package }>;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 font-sans text-base font-semibold text-ink">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
        {items.map(({ to, label, icon: Icon }, index) => (
          <Link key={to} to={to} className={`flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-medium text-ink ${index < items.length - 1 ? 'border-b border-sand-200' : ''}`}>
            <Icon className="h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <span className="min-w-0 flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
