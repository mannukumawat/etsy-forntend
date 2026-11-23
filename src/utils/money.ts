import { CURRENCIES } from '@/data/currencies';
import type { CurrencyCode, LanguageCode, Minor, RateSnapshot, ContentLanguage } from '@/types';

/** Round a minor-unit amount to the currency's rounding increment (half away from zero). */
export function roundMinor(amount: number, currency: CurrencyCode): Minor {
  const inc = CURRENCIES[currency].roundingIncrement;
  const sign = amount < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(amount) / inc) * inc;
}

/**
 * The FX rate to use for a currency. A missing, zero, negative or non-finite rate (stale
 * settings, a currency the snapshot does not cover) falls back to 1 (USD parity) so
 * conversion can never produce NaN or Infinity — prices stay shown, at the base rate,
 * instead of breaking the page.
 */
function safeRate(snapshot: RateSnapshot, currency: CurrencyCode): number {
  const rate = snapshot.rates[currency];
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 ? rate : 1;
}

/**
 * Convert a base-currency (USD) minor amount into the target currency's minor units.
 * Every price shown or summed in the UI goes through this so totals stay consistent:
 * we convert *unit* prices once, then do integer arithmetic in the target currency.
 */
export function convertFromBase(baseMinor: Minor, currency: CurrencyCode, snapshot: RateSnapshot): Minor {
  return roundMinor(baseMinor * safeRate(snapshot, currency), currency);
}

/** Convert a display-currency major amount (e.g. a price filter value) back to base minor units. */
export function majorToBaseMinor(major: number, currency: CurrencyCode, snapshot: RateSnapshot): Minor {
  return Math.round((major * 100) / safeRate(snapshot, currency));
}

export function minorToMajor(minor: Minor): number {
  return minor / 100;
}

const LOCALE_FOR_LANGUAGE: Record<LanguageCode, string> = {
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'en-IN': 'en-IN',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  es: 'es-ES',
  hi: 'hi-IN',
};

/** The store-content translation to request for a UI language (English variants use the original). */
export function contentLanguage(lang: LanguageCode): ContentLanguage | null {
  return lang === 'de' || lang === 'fr' || lang === 'it' || lang === 'es' || lang === 'hi' ? lang : null;
}

export function toLanguageCode(value: string | undefined | null): LanguageCode {
  return value && value in LOCALE_FOR_LANGUAGE ? (value as LanguageCode) : 'en-US';
}

const formatterCache = new Map<string, Intl.NumberFormat>();
function getFormatter(currency: CurrencyCode, language: LanguageCode, display: 'symbol' | 'code'): Intl.NumberFormat {
  const key = `${currency}|${language}|${display}`;
  let f = formatterCache.get(key);
  if (!f) {
    const digits = CURRENCIES[currency].fractionDigits;
    f = new Intl.NumberFormat(LOCALE_FOR_LANGUAGE[language] ?? 'en-US', {
      style: 'currency',
      currency,
      currencyDisplay: display === 'code' ? 'code' : 'narrowSymbol',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatterCache.set(key, f);
  }
  return f;
}

export function formatMoney(
  minor: Minor,
  currency: CurrencyCode,
  language: LanguageCode = 'en-US',
  display: 'symbol' | 'code' = 'symbol',
): string {
  return getFormatter(currency, language, display).format(minorToMajor(minor));
}

export function formatRate(currency: CurrencyCode, snapshot: RateSnapshot, language: LanguageCode = 'en-US'): string {
  const rate = snapshot.rates[currency];
  return new Intl.NumberFormat(LOCALE_FOR_LANGUAGE[language] ?? 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate);
}

export function localeFor(language: LanguageCode): string {
  return LOCALE_FOR_LANGUAGE[language] ?? 'en-US';
}
