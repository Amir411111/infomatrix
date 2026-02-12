/**
 * Zustand store для управления гардеробом
 * Теперь синхронизируется с MongoDB через Backend API
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClothingItem, ClothingCategory } from '../types';
import {
  getWardrobe,
  addWardrobeItem as apiAddItem,
  updateWardrobeItem as apiUpdateItem,
  deleteWardrobeItem as apiDeleteItem,
} from '../services/wardrobeService';

interface WardrobeState {
  items: ClothingItem[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Actions
  loadItems: () => Promise<void>;
  addItem: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemsByCategory: (category: ClothingCategory) => ClothingItem[];
  syncWithServer: () => Promise<void>;
  clearLocalCache: () => Promise<void>;
}

const STORAGE_KEY = '@clothmatch:wardrobe';

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  /**
   * Загружает все вещи с сервера
   * При ошибке подключения использует локальное хранилище
   */
  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      // Пытаемся загрузить с сервера
      const serverItems = await getWardrobe();
      set({ items: serverItems, isLoading: false });
      
      // Синхронизируем локальное хранилище
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverItems));
    } catch (error) {
      console.warn('Ошибка загрузки с сервера, используем локальное хранилище:', error);
      
      try {
        // Fallback на локальное хранилище
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const items = JSON.parse(stored) as ClothingItem[];
          set({ items, isLoading: false, error: 'Используется кэш (сервер недоступен)' });
        } else {
          set({ items: [], isLoading: false, error: 'Сервер недоступен' });
        }
      } catch (localError) {
        console.error('Ошибка загрузки локального хранилища:', localError);
        set({ items: [], isLoading: false, error: 'Ошибка загрузки данных' });
      }
    }
  },

  /**
   * Добавляет новую вещь в гардероб
   * Сначала сохраняет на сервер, потом обновляет локальное хранилище
   */
  addItem: async (itemData) => {
    set({ error: null });
    try {
      console.log('🔄 Добавляем вещь в store:', itemData);
      
      // Добавляем на сервер
      const newItem = await apiAddItem(itemData);
      console.log('✅ Получена вещь с сервера:', newItem);
      
      const updatedItems = [...get().items, newItem];
      set({ items: updatedItems });
      
      // Синхронизируем локальное хранилище
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      console.log('✅ Вещь сохранена в LocalStorage');
    } catch (error) {
      console.error('❌ Ошибка добавления вещи в store:', error);
      set({ error: `Не удалось добавить вещь: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
      throw error;
    }
  },

  /**
   * Обновляет вещь в гардеробе
   * Сначала обновляет на сервере, потом локально
   */
  updateItem: async (id: string, updates: Partial<ClothingItem>) => {
    set({ error: null });
    const currentItems = get().items;
    
    try {
      // Находим элемент для обновления
      const itemToUpdate = currentItems.find(item => item.id === id || item._id === id);
      if (!itemToUpdate) {
        throw new Error('Вещь не найдена');
      }
      
      // СНАЧАЛА обновляем на сервере
      const updateId = itemToUpdate._id || id;
      console.log('🔄 Обновляем на сервере ID:', updateId);
      const updatedItem = await apiUpdateItem(updateId, updates);
      console.log('✓ Вещь успешно обновлена на сервере');
      
      // ЗАТЕМ обновляем локально
      const updatedItems = currentItems.map(item => 
        (item.id === id || item._id === id) ? { ...item, ...updatedItem } : item
      );
      set({ items: updatedItems });
      
      // Обновляем локальное хранилище
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      console.log('✓ Вещь обновлена локально и в хранилище');
    } catch (error) {
      console.error('❌ Ошибка обновления вещи:', error);
      set({ 
        error: `Не удалось обновить вещь: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
      throw error;
    }
  },

  /**
   * Удаляет вещь из гардероба
   * Сначала удаляет с сервера, потом с локального хранилища
   * Это гарантирует консистентность данных
   */
  deleteItem: async (id: string) => {
    set({ error: null });
    const currentItems = get().items;
    
    try {
      // Находим элемент для удаления
      const itemToDelete = currentItems.find(item => item.id === id || item._id === id);
      if (!itemToDelete) {
        throw new Error('Вещь не найдена');
      }
      
      // СНАЧАЛА удаляем с сервера (используем _id если есть)
      const deleteId = itemToDelete._id || id;
      console.log('🔄 Удаляем с сервера ID:', deleteId);
      await apiDeleteItem(deleteId);
      console.log('✓ Вещь успешно удалена с сервера');
      
      // ЗАТЕМ удаляем локально после успешного удаления с сервера
      const updatedItems = currentItems.filter(item => item.id !== id && item._id !== id);
      set({ items: updatedItems });
      
      // Обновляем локальное хранилище
      if (updatedItems.length === 0) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      }
      
      console.log('✓ Вещь удалена локально и из хранилища');
    } catch (error) {
      console.error('❌ Ошибка удаления вещи:', error);
      set({ 
        error: `Не удалось удалить вещь: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
      throw error;
    }
  },

  /**
   * Получает вещи по категории
   */
  getItemsByCategory: (category: ClothingCategory) => {
    // Преобразуем русские названия категорий в коды для БД
    const categoryMap: { [key: string]: string } = {
      'Верх': 'top',
      'Низ': 'bottom',
      'Обувь': 'shoes',
    };
    const categoryCode = categoryMap[category] || category;
    return get().items.filter(item => item.category === categoryCode);
  },

  /**
   * Синхронизирует данные с сервером
   * Полезна для принудительного обновления
   */
  syncWithServer: async () => {
    set({ isSyncing: true, error: null });
    try {
      const serverItems = await getWardrobe();
      set({ items: serverItems, isSyncing: false });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverItems));
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      set({ 
        isSyncing: false,
        error: 'Ошибка синхронизации с сервером'
      });
    }
  },

  /**
   * Очищает локальный кэш и перезагружает данные с сервера
   */
  clearLocalCache: async () => {
    try {
      // Удаляем локальный кэш
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('✓ Локальный кэш очищен');
      
      // Очищаем состояние приложения
      set({ items: [], error: null });
      
      // Пытаемся перезагрузить данные с сервера
      try {
        await get().loadItems();
      } catch (serverError) {
        // Если сервер недоступен, просто остаемся с пустым списком
        console.warn('⚠️ Сервер недоступен, но кэш очищен:', serverError);
      }
    } catch (error) {
      console.error('Ошибка очистки кэша:', error);
      set({ error: 'Ошибка очистки кэша' });
      throw error;
    }
  },
}));

