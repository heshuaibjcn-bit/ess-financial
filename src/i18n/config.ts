/**
 * i18n Configuration
 *
 * Internationalization setup for Chinese and English
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import zh from './locales/zh.json';
import en from './locales/en.json';

const resources = {
  zh: {
    translation: zh,
  },
  en: {
    translation: en,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'zh', // Default to Chinese
    lng: 'zh', // Default language

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false, // Disable suspense for simplicity
    },
  });

export default i18n;

/**
 * Language type
 */
export type Language = 'zh' | 'en';

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
  return i18n.language as Language;
}

/**
 * Change language
 */
export function changeLanguage(lang: Language) {
  i18n.changeLanguage(lang);
}

/**
 * Format currency based on language
 */
export function formatCurrency(amount: number, language: Language = getCurrentLanguage()): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage based on language
 */
export function formatPercentage(value: number, language: Language = getCurrentLanguage()): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Format number based on language
 */
export function formatNumber(value: number, language: Language = getCurrentLanguage()): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format date based on language
 */
export function formatDate(date: Date | string, language: Language = getCurrentLanguage()): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Get province name in current language
 */
export function getProvinceName(provinceData: { name: string; nameEn: string }, language?: Language): string {
  const lang = language || getCurrentLanguage();
  return lang === 'zh' ? provinceData.name : provinceData.nameEn;
}
