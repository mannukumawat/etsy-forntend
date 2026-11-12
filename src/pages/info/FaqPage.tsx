import { contentLanguage } from '@/utils/money';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { CustomerCareShell } from '@/components/layout/CustomerCareShell';

const STATIC_GROUPS = [
  {
    label: 'Orders',
    items: [
      { q: 'How do I track my order?', a: 'Use our Track Order page with your order number (format YS-XXXXXX) and the email used at checkout.' },
      { q: 'Can I cancel or change my order?', a: 'Orders can be cancelled or changed before dispatch. Contact us as soon as possible with your order number.' },
      { q: 'I received a wrong or damaged item — what do I do?', a: 'Contact us within 48 hours of delivery with photos. We will arrange a replacement or refund at no cost to you.' },
    ],
  },
  {
    label: 'Shipping',
    items: [
      { q: 'How long does delivery take?', a: 'Orders are processed in 1–2 business days. India deliveries take 3–7 days; international orders take 7–21 days depending on the destination.' },
      { q: 'Do you ship internationally?', a: 'Yes, we ship worldwide. Visit our Shipping page for destination-specific rates and estimated delivery times.' },
      { q: 'Is free shipping available?', a: 'Free standard shipping applies to orders above the threshold shown at checkout. Exact amounts may vary by location.' },
    ],
  },
  {
    label: 'Returns',
    items: [
      { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery for unused items in their original condition and packaging.' },
      { q: 'How do I start a return?', a: 'Contact us via the Contact page with your order number and reason. We will email you a return authorisation and next steps.' },
      { q: 'When will I receive my refund?', a: 'Refunds are processed within 5–7 business days of receiving the returned item and passing quality inspection.' },
    ],
  },
  {
    label: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards, UPI, net banking, and popular wallets at checkout.' },
      { q: 'Is my payment information secure?', a: 'Yes. All transactions are processed through PCI-DSS compliant payment gateways. We never store your card details.' },
      { q: 'Can I pay in my local currency?', a: 'Prices are shown in your local currency for reference. Final charges are settled in INR by your card issuer at their exchange rate.' },
    ],
  },
];

export default function FaqPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const { data: live } = useAsync('content:page:faq', () => contentService.getPage('faq'));
  const content = live?.content;

  const title = content ? loc(content.title) : t('pages.faq.title');
  const intro = content ? loc(content.intro) : t('pages.faq.intro');
  const contentLang = contentLanguage(lang);
  const showUntranslated = !!contentLang && !!content && !content.intro[contentLang];

  const flatItems = content
    ? content.sections.map((s) => ({ q: loc(s.heading), a: loc(s.body) }))
    : null;

  return (
    <CustomerCareShell title={title} intro={showUntranslated ? undefined : intro}>
      {flatItems ? (
        <div className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
          {flatItems.map((item) => (
            <details key={item.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink">
                <h2 className="font-sans text-base font-medium">{item.q}</h2>
                <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {STATIC_GROUPS.map((group) => (
            <section key={group.label} aria-labelledby={`faq-${group.label}`}>
              <h2 id={`faq-${group.label}`} className="mb-3 text-lg font-semibold text-ink">
                {group.label}
              </h2>
              <div className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
                {group.items.map((item) => (
                  <details key={item.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink">
                      <span className="font-sans text-[15px] font-medium">{item.q}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="pb-4 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="mt-8 text-ink-soft">
        Still have a question?{' '}
        <Link to="/contact" className="link">
          {t('nav.contact')}
        </Link>
      </p>
    </CustomerCareShell>
  );
}
