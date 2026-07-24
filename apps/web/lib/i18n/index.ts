'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

// Ported from leadership-assessment's src/i18n/index.ts. One real adaptation
// for Next: LanguageDetector reads navigator/localStorage, which don't exist
// during Next's server render of a 'use client' component's first pass — the
// plugin is only attached when `window` exists, so SSR always resolves to
// fallbackLng (en) with zero browser-API access, and the client re-init after
// hydration picks up the detector (and any saved locale) normally.
const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

if (!i18n.isInitialized) {
  const instance = typeof window !== 'undefined' ? i18n.use(LanguageDetector) : i18n;
  instance.use(initReactI18next).init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });
}

export default i18n;

// Only the 3 languages with real translation files. Leadership's original
// list advertised 7 (en/es/fr/de/ar/zh/ja) with resources for just these 3 —
// selecting the other 4 would silently fall back to English with no
// indication anything was wrong. Not carrying that gap forward; add a
// locale here only once its JSON file actually exists.
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];
