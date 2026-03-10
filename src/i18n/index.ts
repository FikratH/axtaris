import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import az from './locales/az';
import ru from './locales/ru';
import en from './locales/en';

const LANGUAGE_STORAGE_KEY = '@axtaris_language';

export const languages = {
  az: { label: 'Azərbaycan', nativeLabel: 'Azərbaycan dili' },
  ru: { label: 'Русский', nativeLabel: 'Русский язык' },
  en: { label: 'English', nativeLabel: 'English' },
} as const;

export type LanguageCode = keyof typeof languages;

const resources = {
  az: { translation: az },
  ru: { translation: ru },
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'az',
  fallbackLng: 'az',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (saved === 'az' || saved === 'ru' || saved === 'en')) {
      await i18n.changeLanguage(saved);
    }
  } catch {}
}

export async function changeLanguage(code: LanguageCode) {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}

export default i18n;
