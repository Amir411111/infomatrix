import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useLanguageStore } from '../store/languageStore';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguageStore();
  const { i18n } = useTranslation();

  const handleLanguageToggle = async () => {
    try {
      const newLanguage = language === 'en' ? 'ru' : 'en';
      console.log('🔄 Switching language:', language, '→', newLanguage);
      console.log('Current i18n.language:', i18n.language);
      
      await setLanguage(newLanguage);
      
      console.log('✅ Language switched successfully');
      console.log('New i18n.language:', i18n.language);
      console.log('Store language:', useLanguageStore.getState().language);
    } catch (error) {
      console.error('❌ Error changing language:', error);
    }
  };

  const displayText = language === 'en' ? 'РУ' : 'EN';

  return (
    <TouchableOpacity
      onPress={handleLanguageToggle}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: '#3b82f6',
        borderWidth: 1,
        borderColor: '#2563eb',
        minWidth: 50,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#fff',
          letterSpacing: 0.5,
        }}
      >
        {displayText}
      </Text>
    </TouchableOpacity>
  );
};
