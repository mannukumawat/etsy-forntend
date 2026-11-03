import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Dialog';
import { COUNTRIES } from '@/data/countries';
import { CURRENCIES, CURRENCY_CODES } from '@/data/currencies';
import { useLanguage } from '@/hooks/useLocale';
import { LANGUAGES } from '@/i18n';
import { usePreferences } from '@/store/preferences';
import type { CurrencyCode, LanguageCode } from '@/types';
import { cn } from '@/utils/cn';

const EURO_COUNTRIES = new Set(['DE', 'FR', 'IT', 'ES', 'NL', 'IE', 'PT', 'BE', 'AT', 'FI', 'GR']);
const SYMBOL: Record<CurrencyCode, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };

/** Currency a shopper from this region most likely wants (they can still change it). */
export function currencyForRegion(code: string): CurrencyCode {
  if (code === 'IN') return 'INR';
  if (code === 'GB') return 'GBP';
  if (EURO_COUNTRIES.has(code)) return 'EUR';
  return 'USD';
}

/** Language a shopper from this region most likely reads (they can still change it). */
export function languageForRegion(code: string): LanguageCode {
  const map: Record<string, LanguageCode> = { GB: 'en-GB', IE: 'en-GB', IN: 'en-IN', DE: 'de', FR: 'fr', IT: 'it', ES: 'es' };
  return map[code] ?? 'en-US';
}

/** Regions = countries the store actually ships to, alphabetical (like Etsy's region list). */
const REGIONS = COUNTRIES.filter((c) => c.zone !== null).sort((a, b) => a.name.localeCompare(b.name));
const regionName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;

function SelectRow({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input h-14 appearance-none rounded-lg pr-10 text-base">
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" aria-hidden />
      </div>
    </div>
  );
}

/** Etsy-style "Update your settings": region, language and currency in one dialog, applied on Save. */
export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const currentLang = useLanguage();
  const { currency, deliveryCountry, setCurrency, setDeliveryCountry } = usePreferences();
  const [region, setRegion] = useState(deliveryCountry);
  const [cur, setCur] = useState<CurrencyCode>(currency);
  const [lang, setLang] = useState<LanguageCode>(currentLang);
  const [touchedCurrency, setTouchedCurrency] = useState(false);
  const [touchedLang, setTouchedLang] = useState(false);

  const save = () => {
    setDeliveryCountry(region);
    setCurrency(cur);
    if (lang !== currentLang) {
      // Like Etsy, a language switch reloads the page so all store content is fetched in that language.
      void i18n.changeLanguage(lang).then(() => window.location.reload());
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('prefs.title')}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6">
            {t('prefs.cancel')}
          </Button>
          <Button onClick={save} className="rounded-full bg-ink px-7 hover:bg-ink/90">
            {t('prefs.save')}
          </Button>
        </div>
      }
    >
      <p className="text-ink-soft">{t('prefs.intro')}</p>
      <div className="mt-6 space-y-6">
        <SelectRow
          id="pref-region"
          label={t('prefs.region')}
          value={region}
          onChange={(v) => {
            setRegion(v);
            // Follow the region's currency until the shopper picks one themselves.
            if (!touchedCurrency) setCur(currencyForRegion(v));
            if (!touchedLang) setLang(languageForRegion(v));
          }}
        >
          {REGIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectRow>
        <SelectRow
          id="pref-language"
          label={t('prefs.language')}
          value={lang}
          onChange={(v) => {
            setLang(v as LanguageCode);
            setTouchedLang(true);
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.label}
            </option>
          ))}
        </SelectRow>
        <div>
          <SelectRow
            id="pref-currency"
            label={t('prefs.currency')}
            value={cur}
            onChange={(v) => {
              setCur(v as CurrencyCode);
              setTouchedCurrency(true);
            }}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {SYMBOL[code]} {CURRENCIES[code].name.en} ({code})
              </option>
            ))}
          </SelectRow>
          <p className="mt-1.5 text-xs text-ink-muted">{t('prefs.ratesNote')}</p>
        </div>
      </div>
    </Modal>
  );
}

/** Header/mobile trigger showing the current region and currency. */
export function SettingsButton({ variant = 'compact', className }: { variant?: 'compact' | 'full'; className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { currency, deliveryCountry } = usePreferences();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('prefs.open', { region: regionName(deliveryCountry), currency })}
        className={cn(
          variant === 'compact'
            ? 'flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink hover:bg-sand-100'
            : 'input flex h-12 w-full items-center justify-between text-left',
          className,
        )}
      >
        <span className="flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-ink-muted" aria-hidden />
          {variant === 'compact' ? deliveryCountry : regionName(deliveryCountry)}
          <span className="text-sand-300" aria-hidden>
            |
          </span>
          {SYMBOL[currency]} {currency}
        </span>
        {variant === 'full' && <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />}
      </button>
      {open && <SettingsDialog open onClose={() => setOpen(false)} />}
    </>
  );
}
