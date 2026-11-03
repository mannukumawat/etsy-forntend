import { useMemo } from 'react';
import { COUNTRIES, type CountryConfig } from '@/data/countries';
import { localeFor } from '@/utils/money';
import { useLanguage } from './useLocale';

/** Country list with names localised via Intl.DisplayNames, sorted for the active language. */
export function useCountries() {
  const lang = useLanguage();
  return useMemo(() => {
    let display: Intl.DisplayNames | null = null;
    try {
      display = new Intl.DisplayNames([localeFor(lang)], { type: 'region' });
    } catch {
      display = null;
    }
    const nameOf = (code: string) => display?.of(code) ?? COUNTRIES.find((c) => c.code === code)?.name ?? code;
    const list: Array<CountryConfig & { label: string }> = COUNTRIES.map((c) => ({ ...c, label: nameOf(c.code) })).sort((a, b) =>
      a.label.localeCompare(b.label, localeFor(lang)),
    );
    return { list, nameOf };
  }, [lang]);
}
