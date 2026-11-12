import { Link } from 'react-router-dom';
import {
  ArrowRight, CreditCard, HelpCircle, Package, RefreshCw,
  Settings, ShoppingBag, Star, Truck, type LucideIcon,
} from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useLocalized } from '@/hooks/useLocale';
import { helpService, type HelpCategory } from '@/services/miscService';
import { InfoShell } from '@/pages/info/InfoShell';

const ICON_MAP: Record<string, LucideIcon> = {
  'help-circle': HelpCircle, 'package': Package, 'truck': Truck,
  'credit-card': CreditCard, 'refresh-cw': RefreshCw, 'settings': Settings,
  'shopping-bag': ShoppingBag, 'star': Star,
};

function CategoryCard({ cat }: { cat: HelpCategory & { articleCount?: number } }) {
  const loc = useLocalized();
  const Icon = ICON_MAP[cat.icon] ?? HelpCircle;
  return (
    <Link
      to={`/help/${cat.slug}`}
      className="card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-lift"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-base font-semibold text-ink group-hover:text-brand-700">
          {loc(cat.name)}
        </h2>
        {loc(cat.description) && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{loc(cat.description)}</p>
        )}
      </div>
      <span className="flex items-center gap-1 text-sm font-medium text-brand-600">
        Browse articles <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
}

export default function HelpCenterPage() {
  const { data, isLoading } = useAsync('help:categories', () => helpService.getCategories());

  return (
    <InfoShell title="Help Center" intro="Browse articles or search for answers to your questions." className="!max-w-4xl">
      <div className="mb-8 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 px-6 py-5">
        <p className="text-sm text-brand-800">
          Can't find what you're looking for?{' '}
          <Link to="/contact" className="font-semibold underline hover:text-brand-900">
            Contact us
          </Link>{' '}
          — we reply within 1–2 business days.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-sand-100" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <p className="text-ink-soft">No help articles yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
        </div>
      )}
    </InfoShell>
  );
}
