import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

/**
 * Example component demonstrating i18n usage
 * This shows how to use the useTranslation hook in your screens
 */
export const I18nExampleComponent = () => {
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      {/* Language Switcher Header */}
      <View style={{ marginBottom: 24, alignItems: 'flex-end' }}>
        <LanguageSwitcher />
      </View>

      {/* Wardrobe Section */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          {t('wardrobe.title')}
        </Text>
        <Text style={{ color: '#6b7280', marginBottom: 12 }}>
          {t('wardrobe.empty')}
        </Text>
        <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
          {t('wardrobe.add')}
        </Text>
      </View>

      {/* Tabs Navigation */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          Navigation
        </Text>
        {Object.entries({
          wardrobe: t('tabs.wardrobe'),
          builder: t('tabs.builder'),
          recommendations: t('tabs.recommendations'),
          outfits: t('tabs.outfits'),
        }).map(([key, value]) => (
          <Text key={key} style={{ color: '#374151', marginBottom: 8 }}>
            • {value}
          </Text>
        ))}
      </View>

      {/* Common Actions */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          Common Actions
        </Text>
        {Object.entries({
          save: t('common.save'),
          cancel: t('common.cancel'),
          delete: t('common.delete'),
          back: t('common.back'),
        }).map(([key, value]) => (
          <Text key={key} style={{ color: '#374151', marginBottom: 8 }}>
            • {value}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};
