/**
 * Экран со списком всех вещей в гардеробе
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWardrobeStore } from '../store/wardrobeStore';
import { ClothingItem } from '../types';
import { AddItemForm } from '../components/AddItemForm';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const WardrobeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { items, loadItems, deleteItem, updateItem, isLoading, clearLocalCache } = useWardrobeStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isEditingFull, setIsEditingFull] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ClothingItem>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  // Фильтрованный список вещей по категории
  const filteredItems = selectedCategory 
    ? items.filter(item => item.category === selectedCategory)
    : items;

  // Начать редактирование всех полей
  const startEdit = (item: ClothingItem) => {
    setSelectedItem(item);
    setEditFormData({
      name: item.name,
      color: item.color,
      material: item.material,
      season: item.season,
      notes: item.notes,
      category: item.category,
    });
    setIsEditingFull(true);
  };

  // Сохранить редактирование
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    
    try {
      const itemId = selectedItem._id || selectedItem.id;
      if (!itemId) throw new Error('Item ID not found');
      await updateItem(itemId, editFormData);
      setIsEditingFull(false);
      Alert.alert(t('common.success'), t('wardrobe.updated', 'Item updated'));

      const updatedItem = items.find(i => i._id === itemId || i.id === itemId);
      if (updatedItem) setSelectedItem(updatedItem);
      loadItems();
    } catch (error) {
      Alert.alert(t('common.error'), t('wardrobe.updateFailed', 'Failed to update item'));
    }
  };

  // Очистка локального кэша
  const handleClearCache = () => {
    Alert.alert(
      t('wardrobe.clearCacheTitle'),
      t('wardrobe.clearCacheText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLocalCache();
              Alert.alert(t('common.success'), t('wardrobe.cacheCleared'));
              loadItems();
            } catch {
              Alert.alert(t('common.error'), t('wardrobe.cacheClearFailed'));
            }
          },
        },
      ]
    );
  };

  // Подтверждение удаления вещи
  const handleDelete = (item: ClothingItem) => {
    const itemId = item._id || item.id;
    
    if (Platform.OS === 'web') {
      const ok = window.confirm(
        t('wardrobe.deleteConfirmWeb', {
          name: item.name,
          category: t(`wardrobe.category.${item.category}`) || item.category,
        })
      );
      if (ok && itemId) {
        deleteItem(itemId);
        setSelectedItem(null);
      }
      return;
    }

    Alert.alert(
      t('wardrobe.deleteConfirmTitle', 'Delete item?'),
      t('wardrobe.deleteConfirmText', {
        name: item.name,
        category: t(`wardrobe.category.${item.category}`) || item.category,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            if (itemId) {
              deleteItem(itemId);
              setSelectedItem(null);
            }
          },
        },
      ]
    );
  };

  // Рендер одной вещи
  const renderItem = ({ item }: { item: ClothingItem }) => {
    const imageUri = item.imageBase64 || item.imageUri;
    const categoryText = t(`wardrobe.category.${item.category}`) || item.category;
    
    return (
      <TouchableOpacity onPress={() => setSelectedItem(item)} style={styles.itemContainer}>
        <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemContent}>
          <View>
            <Text style={styles.itemName}>{item.name || t('wardrobe.itemFallback')}</Text>
            <Text style={styles.itemCategory}>{categoryText}</Text>
            {item.color && <Text style={styles.itemDetail}>Цвет: {item.color}</Text>}
            <Text style={styles.itemDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ru-RU') : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('wardrobe.title')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LanguageSwitcher />
            <TouchableOpacity onPress={handleClearCache} style={styles.clearCacheButton}>
              <Text style={styles.clearCacheButtonText}>🗑️ {t('wardrobe.clearCacheShort')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {t('wardrobe.totalItems', { count: filteredItems.length })}
        </Text>

        {/* Фильтры */}
        <View style={styles.categoryFilters}>
          {['all', 'top', 'bottom', 'shoes'].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat === 'all' ? null : cat)}
              style={[
                styles.categoryButton,
                selectedCategory === cat || (cat === 'all' && !selectedCategory)
                  ? styles.categoryButtonActive
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === cat || (cat === 'all' && !selectedCategory)
                    ? styles.categoryButtonTextActive
                    : null,
                ]}
              >
                {t(`wardrobe.category.${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Список вещей */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('wardrobe.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('wardrobe.add')}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadItems} />}
      />

      {/* Кнопка добавления */}
      <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Модальное окно добавления */}
      {showAddForm && (
        <View style={styles.modalOverlay} onTouchEnd={() => setShowAddForm(false)}>
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <AddItemForm onClose={() => setShowAddForm(false)} />
          </View>
        </View>
      )}

      {/* Модальное окно деталей */}
      {selectedItem && (
        <View style={styles.detailsOverlay} onTouchEnd={() => setSelectedItem(null)}>
          <View
            style={styles.detailsContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Image
              source={{ uri: selectedItem.imageBase64 || selectedItem.imageUri }}
              style={styles.detailsImage}
              resizeMode="cover"
            />

            <ScrollView style={styles.detailsInfoScroll} showsVerticalScrollIndicator>
              <View style={styles.detailsInfo}>
                {!isEditingFull ? (
                  <>
                    <Text style={styles.detailsTitle}>{selectedItem.name}</Text>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Категория:</Text>
                      <Text style={styles.detailsValue}>
                        {t(`wardrobe.category.${selectedItem.category}`) || selectedItem.category}
                      </Text>
                    </View>

                    {selectedItem.color && selectedItem.color !== 'not specified' && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Цвет:</Text>
                        <Text style={styles.detailsValue}>{selectedItem.color}</Text>
                      </View>
                    )}

                    {selectedItem.material && selectedItem.material !== 'not specified' && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{t('common.material')}:</Text>
                        <Text style={styles.detailsValue}>{selectedItem.material}</Text>
                      </View>
                    )}

                    {selectedItem.season && selectedItem.season.length > 0 && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{t('common.seasons')}:</Text>
                        <Text style={styles.detailsValue}>
                          {selectedItem.season
                            .map((s) =>
                              s === 'spring'
                                ? t('common.spring')
                                : s === 'summer'
                                ? t('common.summer')
                                : s === 'autumn'
                                ? t('common.autumn')
                                : t('common.winter')
                            )
                            .join(', ')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailsLabel}>{t('common.description')}:</Text>
                        <Text style={[styles.detailsValue, { marginTop: 4 }]}>
                          {selectedItem.notes || t('common.noDescription')}
                        </Text>
                      </View>
                    </View>

                    {selectedItem.createdAt && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{t('common.added')}:</Text>
                        <Text style={styles.detailsValue}>
                          {new Date(selectedItem.createdAt).toLocaleDateString('ru-RU')}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => startEdit(selectedItem)}
                      style={styles.editFullButton}
                    >
                      <Text style={styles.editFullButtonText}>✏️ {t('common.edit')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(selectedItem)}
                      style={styles.deleteFullButton}
                    >
                      <Text style={styles.deleteFullButtonText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.detailsTitle}>{t('common.editing')}</Text>

                    <Text style={styles.editLabel}>{t('addItem.name')}:</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editFormData.name || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                      placeholder="Название вещи"
                      placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.editLabel}>{t('common.color')}:</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editFormData.color || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, color: text })}
                      placeholder="Цвет"
                      placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.editLabel}>{t('common.material')}:</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editFormData.material || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, material: text })}
                      placeholder="Материал"
                      placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.editLabel}>{t('common.seasons')}:</Text>
                    <View style={styles.seasonButtonsRow}>
                      {['spring', 'summer', 'autumn', 'winter'].map((season) => {
                        const seasonLabel =
                          season === 'spring'
                            ? t('common.spring')
                            : season === 'summer'
                            ? t('common.summer')
                            : season === 'autumn'
                            ? t('common.autumn')
                            : t('common.winter');
                        const isSelected = editFormData.season?.includes(season);

                        return (
                          <TouchableOpacity
                            key={season}
                            onPress={() => {
                              const newSeasons = isSelected
                                ? editFormData.season?.filter((s) => s !== season) || []
                                : [...(editFormData.season || []), season];
                              setEditFormData({ ...editFormData, season: newSeasons });
                            }}
                            style={[styles.seasonButton, isSelected && styles.seasonButtonActive]}
                          >
                            <Text
                              style={[
                                styles.seasonButtonText,
                                isSelected && styles.seasonButtonTextActive,
                              ]}
                            >
                              {seasonLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.editLabel}>{t('common.description')}:</Text>
                    <TextInput
                      style={[styles.editTextInput, styles.notesInput]}
                      value={editFormData.notes || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, notes: text })}
                      placeholder="Описание вещи"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={4}
                    />

                    <View style={styles.editButtonsContainer}>
                      <TouchableOpacity
                        onPress={() => setIsEditingFull(false)}
                        style={[styles.editButton, styles.cancelButton]}
                      >
                        <Text style={styles.editButtonText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        style={[styles.editButton, styles.saveButton]}
                      >
                        <Text style={styles.editButtonText}>{t('common.save')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

// Стили
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#111827' },
  clearCacheButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearCacheButtonText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  subtitle: { color: '#6b7280', marginTop: 8, fontSize: 14 },
  listContent: { padding: 16 },
  itemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  itemImage: { width: '100%', height: 192 },
  itemContent: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  itemCategory: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  itemDetail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  itemDate: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  deleteButton: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  deleteButtonText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 20, color: '#9ca3af', marginBottom: 8 },
  emptySubtext: { color: '#9ca3af', textAlign: 'center' },
  addButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3b82f6', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 } }) },
  addButtonText: { color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  detailsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  detailsContent: { backgroundColor: '#ffffff', borderRadius: 12, width: '90%', maxHeight: '85%', overflow: 'hidden' },
  closeButton: { position: 'absolute', top: 12, right: 12, backgroundColor: '#f3f4f6', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#6b7280' },
  detailsImage: { width: '100%', height: 180 },
  detailsInfoScroll: { flex: 1, maxHeight: 'auto' },
  detailsInfo: { padding: 20 },
  detailsTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  detailsRow: { marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  detailsLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  detailsValue: { fontSize: 14, color: '#111827', fontWeight: '500', flex: 1, textAlign: 'right', paddingLeft: 12 },
  deleteFullButton: { backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  deleteFullButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  editFullButton: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  editFullButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  editLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  editTextInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  notesInput: { textAlignVertical: 'top', marginBottom: 12 },
  editButtonsContainer: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: '#e5e7eb' },
  saveButton: { backgroundColor: '#3b82f6' },
  editButtonText: { fontWeight: '600', fontSize: 14, color: '#111827' },
  categoryFilters: { flexDirection: 'row', gap: 8, marginTop: 12, paddingBottom: 8 },
  categoryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  categoryButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  categoryButtonText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  categoryButtonTextActive: { color: '#ffffff' },
  seasonButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  seasonButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  seasonButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  seasonButtonText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  seasonButtonTextActive: { color: '#ffffff' },
});
