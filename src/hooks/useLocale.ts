import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RATE_SNAPSHOT } from '@/data/currencies';
import { usePreferences } from '@/store/preferences';
import type { LanguageCode, Localized, Minor } from '@/types';
import { contentLanguage, convertFromBase, formatMoney, toLanguageCode } from '@/utils/money';

export function useLanguage(): LanguageCode {
  const { i18n } = useTranslation();
  return toLanguageCode(i18n.language);
}

/** Picks the active language's translation of store content, falling back to the English original. */
export function useLocalized() {
  const lang = useLanguage();
  return useCallback(
    (text: Localized | null | undefined): string => {
      if (!text) return '';
      const content = contentLanguage(lang);
      return (content && text[content]) || text.en;
    },
    [lang],
  );
}

/** Money helpers bound to the active currency + language. */
export function useMoney() {
  const lang = useLanguage();
  const currency = usePreferences((s) => s.currency);
  return useMemo(
    () => ({
      currency,
      lang,
      snapshot: RATE_SNAPSHOT,
      /** Convert a base (USD) amount to the display currency's minor units. */
      convert: (base: Minor) => convertFromBase(base, currency, RATE_SNAPSHOT),
      /** Convert + format a base amount. */
      formatBase: (base: Minor) => formatMoney(convertFromBase(base, currency, RATE_SNAPSHOT), currency, lang),
      /** Format an amount already in the display currency. */
      format: (minor: Minor, code: 'symbol' | 'code' = 'symbol') => formatMoney(minor, currency, lang, code),
    }),
    [currency, lang],
  );
}
