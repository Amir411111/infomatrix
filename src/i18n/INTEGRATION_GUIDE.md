# Internationalization (i18n) Integration Guide

This guide explains how to use the i18n system throughout your app.

## Quick Start

### 1. Import the Hook
```typescript
import { useTranslation } from 'react-i18next';
```

### 2. Use in Components
```typescript
export const MyComponent = () => {
  const { t } = useTranslation();
  
  return <Text>{t('wardrobe.title')}</Text>;
};
```

## Complete Pattern Examples

### Screen with Language Switcher
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const MyScreen = () => {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      {/* Header with Language Switcher */}
      <View style={{ padding: 16, alignItems: 'flex-end' }}>
        <LanguageSwitcher />
      </View>

      {/* Content */}
      <Text>{t('wardrobe.title')}</Text>
      <Text>{t('wardrobe.add')}</Text>
      <Text>{t('common.save')}</Text>
    </View>
  );
};
```

## Translation Keys Structure

### Tabs
```json
{
  "tabs": {
    "wardrobe": "Wardrobe / Гардероб",
    "builder": "Builder / Конструктор",
    "recommendations": "Recommendations / Рекомендации",
    "outfits": "Outfits / Образы"
  }
}
```

### Common Actions
```json
{
  "common": {
    "save": "Save / Сохранить",
    "cancel": "Cancel / Отмена",
    "delete": "Delete / Удалить",
    "back": "Back / Назад",
    "loading": "Loading... / Загрузка...",
    "error": "Something went wrong / Что-то пошло не так"
  }
}
```

## Accessing Translations Programmatically

### In useEffect or Event Handlers
```typescript
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();

  const handleDelete = () => {
    Alert.alert(t('common.confirm'), t('wardrobe.delete'));
  };

  return <TouchableOpacity onPress={handleDelete} />;
};
```

### Interpolation/Variables
Add to translation file:
```json
{
  "wardrobe": {
    "itemCount": "You have {{count}} items"
  }
}
```

Use in component:
```typescript
<Text>{t('wardrobe.itemCount', { count: 5 })}</Text>
```

## Changing Language

### Using Language Switcher Component
```typescript
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const MyScreen = () => {
  return <LanguageSwitcher />;
};
```

### Programmatically
```typescript
import { useLanguageStore } from '../store/languageStore';

export const MyComponent = () => {
  const { language, setLanguage } = useLanguageStore();

  const switchToRussian = async () => {
    await setLanguage('ru');
  };

  return (
    <TouchableOpacity onPress={switchToRussian}>
      <Text>{language === 'en' ? 'Switch to Russian' : 'Перейти на английский'}</Text>
    </TouchableOpacity>
  );
};
```

## Checking Current Language
```typescript
import { useLanguageStore } from '../store/languageStore';

export const MyComponent = () => {
  const { language } = useLanguageStore();

  if (language === 'ru') {
    console.log('Russian is selected');
  }
};
```

## Adding New Translations

1. **Add to en.json:**
   ```json
   {
     "newFeature": {
       "title": "New Feature",
       "description": "This is a new feature"
     }
   }
   ```

2. **Add to ru.json:**
   ```json
   {
     "newFeature": {
       "title": "Новая возможность",
       "description": "Это новая возможность"
     }
   }
   ```

3. **Use in component:**
   ```typescript
   <Text>{t('newFeature.title')}</Text>
   <Text>{t('newFeature.description')}</Text>
   ```

## Key Features

✅ Automatic language persistence (saved in AsyncStorage)
✅ Real-time UI updates when language changes
✅ TypeScript support
✅ Fallback to English if translation is missing
✅ Zero configuration - just import and use

## Troubleshooting

### Translation not appearing?
- Check the translation key spelling (`wardrobe.title` is case-sensitive)
- Verify the key exists in both en.json and ru.json
- Check browser console (in web dev tools) for warnings

### Language not persisting?
- App initialization waits for AsyncStorage to load
- Check that permissions are set for AsyncStorage
- Try clearing app cache if language preference doesn't load

### Performance issues?
- Translations are only loaded once during app initialization
- Language changes trigger a local state update (minimal performance impact)
