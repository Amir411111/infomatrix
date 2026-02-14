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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
  const [isPhotoUpdating, setIsPhotoUpdating] = useState(false);

  const getItemKey = (item: ClothingItem, index?: number) => {
    if (item._id) return item._id;
    if (item.id) return item.id;
    return `${item.name || 'item'}-${item.category}-${item.createdAt || index || 0}-${index || 0}`;
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Фильтрованный список вещей по категории
  const filteredItems = selectedCategory 
    ? items.filter(item => item.category === selectedCategory)
    : items;

  const closeDetailsModal = () => {
    setSelectedItem(null);
    setIsEditingFull(false);
    setEditFormData({});
    setIsPhotoUpdating(false);
  };

  const openDetailsModal = (item: ClothingItem) => {
    setSelectedItem(item);
    setIsEditingFull(false);
    setEditFormData({});
  };

  const getMaterialLabel = (material?: string) => {
    if (!material || material === 'not specified') {
      return t('common.notSpecified');
    }

    const translationKey = `wardrobe.material.${material}`;
    const translated = t(translationKey);
    return translated === translationKey ? material : translated;
  };

  // Начать редактирование всех полей
  const startEdit = (item: ClothingItem) => {
    setSelectedItem(item);
    setEditFormData({
      name: item.name,
      color: item.color,
      material: item.material && item.material !== 'not specified' ? item.material : '',
      season: item.season,
      notes: item.notes,
      category: item.category,
      imageBase64: item.imageBase64,
      imageUri: item.imageUri,
    });
    setIsEditingFull(true);
  };

  const pickEditImage = async (source: 'camera' | 'gallery') => {
    try {
      setIsPhotoUpdating(true);

      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          Alert.alert(t('common.error'), t('addItem.validation.errorOpenCamera'));
          return;
        }
      } else {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaPermission.status !== 'granted') {
          Alert.alert(t('common.error'), t('addItem.validation.errorOpenGallery'));
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

      if (result.canceled || !result.assets[0]) return;

      const imageUri = result.assets[0].uri;
      let imageBase64 = imageUri;

      if (!imageUri.startsWith('data:image')) {
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          imageBase64 = `data:image/jpeg;base64,${base64}`;
        }
      }

      setEditFormData((prev) => ({
        ...prev,
        imageUri,
        imageBase64,
      }));
    } catch (error) {
      Alert.alert(t('common.error'), t('addItem.validation.unknownError'));
    } finally {
      setIsPhotoUpdating(false);
    }
  };

  // Сохранить редактирование
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    
    try {
      const itemId = selectedItem._id || selectedItem.id;
      if (!itemId) throw new Error('Item ID not found');

      const updates: Partial<ClothingItem> = {
        name: (editFormData.name || selectedItem.name || '').trim(),
        color: (editFormData.color || selectedItem.color || 'not specified').trim(),
        material: (editFormData.material || selectedItem.material || 'not specified').trim(),
        season: editFormData.season && editFormData.season.length > 0 ? editFormData.season : selectedItem.season,
        notes: (editFormData.notes || '').trim(),
        imageBase64: editFormData.imageBase64 || selectedItem.imageBase64,
      };

      await updateItem(itemId, updates);
      setIsEditingFull(false);
      Alert.alert(t('common.success'), t('wardrobe.updated', 'Item updated'));

      setSelectedItem((prev) => (prev ? { ...prev, ...updates } : prev));
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
        closeDetailsModal();
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
              closeDetailsModal();
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
      <TouchableOpacity onPress={() => openDetailsModal(item)} style={styles.itemContainer}>
        <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemContent}>
          <View>
            <Text style={styles.itemName}>{item.name || t('wardrobe.itemFallback')}</Text>
            <Text style={styles.itemCategory}>{categoryText}</Text>
            {item.color && <Text style={styles.itemDetail}>{t('common.color')}: {item.color}</Text>}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('wardrobe.title')}</Text>
          <View style={styles.headerActions}>
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
        keyExtractor={(item, index) => getItemKey(item, index)}
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
        <View style={styles.detailsOverlay} onTouchEnd={closeDetailsModal}>
          <View
            key={getItemKey(selectedItem)}
            style={styles.detailsContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <TouchableOpacity onPress={closeDetailsModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Image
              source={{
                uri:
                  (isEditingFull
                    ? (editFormData.imageBase64 || editFormData.imageUri)
                    : undefined) ||
                  selectedItem.imageBase64 ||
                  selectedItem.imageUri,
              }}
              style={styles.detailsImage}
              resizeMode="cover"
            />

            <ScrollView style={styles.detailsInfoScroll} showsVerticalScrollIndicator>
              <View style={styles.detailsInfo}>
                {!isEditingFull ? (
                  <>
                    <Text style={styles.detailsTitle}>{selectedItem.name}</Text>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>{t('addItem.category')}:</Text>
                      <Text style={styles.detailsValue}>
                        {t(`wardrobe.category.${selectedItem.category}`) || selectedItem.category}
                      </Text>
                    </View>

                    {selectedItem.color && selectedItem.color !== 'not specified' && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{t('common.color')}:</Text>
                        <Text style={styles.detailsValue}>{selectedItem.color}</Text>
                      </View>
                    )}

                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>{t('common.material')}:</Text>
                      <Text style={styles.detailsValue}>{getMaterialLabel(selectedItem.material)}</Text>
                    </View>

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
                    <View style={styles.editPhotoButtonsRow}>
                      <TouchableOpacity
                        onPress={() => pickEditImage('camera')}
                        style={[styles.editPhotoButton, styles.editPhotoCameraButton]}
                        disabled={isPhotoUpdating}
                      >
                        {isPhotoUpdating ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.editPhotoButtonText}>{t('addItem.camera')}</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => pickEditImage('gallery')}
                        style={[styles.editPhotoButton, styles.editPhotoGalleryButton]}
                        disabled={isPhotoUpdating}
                      >
                        {isPhotoUpdating ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.editPhotoButtonText}>{t('addItem.gallery')}</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.editLabel}>{t('addItem.name')}:</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editFormData.name || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                      placeholder={t('addItem.namePlaceholder')}
                      placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.editLabel}>{t('common.color')}:</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editFormData.color || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, color: text })}
                      placeholder={t('addItem.colorPlaceholder')}
                      placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.editLabel}>{t('common.material')}:</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editFormData.material || ''}
                      onChangeText={(text) => setEditFormData({ ...editFormData, material: text })}
                      placeholder={t('addItem.selectMaterial')}
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
                      placeholder={t('addItem.notesPlaceholder')}
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
    </SafeAreaView>
  );
};

