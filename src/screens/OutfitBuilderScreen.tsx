/**
 * Экран конструктора луков - выбор вещей из разных категорий
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useOutfitStore } from '../store/outfitStore';
import { ClothingItem, ClothingCategory, Outfit } from '../types';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const OutfitBuilderScreen: React.FC = () => {
  const { t } = useTranslation();
  const { getItemsByCategory, items } = useWardrobeStore();
  const { createOutfit, isLoading: outfitIsLoading } = useOutfitStore();
  const [outfit, setOutfit] = useState<Outfit>({});
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitDescription, setOutfitDescription] = useState('');
  const [outfitStyle, setOutfitStyle] = useState('casual');
  const [outfitCategory, setOutfitCategory] = useState('casual');

  // Уникальные материалы
  const uniqueMaterials = Array.from(
    new Set(items.map(item => item.material).filter(m => m && m !== 'not specified'))
  ).sort();

  // Фильтрация вещей
  const filterItems = (category: ClothingCategory): ClothingItem[] => {
    let filtered = getItemsByCategory(category);

    if (selectedSeason) {
      filtered = filtered.filter(item => item.season?.includes(selectedSeason));
    }

    if (selectedMaterial) {
      filtered = filtered.filter(item => item.material === selectedMaterial);
    }

    return filtered;
  };

  const tops = filterItems('top');
  const bottoms = filterItems('bottom');
  const shoes = filterItems('shoes');

  const selectItem = (category: ClothingCategory, item: ClothingItem) => {
    setOutfit(prev => ({ ...prev, [category]: item }));
  };

  const clearOutfit = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`${t('builder.clearOutfit')}\n\n${t('builder.clearMessage')}`);
      if (ok) setOutfit({});
    } else {
      Alert.alert(t('builder.clearOutfit'), t('builder.clearMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('builder.clearTitle'), style: 'destructive', onPress: () => setOutfit({}) },
      ]);
    }
  };

  const handleSaveOutfit = async () => {
    if (!outfitName.trim()) {
      Alert.alert(t('common.error'), t('builder.outfitName') + ' ' + t('common.required'));
      return;
    }

    try {
      const topId = outfit.top?._id || outfit.top?.id;
      const bottomId = outfit.bottom?._id || outfit.bottom?.id;
      const shoesId = outfit.shoes?._id || outfit.shoes?.id;

      await createOutfit({
        name: outfitName.trim(),
        description: outfitDescription,
        topId,
        bottomId,
        shoesId,
        style: outfitStyle,
        category: outfitCategory,
        season: selectedSeason ? [selectedSeason] : undefined,
        userId: 'default',
      });

      Alert.alert(t('common.success'), t('builder.outfitSaved'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setSaveModalVisible(false);
            setOutfit({});
            setOutfitName('');
            setOutfitDescription('');
            setOutfitStyle('casual');
            setOutfitCategory('casual');
          },
        },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), t('builder.errorSaving'));
    }
  };

  // Рендер секции категории
  const renderCategorySection = (
    category: ClothingCategory,
    categoryItems: ClothingItem[],
    selectedItem?: ClothingItem
  ) => {
    const categoryTitle = t(`wardrobe.category.${category}`);

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{categoryTitle}</Text>
        {categoryItems.length === 0 ? (
          <View style={styles.emptyCategory}>
            <Text style={styles.emptyCategoryText}>
              {t('builder.noItemsInCategory')} "{categoryTitle}"
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {categoryItems.map(item => {
              const itemId = item._id || item.id;
              const selectedId = selectedItem?._id || selectedItem?.id;
              const isSelected = itemId === selectedId;

              return (
                <TouchableOpacity key={itemId} onPress={() => selectItem(category, item)} style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                  <Image source={{ uri: item.imageBase64 || item.imageUri }} style={styles.itemCardImage} resizeMode="cover" />
                  {isSelected && (
                    <View style={styles.selectedOverlay}>
                      <View style={styles.selectedCheckmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const isOutfitComplete = outfit.top && outfit.bottom && outfit.shoes;

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.headerTitle}>{t('builder.title')}</Text>
          <LanguageSwitcher />
        </View>
        <Text style={styles.headerSubtitle}>{t('builder.selectItems')}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Предпросмотр образа */}
        {(outfit.top || outfit.bottom || outfit.shoes) && (
          <View style={styles.outfitPreview}>
            <Text style={styles.outfitPreviewTitle}>{t('builder.yourOutfit')}:</Text>
            <View style={styles.outfitImages}>
              {['top', 'bottom', 'shoes'].map(category => {
                const item = outfit[category as ClothingCategory];
                if (!item) return null;
                return (
                  <View key={category} style={styles.outfitImageContainer}>
                    <Image source={{ uri: item.imageBase64 || item.imageUri }} style={styles.outfitImage} resizeMode="cover" />
                    <Text style={styles.outfitImageLabel}>{t(`wardrobe.category.${category}`)}</Text>
                  </View>
                );
              })}
            </View>
            {isOutfitComplete && (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeText}>✓ {t('builder.outfitComplete')}</Text>
              </View>
            )}
            <View style={styles.outfitButtons}>
              <TouchableOpacity onPress={clearOutfit} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>{t('builder.clearTitle')}</Text>
              </TouchableOpacity>
              {isOutfitComplete && (
                <TouchableOpacity onPress={() => setSaveModalVisible(true)} style={styles.saveButton} disabled={outfitIsLoading}>
                  {outfitIsLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>💾 {t('builder.addOutfit')}</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Фильтры */}
        <View style={styles.filtersSection}>
          {/* Сезоны */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>{t('common.season')}:</Text>
            <View style={styles.seasonButtonsRow}>
              {['spring', 'summer', 'autumn', 'winter'].map(season => (
                <TouchableOpacity
                  key={season}
                  onPress={() => setSelectedSeason(selectedSeason === season ? null : season)}
                  style={[styles.filterButton, selectedSeason === season && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterButtonText, selectedSeason === season && styles.filterButtonTextActive]}>
                    {t(`common.${season}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Материалы */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>{t('common.material')}:</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setMaterialDropdownOpen(!materialDropdownOpen)}>
              <Text style={styles.dropdownButtonText}>{selectedMaterial || t('common.all')}</Text>
              <Text style={styles.dropdownArrow}>{materialDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {materialDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedMaterial(null); setMaterialDropdownOpen(false); }}>
                  <Text style={styles.dropdownItemText}>{t('common.all')}</Text>
                </TouchableOpacity>
                {uniqueMaterials.map(material => (
                  <TouchableOpacity
                    key={material}
                    style={[styles.dropdownItem, selectedMaterial === material && styles.dropdownItemSelected]}
                    onPress={() => { setSelectedMaterial(material); setMaterialDropdownOpen(false); }}
                  >
                    <Text style={[styles.dropdownItemText, selectedMaterial === material && styles.dropdownItemTextSelected]}>
                      {material}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Секции категорий */}
        {renderCategorySection('top', tops, outfit.top)}
        {renderCategorySection('bottom', bottoms, outfit.bottom)}
        {renderCategorySection('shoes', shoes, outfit.shoes)}
      </ScrollView>

      {/* Модаль для сохранения */}
      {saveModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('builder.saveOutfitTitle')}</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>{t('builder.outfitName')} *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('builder.example')}
                value={outfitName}
                onChangeText={setOutfitName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>{t('builder.outfitDescription')}</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder={t('builder.outfitDescriptionPlaceholder')}
                value={outfitDescription}
                onChangeText={setOutfitDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>{t('builder.outfitStyle')}</Text>
              <View style={styles.styleButtonsRow}>
                {['casual', 'formal', 'sporty', 'party'].map(style => (
                  <TouchableOpacity
                    key={style}
                    onPress={() => setOutfitStyle(style)}
                    style={[styles.styleButton, outfitStyle === style && styles.styleButtonActive]}
                  >
                    <Text style={[styles.styleButtonText, outfitStyle === style && styles.styleButtonTextActive]}>
                      {t(`common.${style}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={[styles.modalButton, styles.modalButtonCancel]} disabled={outfitIsLoading}>
                <Text style={styles.modalButtonCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveOutfit} style={[styles.modalButton, styles.modalButtonSave]} disabled={outfitIsLoading}>
                {outfitIsLoading ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonSaveText}>{t('common.save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Platform.OS === 'web' ? { boxShadow: '0 6px 20px rgba(15,23,42,0.06)' } : {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    }
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  outfitPreview: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.OS === 'web' ? { boxShadow: '0 10px 24px rgba(15,23,42,0.08)' } : {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 5,
    }
  },
  outfitPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  outfitImages: {
    flexDirection: 'row',
    gap: 8,
  },
  outfitImageContainer: {
    flex: 1,
  },
  outfitImage: {
    width: '100%',
    height: 132,
    borderRadius: 12,
  },
  outfitImageLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  completeBadge: {
    marginTop: 16,
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
  },
  completeBadgeText: {
    color: '#065f46',
    textAlign: 'center',
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: '#0f172a',
  },
  emptyCategory: {
    backgroundColor: '#eef2ff',
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyCategoryText: {
    color: '#475569',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  itemCard: {
    marginRight: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#dbe2ea',
  },
  itemCardSelected: {
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  itemCardImage: {
    width: 128,
    height: 128,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filtersSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.OS === 'web' ? { boxShadow: '0 10px 20px rgba(15,23,42,0.06)' } : {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    }
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  seasonButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
    overflow: 'hidden',
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#eef2ff',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  outfitButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    maxWidth: 500,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalTextArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  styleButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  styleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  styleButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#2563eb',
  },
  styleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  styleButtonTextActive: {
    color: '#2563eb',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonSave: {
    backgroundColor: '#2563eb',
  },
  modalButtonSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

