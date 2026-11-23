import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en';
import hi from '@/locales/hi';
import de from '@/locales/de';
import fr from '@/locales/fr';
import es from '@/locales/es';
import it from '@/locales/it';
import type { LanguageCode } from '@/types';
import { toLanguageCode } from '@/utils/money';
import { API_BASE_URL } from '@/api/config';

export const LANGUAGE_STORAGE_KEY = 'ys-lang';

/** Shown in each language's own name, like Etsy's language list. */
export const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'en-IN', label: 'English (IN)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
];

/** Detect user's language preference from localStorage or auto-detect from browser. */
function storedLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) return toLanguageCode(saved);
  } catch {
    /* storage unavailable */
  }

  try {
    if (typeof navigator !== 'undefined') {
      const browserLangs = navigator.languages && navigator.languages.length
        ? [...navigator.languages]
        : [navigator.language || ''];
      for (const raw of browserLangs) {
        if (!raw) continue;
        const l = raw.toLowerCase();
        if (l.startsWith('hi')) return 'hi';
        if (l === 'en-in') return 'en-IN';
        if (l === 'en-gb') return 'en-GB';
        if (l.startsWith('de')) return 'de';
        if (l.startsWith('fr')) return 'fr';
        if (l.startsWith('es')) return 'es';
        if (l.startsWith('it')) return 'it';
      }
    }
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'en-IN';
    if (tz.includes('London')) return 'en-GB';
    if (tz.includes('Berlin') || tz.includes('Vienna') || tz.includes('Zurich')) return 'de';
    if (tz.includes('Paris')) return 'fr';
    if (tz.includes('Madrid')) return 'es';
    if (tz.includes('Rome')) return 'it';
  } catch {
    /* ignore detection errors */
  }

  return 'en-US';
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
  resources: {
    en: { translation: en },
    'en-US': { translation: en },
    'en-GB': { translation: en },
    'en-IN': { translation: en },
    hi: { translation: hi },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
  },
  lng: storedLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'en-US', 'en-GB', 'en-IN', 'hi', 'de', 'fr', 'it', 'es'],
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
  void applyAdminOverrides(lng);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    /* storage unavailable */
  }
});

export default i18n;
