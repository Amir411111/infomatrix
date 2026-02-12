/**
 * Главный файл приложения ClothMatch
 * Настройка навигации и провайдеров
 */
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import { initI18n } from './src/i18n/config';
import i18n from './src/i18n/config';
import { useWardrobeStore } from './src/store/wardrobeStore';
import { useOutfitStore } from './src/store/outfitStore';
import { useLanguageStore } from './src/store/languageStore';
import { WardrobeScreen } from './src/screens/WardrobeScreen';
import { OutfitBuilderScreen } from './src/screens/OutfitBuilderScreen';
import { OutfitsListScreen } from './src/screens/OutfitsListScreen';
import { RecommendationsScreen } from './src/screens/RecommendationsScreen';

const Tab = createBottomTabNavigator();

// App content component that subscribes to language changes
function AppContent() {
  const { t, i18n } = useTranslation();
  const language = useLanguageStore(state => state.language);

  // Use language to force re-render when it changes
  const key = `app-${language}`;

  return (
    <SafeAreaProvider key={key}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#6b7280',
            tabBarStyle: {
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
          }}
        >
          <Tab.Screen
            name="Wardrobe"
            component={WardrobeScreen}
            options={{
              title: t('tabs.wardrobe'),
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <TabIcon icon="👕" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Builder"
            component={OutfitBuilderScreen}
            options={{
              title: t('tabs.builder'),
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <TabIcon icon="✨" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Outfits"
            component={OutfitsListScreen}
            options={{
              title: t('tabs.outfits'),
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <TabIcon icon="📸" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Recommendations"
            component={RecommendationsScreen}
            options={{
              title: t('tabs.recommendations'),
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <TabIcon icon="🤖" color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  const loadItems = useWardrobeStore(state => state.loadItems);
  const loadOutfits = useOutfitStore(state => state.loadOutfits);
  const [ready, setReady] = useState(false);

  // Инициализируем i18n и загружаем данные при запуске приложения
  useEffect(() => {
    const initialize = async () => {
      try {
        await initI18n();
        await loadItems();
        await loadOutfits();
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setReady(true);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AppContent />
    </I18nextProvider>
  );
}

// Простой компонент для иконок
const TabIcon: React.FC<{ icon: string; color: string; size: number }> = ({
  icon,
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 24 }}>{icon}</Text>
  </View>
);
