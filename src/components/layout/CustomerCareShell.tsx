import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, HelpCircle, Mail, Package, RefreshCw, Truck, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const NAV_ITEMS = [
  { to: '/help', label: 'Help Center', icon: BookOpen },
  { to: '/track-order', label: 'Track Order', icon: Package },
  { to: '/shipping', label: 'Shipping', icon: Truck },
  { to: '/returns', label: 'Returns', icon: RefreshCw },
  { to: '/faq', label: 'FAQs', icon: HelpCircle },
  { to: '/contact', label: 'Contact', icon: Mail },
] as const;

interface CustomerCareShellProps {
  title: string;
  intro?: string;
  children: ReactNode;
  isRoot?: boolean;
}

export function CustomerCareShell({ title, intro, children, isRoot }: CustomerCareShellProps) {
  useDocumentTitle(title);
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const breadcrumbs = isRoot
    ? [{ label: 'Home', to: '/' }, { label: 'Customer Care' }]
    : [{ label: 'Home', to: '/' }, { label: 'Customer Care', to: '/help' }, { label: title }];

  const currentItem = NAV_ITEMS.find((n) => n.to === pathname);

  return (
    <div className="container-site max-w-5xl py-8 lg:py-12">
      <Breadcrumbs items={breadcrumbs} />

      {/* Mobile topic menu */}
      <div className="mt-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-medium text-ink shadow-sm"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            {currentItem && <currentItem.icon className="h-4 w-4 text-brand-600" aria-hidden />}
            {currentItem?.label ?? 'Help topics'}
          </span>
          {mobileOpen ? <X className="h-4 w-4 text-ink-muted" aria-hidden /> : <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />}
        </button>
        {mobileOpen && (
          <nav aria-label="Customer care navigation" className="mt-2 overflow-hidden rounded-xl border border-sand-200 bg-white shadow-sm">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 border-b border-sand-100 px-4 py-3 text-sm last:border-0 transition-colors ${
                    active ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-soft hover:bg-sand-50 hover:text-ink'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-600' : 'text-ink-muted'}`} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Customer Care</p>
            <nav aria-label="Customer care navigation">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-ink-soft hover:bg-sand-50 hover:text-ink'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-600' : 'text-ink-muted'}`} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Page content */}
        <main>
          <h1 className="text-3xl lg:text-4xl">{title}</h1>
          {intro && <p className="mt-2 text-base text-ink-soft">{intro}</p>}
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
