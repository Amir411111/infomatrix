/**
 * Сервис для работы с луками
 * Запросы к API /api/outfits
 */
import { API_URL } from './config';

export interface CreateOutfitData {
  name: string;
  description?: string;
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  style?: string;
  season?: string[];
  category?: string;
  isFavorite?: boolean;
  imageBase64?: string;
  rating?: number;
  occasions?: string[];
  notes?: string;
  userId?: string;
}

export interface Outfit extends CreateOutfitData {
  _id: string;
  createdAt: string;
  updatedAt: string;
  topId?: any;
  bottomId?: any;
  shoesId?: any;
}

/**
 * Получить все луки пользователя
 */
export const getOutfits = async (userId: string = 'default'): Promise<Outfit[]> => {
  try {
    const response = await fetch(`${API_URL}/outfits?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch outfits');
    return response.json();
  } catch (error) {
    console.error('Error fetching outfits:', error);
    throw error;
  }
};

/**
 * Получить конкретный лук
 */
export const getOutfit = async (id: string): Promise<Outfit> => {
  try {
    const response = await fetch(`${API_URL}/outfits/${id}`);
    if (!response.ok) throw new Error('Failed to fetch outfit');
    return response.json();
  } catch (error) {
    console.error('Error fetching outfit:', error);
    throw error;
  }
};

/**
 * Создать новый лук
 */
export const createOutfit = async (outfitData: CreateOutfitData): Promise<Outfit> => {
  try {
    console.log('Sending outfit data to:', `${API_URL}/outfits`);
    console.log('Payload:', outfitData);
    
    const response = await fetch(`${API_URL}/outfits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outfitData),
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', text.substring(0, 500));
    
    if (!response.ok) {
      throw new Error(`Failed to create outfit: ${response.status} - ${text.substring(0, 200)}`);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error creating outfit:', error);
    throw error;
  }
};

/**
 * Обновить лук
 */
export const updateOutfit = async (
  id: string,
  updates: Partial<CreateOutfitData>
): Promise<Outfit> => {
  try {
    const response = await fetch(`${API_URL}/outfits/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update outfit');
    return response.json();
  } catch (error) {
    console.error('Error updating outfit:', error);
    throw error;
  }
};

/**
 * Удалить лук
 */
export const deleteOutfit = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/outfits/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete outfit');
  } catch (error) {
    console.error('Error deleting outfit:', error);
    throw error;
  }
};

/**
 * Получить луки по стилю
 */
export const getOutfitsByStyle = async (
  style: string,
  userId: string = 'default'
): Promise<Outfit[]> => {
  try {
    const response = await fetch(
      `${API_URL}/outfits/filter/by-style/${style}?userId=${userId}`
    );
    if (!response.ok) throw new Error('Failed to fetch outfits by style');
    return response.json();
  } catch (error) {
    console.error('Error fetching outfits by style:', error);
    throw error;
  }
};

/**
 * Получить любимые луки
 */
export const getFavoriteOutfits = async (userId: string = 'default'): Promise<Outfit[]> => {
  try {
    const response = await fetch(`${API_URL}/outfits/filter/favorites?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch favorite outfits');
    return response.json();
  } catch (error) {
    console.error('Error fetching favorite outfits:', error);
    throw error;
  }
};
