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
} from 'react-native';
import { useOutfitStore } from '../store/outfitStore';
import { Outfit } from '../types';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const OutfitsListScreen: React.FC = () => {
  const { t } = useTranslation();
  const { outfits, loadOutfits, isLoading, deleteOutfit, toggleFavorite } = useOutfitStore();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'style'>('all');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

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

  const renderOutfitCard = (outfit: Outfit) => (
    <TouchableOpacity key={outfit._id} style={styles.outfitCard} onPress={() => setSelectedOutfit(outfit)}>
      <View style={styles.outfitImages}>
        {outfit.topId?.imageBase64 && (
          <Image source={{ uri: outfit.topId.imageBase64 }} style={styles.outfitItemImage} resizeMode="cover" />
        )}
        {outfit.bottomId?.imageBase64 && (
          <Image source={{ uri: outfit.bottomId.imageBase64 }} style={styles.outfitItemImage} resizeMode="cover" />
        )}
        {outfit.shoesId?.imageBase64 && (
          <Image source={{ uri: outfit.shoesId.imageBase64 }} style={styles.outfitItemImage} resizeMode="cover" />
        )}
      </View>

      <View style={styles.outfitInfo}>
        <Text style={styles.outfitName}>{outfit.name}</Text>
        {outfit.description && <Text style={styles.outfitDescription}>{outfit.description}</Text>}

        <View style={styles.outfitMeta}>
          {(() => {
            const badges = [
              outfit.style ? t(`common.${outfit.style}`) : null,
              outfit.category ? outfit.category : null,
            ].filter(Boolean) as string[];

            return badges.map((b) => (
              <View key={`badge-${b}`} style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{b}</Text>
              </View>
            ));
          })()}
        </View>
      </View>

      <View style={styles.outfitActions}>
        <TouchableOpacity onPress={() => toggleFavorite(outfit._id!)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{outfit.isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(outfit._id!, outfit.name)} style={styles.actionButton}>
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
              <Text style={styles.modalTitle}>{selectedOutfit.name}</Text>
              {selectedOutfit.description && <Text style={styles.modalDescription}>{selectedOutfit.description}</Text>}

              <View style={styles.modalImagesRow}>
                {selectedOutfit.topId?.imageBase64 && (
                  <Image source={{ uri: selectedOutfit.topId.imageBase64 }} style={styles.modalImage} />
                )}
                {selectedOutfit.bottomId?.imageBase64 && (
                  <Image source={{ uri: selectedOutfit.bottomId.imageBase64 }} style={styles.modalImage} />
                )}
                {selectedOutfit.shoesId?.imageBase64 && (
                  <Image source={{ uri: selectedOutfit.shoesId.imageBase64 }} style={styles.modalImage} />
                )}
              </View>

              <TouchableOpacity onPress={() => setSelectedOutfit(null)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>{t('common.close') || 'Закрыть'}</Text>
              </TouchableOpacity>
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
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  filtersWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    width: 115,
    height: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
        },
  },
  outfitImages: {
    flexDirection: 'row',
    height: 160,
    backgroundColor: '#f3f4f6',
  },
  outfitItemImage: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  outfitInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  outfitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  outfitDescription: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#dbeafe',
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
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
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6b7280',
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
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  modalDescription: {
    color: '#6b7280',
    marginBottom: 12,
  },
  modalImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalImage: {
    flex: 1,
    height: 120,
    borderRadius: 8,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '600',
  },
});
