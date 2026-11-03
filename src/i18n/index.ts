import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from '@/locales/de';
import en from '@/locales/en';
import es from '@/locales/es';
import fr from '@/locales/fr';
import it from '@/locales/it';
import type { LanguageCode } from '@/types';
import { toLanguageCode } from '@/utils/money';
import { API_BASE_URL } from '@/api/config';

export const LANGUAGE_STORAGE_KEY = 'ys-lang';

/** Shown in each language's own name, like Etsy's language list. */
export const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-IN', label: 'English (IN)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
];

/** A saved code from an older version ('en', 'hi') falls back to English (US). */
function storedLanguage(): LanguageCode {
  try {
    return toLanguageCode(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return 'en-US';
  }
}

/** Fetch admin overrides for a language and merge onto its bundled resource bundle. */
async function applyAdminOverrides(lng: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/i18n/${encodeURIComponent(lng)}/translation`, { credentials: 'include' });
    if (!res.ok) return;
    const overrides = await res.json() as Record<string, unknown>;
    if (overrides && typeof overrides === 'object' && Object.keys(overrides).length) {
      i18n.addResourceBundle(lng, 'translation', overrides, true, true);
    }
  } catch {
    // backend unreachable — bundled strings stay as-is
  }
}

void i18n.use(initReactI18next).init({
  // The three English variants all resolve to the `en` strings; they only change date/number formats.
  resources: { en: { translation: en }, de: { translation: de }, fr: { translation: fr }, it: { translation: it }, es: { translation: es } },
  lng: storedLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'en-US', 'en-GB', 'en-IN', 'de', 'fr', 'it', 'es'],
  interpolation: { escapeValue: false },
  returnNull: false,
}).then(() => {
  // Fetch admin overrides for current + english fallback and merge them in.
  const lng = i18n.language;
  const langsToLoad = [...new Set([lng, lng.split('-')[0], 'en'].filter(Boolean))];
  void Promise.all(langsToLoad.map(applyAdminOverrides));
});

function syncDocument(lng: string) {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
}

syncDocument(i18n.language);

i18n.on('languageChanged', (lng) => {
  syncDocument(lng);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    /* storage unavailable */
  }
});

export default i18n;