// Стили
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(15,23,42,0.06)' },
      default: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
    flexShrink: 1,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#0f172a', flexShrink: 1, maxWidth: '100%' },
  clearCacheButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    maxWidth: 130,
  },
  clearCacheButtonText: { fontSize: 12, fontWeight: '700', color: '#4338ca' },
  subtitle: { color: '#64748b', marginTop: 8, fontSize: 14 },
  listContent: { padding: 16 },
  itemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 10px 24px rgba(15,23,42,0.08)' },
      default: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 5,
      },
    }),
  },
  itemImage: { width: '100%', height: 210 },
  itemContent: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  itemCategory: { fontSize: 14, color: '#475569', marginTop: 2 },
  itemDetail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemDate: { color: '#64748b', fontSize: 12, marginTop: 6 },
  deleteButton: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  deleteButtonText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 20, color: '#64748b', marginBottom: 8, fontWeight: '700' },
  emptySubtext: { color: '#64748b', textAlign: 'center' },
  addButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2563eb', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 10px 20px rgba(37,99,235,0.38)' }, default: { shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 16, elevation: 10 } }) },
  addButtonText: { color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: '90%' },
  detailsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  detailsContent: { backgroundColor: '#ffffff', borderRadius: 22, width: '90%', maxHeight: '85%', overflow: 'hidden' },
  closeButton: { position: 'absolute', top: 12, right: 12, backgroundColor: '#eff6ff', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#6b7280' },
  detailsImage: { width: '100%', height: 210 },
  detailsInfoScroll: { flex: 1, maxHeight: 'auto' },
  detailsInfo: { padding: 20 },
  detailsTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  detailsRow: { marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  detailsLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  detailsValue: { fontSize: 14, color: '#0f172a', fontWeight: '600', flex: 1, textAlign: 'right', paddingLeft: 12 },
  deleteFullButton: { backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  deleteFullButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  editFullButton: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  editFullButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  editLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginTop: 12, marginBottom: 6 },
  editTextInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  notesInput: { textAlignVertical: 'top', marginBottom: 12 },
  editImagePreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#e5e7eb',
  },
  editPhotoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  editPhotoButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoCameraButton: {
    backgroundColor: '#2563eb',
  },
  editPhotoGalleryButton: {
    backgroundColor: '#a855f7',
  },
  editPhotoButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  editButtonsContainer: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: '#e2e8f0' },
  saveButton: { backgroundColor: '#2563eb' },
  editButtonText: { fontWeight: '700', fontSize: 14, color: '#0f172a' },
  categoryFilters: { flexDirection: 'row', gap: 8, marginTop: 12, paddingBottom: 8 },
  categoryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  categoryButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  categoryButtonText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  categoryButtonTextActive: { color: '#ffffff' },
  seasonButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  seasonButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  seasonButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  seasonButtonText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  seasonButtonTextActive: { color: '#ffffff' },
});
