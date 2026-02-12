import { API_URL } from './config';
import { ClothingItem } from '../types';

/**
 * Получить все вещи из гардероба
 */
export const getWardrobe = async (): Promise<ClothingItem[]> => {
  try {
    const response = await fetch(`${API_URL}/wardrobe`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении гардероба:', error);
    throw error;
  }
};

/**
 * Получить одну вещь по ID
 */
export const getWardrobeItem = async (id: string): Promise<ClothingItem> => {
  try {
    const response = await fetch(`${API_URL}/wardrobe/${id}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении вещи:', error);
    throw error;
  }
};

/**
 * Добавить новую вещь в гардероб
 */
export const addWardrobeItem = async (
  item: Omit<ClothingItem, 'id' | 'createdAt'>
): Promise<ClothingItem> => {
  try {
    console.log('📤 Отправляем на сервер:', item);
    
    const response = await fetch(`${API_URL}/wardrobe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    console.log('📨 Ответ от сервера:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка сервера:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Вещь успешно добавлена:', result);
    return result;
  } catch (error) {
    console.error('❌ Ошибка при добавлении вещи:', error);
    throw error;
  }
};

/**
 * Обновить вещь
 */
export const updateWardrobeItem = async (
  id: string,
  item: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
): Promise<ClothingItem> => {
  try {
    const response = await fetch(`${API_URL}/wardrobe/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при обновлении вещи:', error);
    throw error;
  }
};

/**
 * Удалить вещь
 */
export const deleteWardrobeItem = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/wardrobe/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Ошибка при удалении вещи:', error);
    throw error;
  }
};

/**
 * Получить вещи по категории
 */
export const getWardrobeByCategory = async (category: string): Promise<ClothingItem[]> => {
  try {
    const response = await fetch(`${API_URL}/wardrobe/category/${category}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении вещей по категории:', error);
    throw error;
  }
};
