import { create } from 'zustand';
import i18n, { LANGUAGE_KEY } from '../i18n/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageState {
  language: 'en' | 'ru';
  setLanguage: (lang: 'en' | 'ru') => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: (i18n.language as 'en' | 'ru') || 'en',
  setLanguage: async (lang: 'en' | 'ru') => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      set({ language: lang });
    } catch (error) {
      console.error('Error changing language:', error);
    }
  },
}));
