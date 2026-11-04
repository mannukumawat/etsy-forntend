import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { useLanguage, useLocalized } from '@/hooks/useLocale';
import { formatDate } from '@/utils/dates';
import logoMark from '@/assets/logo-mark.png';
import { useSiteSettings } from '@/store/siteSettings';
import { NewsletterForm } from './NewsletterForm';

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'pinterest', label: 'Pinterest', Icon: null },
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
] as const;

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.8-4.3-4.5-4.3-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.4-.7-2.2-2.7-2.2-4.3 0-3.5 2.5-6.7 7.3-6.7 3.8 0 6.8 2.7 6.8 6.4 0 3.8-2.4 6.9-5.8 6.9-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const lang = useLanguage();
  const STORE = useSiteSettings((s) => s.store);
  const year = new Date().getFullYear();
  const heading = 'font-sans text-sm font-semibold text-ink';
  const link = 'text-sm text-ink-muted transition-colors hover:text-ink hover:underline';

  return (
    <footer className="mt-20 border-t border-sand-200 bg-ivory-200/60">
      <div className="container-chrome grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
            <p className="font-serif text-3xl font-semibold">{STORE.name}</p>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-muted">{loc(STORE.tagline)}</p>
          <div className="mt-6 space-y-1.5 text-sm text-ink-soft">
            {STORE.contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <a href={`mailto:${STORE.contact.email}`} className="hover:text-ink hover:underline">{STORE.contact.email}</a>
              </div>
            )}
            {STORE.contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <span>{STORE.contact.phone}</span>
              </div>
            )}
            {STORE.contact.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <span>{STORE.contact.address}</span>
              </div>
            )}
          </div>
        </div>

        <nav aria-label={t('a11y.footerNav')} className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-1 lg:col-span-5">
          <div>
            <h2 className={heading}>{t('nav.shop')}</h2>
            <ul className="mt-3 space-y-2">
              <li><Link to="/new-in" className={link}>{t('nav.newIn')}</Link></li>
              {CATEGORIES.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  <Link to={`/category/${c.slug}`} className={link}>{loc(c.name)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={heading}>{t('nav.help')}</h2>
            <ul className="mt-3 space-y-2">
              <li><Link to="/shipping" className={link}>{t('nav.shipping')}</Link></li>
              <li><Link to="/returns" className={link}>{t('nav.returns')}</Link></li>
              <li><Link to="/faq" className={link}>{t('nav.faq')}</Link></li>
              <li><Link to="/track-order" className={link}>{t('nav.trackOrder')}</Link></li>
              <li><Link to="/contact" className={link}>{t('nav.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className={heading}>{t('nav.company')}</h2>
            <ul className="mt-3 space-y-2">
              <li><Link to="/about" className={link}>{t('nav.about')}</Link></li>
              <li><Link to="/privacy" className={link}>{t('nav.privacy')}</Link></li>
              <li><Link to="/terms" className={link}>{t('nav.terms')}</Link></li>
              <li><Link to="/account" className={link}>{t('nav.myAccount')}</Link></li>
            </ul>
          </div>
        </nav>

        <div className="md:col-span-2 lg:col-span-4">
          <h2 className={heading}>{t('footer.newsletterHeading')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('footer.newsletterBody')}</p>
          <div className="mt-4">
            <NewsletterForm id="footer-newsletter" />
          </div>
          {SOCIAL.some(({ key }) => !!STORE.social[key]) && (
            <>
              <p className="mt-6 text-sm font-semibold text-ink">{t('footer.follow')}</p>
              <ul className="mt-2 flex gap-2">
                {SOCIAL.filter(({ key }) => !!STORE.social[key]).map(({ key, label, Icon }) => {
                  const url = STORE.social[key];
                  const icon = Icon ? <Icon className="h-5 w-5" aria-hidden /> : <PinterestIcon />;
                  return (
                    <li key={key}>
                      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-300 text-ink hover:bg-white">
                        {icon}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-sand-200">
        <div className="container-chrome space-y-1 py-5 text-xs text-ink-muted">
          <p>{t('footer.rights', { year, store: STORE.name })}</p>
          <p>{t('footer.ratesNote', { date: formatDate(RATE_SNAPSHOT.asOf, lang) })}</p>
        </div>
      </div>
    </footer>
  );
}
