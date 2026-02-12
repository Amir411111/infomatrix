import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ru from './ru.json';

export const LANGUAGE_KEY = 'app_language';

export const initI18n = async () => {
  let savedLanguage: 'en' | 'ru' = 'en';
  
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'ru') {
      savedLanguage = saved;
    }
  } catch (e) {
    console.warn('Error loading language preference:', e);
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

export default i18n;
