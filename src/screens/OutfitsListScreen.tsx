/**
 * Экран для просмотра и управления сохраненными луками
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useOutfitStore } from '../store/outfitStore';
import { Outfit } from '../types';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const OutfitsListScreen: React.FC = () => {
  const { t } = useTranslation();
  const { outfits, loadOutfits, isLoading, deleteOutfit, toggleFavorite, updateOutfit } = useOutfitStore();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'style'>('all');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isEditingOutfit, setIsEditingOutfit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStyle, setEditStyle] = useState<string>('casual');

  useEffect(() => {
    loadOutfits();
  }, []);

  const filteredOutfits = outfits.filter((outfit) => {
    if (selectedFilter === 'favorites') return outfit.isFavorite;
    if (selectedFilter === 'style' && selectedStyle) return outfit.style === selectedStyle;
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`${t('outfits.deleteConfirmTitle')} "${name}"?`);
      if (ok) deleteOutfit(id);
    } else {
      Alert.alert(
        t('outfits.deleteConfirmTitle'),
        `${t('outfits.deleteConfirmMessage')} "${name}"?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('outfits.deleteButton'), style: 'destructive', onPress: () => deleteOutfit(id) },
        ]
      );
    }
  };

  const openOutfitDetails = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setIsEditingOutfit(false);
    setEditName(outfit.name || '');
    setEditDescription(outfit.description || '');
    setEditStyle(outfit.style || 'casual');
  };

  const handleSaveOutfitEdit = async () => {
    if (!selectedOutfit?._id) return;
    if (!editName.trim()) {
      Alert.alert(t('common.error'), t('builder.outfitName'));
      return;
    }

    try {
      const updated = await updateOutfit(selectedOutfit._id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        style: editStyle,
      });
      setSelectedOutfit(updated as unknown as Outfit);
      setIsEditingOutfit(false);
      Alert.alert(t('common.success'), t('common.success'));
    } catch {
      Alert.alert(t('common.error'), t('builder.errorSaving'));
    }
  };

  const getOutfitItemImage = (itemRef?: unknown): string | undefined => {
    if (!itemRef || typeof itemRef === 'string') return undefined;
    const value = itemRef as { imageBase64?: string; imageUri?: string };
    return value.imageBase64 || value.imageUri;
  };

  const getOutfitBadges = (outfit: Outfit): string[] => {
    const translatedStyle = outfit.style ? t(`common.${outfit.style}`) : '';
    const styleBadge = translatedStyle && translatedStyle !== `common.${outfit.style}`
      ? translatedStyle
      : (outfit.style || '');

    const translatedCategory = outfit.category ? t(`common.${outfit.category}`) : '';
    const categoryBadge = translatedCategory && translatedCategory !== `common.${outfit.category}`
      ? translatedCategory
      : (outfit.category || '');

    const uniqueBadges = new Set<string>();
    [styleBadge, categoryBadge]
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => uniqueBadges.add(value.toLowerCase()));

    return Array.from(uniqueBadges).map((value) =>
      value.charAt(0).toUpperCase() + value.slice(1)
    );
  };

  const renderOutfitCard = (outfit: Outfit) => (
    <TouchableOpacity key={outfit._id || outfit.name} style={styles.outfitCard} onPress={() => openOutfitDetails(outfit)}>
      <View style={styles.outfitImages}>
        {getOutfitItemImage(outfit.topId) && (
          <Image source={{ uri: getOutfitItemImage(outfit.topId) }} style={styles.outfitItemImage} resizeMode="cover" />
        )}
        {getOutfitItemImage(outfit.bottomId) && (
          <Image source={{ uri: getOutfitItemImage(outfit.bottomId) }} style={styles.outfitItemImage} resizeMode="cover" />
        )}
        {getOutfitItemImage(outfit.shoesId) && (
          <Image source={{ uri: getOutfitItemImage(outfit.shoesId) }} style={styles.outfitItemImage} resizeMode="cover" />
        )}
      </View>

      <View style={styles.outfitInfo}>
        <Text style={styles.outfitName}>{outfit.name}</Text>
        {outfit.description && <Text style={styles.outfitDescription}>{outfit.description}</Text>}

        <View style={styles.outfitMeta}>
          {getOutfitBadges(outfit).map((badge) => (
            <View key={`badge-${badge}`} style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.outfitActions}>
        <TouchableOpacity
          onPress={() => outfit._id && toggleFavorite(outfit._id)}
          style={[styles.actionButton, outfit.isFavorite && styles.actionButtonFavorite]}
        >
          <Text style={[styles.actionButtonText, outfit.isFavorite && styles.actionButtonTextFavorite]}>
            ♥
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => outfit._id && handleDelete(outfit._id, outfit.name || t('outfits.title'))}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && outfits.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('outfits.loadingOutfits') || 'Загружаю луки...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.headerTitle}>{t('outfits.title')}</Text>
          <LanguageSwitcher />
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredOutfits.length} {t('outfits.saved')}
        </Text>
      </View>

      {/* Фильтры */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
              {t('common.all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter('favorites')}
            style={[styles.filterButton, selectedFilter === 'favorites' && styles.filterButtonActive]}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'favorites' && styles.filterButtonTextActive]}>
              ❤️ {t('outfits.favorites')}
            </Text>
          </TouchableOpacity>

          {['casual', 'formal', 'sporty', 'party'].map((style) => (
            <TouchableOpacity
              key={style}
              onPress={() => {
                setSelectedFilter('style');
                setSelectedStyle(style);
              }}
              style={[
                styles.filterButton,
                selectedFilter === 'style' && selectedStyle === style && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === 'style' && selectedStyle === style && styles.filterButtonTextActive,
                ]}
              >
                {style === 'casual' && `👕 ${t('common.casual')}`}
                {style === 'formal' && `🎩 ${t('common.formal')}`}
                {style === 'sporty' && `⚽ ${t('common.sporty')}`}
                {style === 'party' && `🎉 ${t('common.party')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Список луков */}
      {filteredOutfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {outfits.length === 0 ? t('outfits.noOutfits') : t('outfits.noOutfitsFilter')}
          </Text>
          {outfits.length === 0 && <Text style={styles.emptySubtext}>{t('outfits.createSubtext')}</Text>}
        </View>
      ) : (
        <ScrollView style={styles.outfitsContainer}>
          {filteredOutfits.map((outfit) => renderOutfitCard(outfit))}
        </ScrollView>
      )}

      {/* Modal для деталей лука */}
      {selectedOutfit && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setSelectedOutfit(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {!isEditingOutfit ? (
                <>
                  <Text style={styles.modalTitle}>{selectedOutfit.name}</Text>
                  {selectedOutfit.description && <Text style={styles.modalDescription}>{selectedOutfit.description}</Text>}
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>{t('common.editing')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t('builder.outfitName')}
                    placeholderTextColor="#9ca3af"
                  />
                  <TextInput
                    style={[styles.modalInput, styles.modalInputMultiline]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder={t('builder.outfitDescriptionPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                  <View style={styles.editStyleRow}>
                    {['casual', 'formal', 'sporty', 'party'].map((style) => (
                      <TouchableOpacity
                        key={style}
                        onPress={() => setEditStyle(style)}
                        style={[styles.editStyleButton, editStyle === style && styles.editStyleButtonActive]}
                      >
                        <Text style={[styles.editStyleButtonText, editStyle === style && styles.editStyleButtonTextActive]}>
                          {t(`common.${style}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.modalImagesRow}>
                {getOutfitItemImage(selectedOutfit.topId) && (
                  <Image source={{ uri: getOutfitItemImage(selectedOutfit.topId) }} style={styles.modalImage} />
                )}
                {getOutfitItemImage(selectedOutfit.bottomId) && (
                  <Image source={{ uri: getOutfitItemImage(selectedOutfit.bottomId) }} style={styles.modalImage} />
                )}
                {getOutfitItemImage(selectedOutfit.shoesId) && (
                  <Image source={{ uri: getOutfitItemImage(selectedOutfit.shoesId) }} style={styles.modalImage} />
                )}
              </View>

              <View style={styles.modalButtonsRow}>
                {!isEditingOutfit ? (
                  <TouchableOpacity onPress={() => setIsEditingOutfit(true)} style={styles.modalSecondaryButton}>
                    <Text style={styles.modalSecondaryButtonText}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setIsEditingOutfit(false)} style={styles.modalSecondaryButton}>
                      <Text style={styles.modalSecondaryButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveOutfitEdit} style={styles.modalCloseButton}>
                      <Text style={styles.modalCloseText}>{t('common.save')}</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity onPress={() => setSelectedOutfit(null)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Platform.OS === 'web'
      ? { boxShadow: '0 6px 20px rgba(15,23,42,0.06)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
        },
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
  filtersWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 0,
    zIndex: 1000,
  },
  filtersScroll: {
    backgroundColor: '#ffffff',
    maxHeight: 65,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    minWidth: 118,
    height: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  outfitsContainer: {
    padding: 16,
  },
  outfitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.OS === 'web'
      ? { boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 5,
        },
  },
  outfitImages: {
    flexDirection: 'row',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  outfitItemImage: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  outfitInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  outfitName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  outfitDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 20,
  },
  outfitMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  outfitActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  actionButtonFavorite: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    fontSize: 20,
    color: '#94a3b8',
  },
  actionButtonTextFavorite: {
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    color: '#0f172a',
  },
  modalDescription: {
    color: '#64748b',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  modalInputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  editStyleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  editStyleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  editStyleButtonActive: {
    backgroundColor: '#2563eb',
  },
  editStyleButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  editStyleButtonTextActive: {
    color: '#fff',
  },
  modalImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalImage: {
    flex: 1,
    height: 120,
    borderRadius: 12,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalSecondaryButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
  },
  modalSecondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '600',
  },
});
