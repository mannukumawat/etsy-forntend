import { contentLanguage } from '@/utils/money';
import { useTranslation } from 'react-i18next';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage, useLocalized, useMoney } from '@/hooks/useLocale';
import { contentService } from '@/services/contentService';
import { useSiteSettings } from '@/store/siteSettings';
import { InfoShell, Sections, type InfoSection } from './InfoShell';

export default function ShippingPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const money = useMoney();
  const liveZones = useSiteSettings((s) => s.shipping.zones);
  const { data: live } = useAsync('content:page:shipping', () => contentService.getPage('shipping'));
  const content = live?.content;

  const title = content ? loc(content.title) : t('pages.shipping.title');
  const intro = content ? loc(content.intro) : t('pages.shipping.intro');
  const sections: InfoSection[] = content
    ? content.sections.map((s) => ({ heading: loc(s.heading), body: loc(s.body) }))
    : (t('pages.shipping.sections', { returnObjects: true }) as InfoSection[]);
  // Flag admin-written page content that has no translation yet for the shopper's language.
  const contentLang = contentLanguage(lang);
  const showUntranslated = !!contentLang && !!content && !content.intro[contentLang];

  const rows = liveZones.map((z) => ({
    key: z.id,
    name: z.name,
    standard: z.standard.enabled ? { price: z.standard.rate, minDays: z.standard.minDays, maxDays: z.standard.maxDays } : null,
    express: z.express.enabled ? { price: z.express.rate, minDays: z.express.minDays, maxDays: z.express.maxDays } : null,
  }));

  return (
    <InfoShell title={title} intro={intro} showUntranslatedNotice={showUntranslated}>
      <section aria-labelledby="rates-title">
        <h2 id="rates-title" className="text-2xl">
          {t('pages.shipping.ratesTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t('pages.shipping.ratesNote', { currency: money.currency })}</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-sand-200 bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-ivory-200/70 text-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t('pages.shipping.zone')}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t('pages.shipping.standard')}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t('pages.shipping.express')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className="px-4 py-3 font-medium">
                    {row.name}
                  </th>
                  <td className="px-4 py-3">
                    {row.standard ? (
                      <>
                        {money.formatBase(row.standard.price)}
                        <span className="block text-xs text-ink-muted">{t('pages.shipping.days', { min: row.standard.minDays, max: row.standard.maxDays })}</span>
                      </>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.express ? (
                      <>
                        {money.formatBase(row.express.price)}
                        <span className="block text-xs text-ink-muted">{t('pages.shipping.days', { min: row.express.minDays, max: row.express.maxDays })}</span>
                      </>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-10">
        <Sections sections={sections} />
      </div>
    </InfoShell>
  );
}
