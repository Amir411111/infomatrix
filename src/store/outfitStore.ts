/**
 * Zustand store для управления луками
 * Синхронизируется с Backend API
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOutfits,
  createOutfit as apiCreateOutfit,
  updateOutfit as apiUpdateOutfit,
  deleteOutfit as apiDeleteOutfit,
  getOutfitsByStyle,
  getFavoriteOutfits,
  Outfit,
} from '../services/outfitService';

interface OutfitState {
  outfits: Outfit[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  loadOutfits: (userId?: string) => Promise<void>;
  createOutfit: (outfit: Omit<Outfit, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Outfit>;
  updateOutfit: (id: string, updates: Partial<Outfit>) => Promise<Outfit>;
  deleteOutfit: (id: string) => Promise<void>;
  getOutfitsByStyle: (style: string, userId?: string) => Promise<Outfit[]>;
  getFavoriteOutfits: (userId?: string) => Promise<Outfit[]>;
  toggleFavorite: (id: string) => Promise<void>;
  clearLocalCache: () => Promise<void>;
}

const STORAGE_KEY = '@clothmatch:outfits';

export const useOutfitStore = create<OutfitState>((set, get) => ({
  outfits: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  /**
   * Загружает все луки с сервера
   */
  loadOutfits: async (userId: string = 'default') => {
    set({ isLoading: true, error: null });
    try {
      const serverOutfits = await getOutfits(userId);
      set({ outfits: serverOutfits, isLoading: false });

      // Синхронизируем локальное хранилище
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverOutfits));
    } catch (error) {
      console.warn('Ошибка загрузки луков с сервера, используем локальное хранилище:', error);

      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const outfits = JSON.parse(stored) as Outfit[];
          set({
            outfits,
            isLoading: false,
            error: 'Используется кэш (сервер недоступен)',
          });
        } else {
          set({ outfits: [], isLoading: false, error: 'Сервер недоступен' });
        }
      } catch (localError) {
        console.error('Ошибка загрузки локального хранилища:', localError);
        set({ outfits: [], isLoading: false, error: 'Ошибка загрузки данных' });
      }
    }
  },

  /**
   * Создает новый лук
   */
  createOutfit: async (outfitData) => {
    set({ error: null });
    try {
      console.log('🔄 Создаем лук:', outfitData);

      const newOutfit = await apiCreateOutfit(outfitData);

      // Обновляем список луков
      set((state) => ({
        outfits: [newOutfit, ...state.outfits],
      }));

      // Синхронизируем локальное хранилище
      const state = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.outfits));

      console.log('✓ Лук создан:', newOutfit._id);
      return newOutfit;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка создания лука:', message);
      set({ error: message });
      throw error;
    }
  },

  /**
   * Обновляет лук
   */
  updateOutfit: async (id: string, updates: Partial<Outfit>) => {
    set({ error: null });
    try {
      console.log('🔄 Обновляем лук:', id, updates);

      const updatedOutfit = await apiUpdateOutfit(id, updates);

      // Обновляем список луков
      set((state) => ({
        outfits: state.outfits.map((o) => (o._id === id ? updatedOutfit : o)),
      }));

      // Синхронизируем локальное хранилище
      const state = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.outfits));

      console.log('✓ Лук обновлен:', id);
      return updatedOutfit;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка обновления лука:', message);
      set({ error: message });
      throw error;
    }
  },

  /**
   * Удаляет лук
   */
  deleteOutfit: async (id: string) => {
    set({ error: null });
    try {
      console.log('🔄 Удаляем лук:', id);

      await apiDeleteOutfit(id);

      // Обновляем список луков
      set((state) => ({
        outfits: state.outfits.filter((o) => o._id !== id),
      }));

      // Синхронизируем локальное хранилище
      const state = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.outfits));

      console.log('✓ Лук удален:', id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка удаления лука:', message);
      set({ error: message });
      throw error;
    }
  },

  /**
   * Получает луки по стилю
   */
  getOutfitsByStyle: async (style: string, userId: string = 'default') => {
    set({ error: null });
    try {
      return await getOutfitsByStyle(style, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка получения луков по стилю:', message);
      set({ error: message });
      throw error;
    }
  },

  /**
   * Получает избранные луки
   */
  getFavoriteOutfits: async (userId: string = 'default') => {
    set({ error: null });
    try {
      return await getFavoriteOutfits(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка получения избранных луков:', message);
      set({ error: message });
      throw error;
    }
  },

  /**
   * Переключает флаг "Избранное"
   */
  toggleFavorite: async (id: string) => {
    try {
      const state = get();
      const outfit = state.outfits.find((o) => o._id === id);
      if (outfit) {
        await get().updateOutfit(id, { isFavorite: !outfit.isFavorite });
      }
    } catch (error) {
      console.error('❌ Ошибка переключения избранного:', error);
      throw error;
    }
  },

  /**
   * Очищает локальный кэш
   */
  clearLocalCache: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ outfits: [] });
    } catch (error) {
      console.error('❌ Ошибка очистки кэша:', error);
    }
  },
}));
