import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Mail, Package, RefreshCw, Truck } from 'lucide-react';
import { CustomerCareShell } from '@/components/layout/CustomerCareShell';

const QUICK_ACTIONS = [
  {
    to: '/track-order',
    icon: Package,
    label: 'Track Order',
    desc: 'Check the status of your order with your order number and email.',
  },
  {
    to: '/shipping',
    icon: Truck,
    label: 'Shipping Info',
    desc: 'Delivery timelines, rates, and international shipping details.',
  },
  {
    to: '/returns',
    icon: RefreshCw,
    label: 'Returns',
    desc: 'Return window, eligibility, and how to start a return.',
  },
  {
    to: '/contact',
    icon: Mail,
    label: 'Contact Us',
    desc: 'Send a message and our team will respond within 1–2 business days.',
  },
] as const;

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Use our Track Order page with your order number (format YS-XXXXXX) and the email address you used at checkout.',
  },
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 30 days of delivery for unused items in their original condition and packaging.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes, we ship worldwide. Visit our Shipping page for destination-specific rates and estimated delivery times.',
  },
  {
    q: 'How long does order processing take?',
    a: 'Orders are processed and dispatched within 1–2 business days. Delivery time is additional and depends on your location.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards, UPI, net banking, and popular wallets at checkout.',
  },
  {
    q: 'Can I cancel or change my order?',
    a: 'Orders can be cancelled or changed before they are dispatched. Contact us as soon as possible with your order number.',
  },
];

export default function HelpCenterPage() {
  return (
    <CustomerCareShell title="How can we help?" isRoot>
      {/* Quick action cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="card group flex items-start gap-4 p-5 transition-shadow hover:shadow-lift"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-ink group-hover:text-brand-700">{label}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Popular questions */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
          <HelpCircle className="h-5 w-5 text-brand-600" aria-hidden />
          Popular questions
        </h2>
        <div className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink">
                <span className="font-sans text-[15px] font-medium">{item.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 rounded-xl border border-sand-200 bg-ivory px-6 py-5 text-sm text-ink-soft">
        Still need help?{' '}
        <Link to="/contact" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-[3px] hover:text-brand-800">
          Contact our team
        </Link>{' '}
        — we reply within 1–2 business days.
      </div>
    </CustomerCareShell>
  );
}
