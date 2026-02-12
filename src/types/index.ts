/**
 * Типы для приложения ClothMatch
 */

export type ClothingCategory = 'Верх' | 'Низ' | 'Обувь' | 'top' | 'bottom' | 'shoes';

export interface ClothingItem {
  id?: string;
  _id?: string;
  imageUri?: string;
  name?: string;
  category: ClothingCategory;
  color?: string;
  season?: string[];
  material?: string;
  style?: string;
  condition?: string;
  imageBase64?: string;
  notes?: string;
  userId?: string;
  createdAt?: number | string;
  __v?: number;
}

export interface Outfit {
  _id?: string;
  name?: string;
  description?: string;
  top?: ClothingItem;
  topId?: string;
  bottom?: ClothingItem;
  bottomId?: string;
  shoes?: ClothingItem;
  shoesId?: string;
  style?: string;
  category?: string;
  season?: string[];
  isFavorite?: boolean;
  imageBase64?: string;
  rating?: number;
  occasions?: string[];
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeatherData {
  temperature: number; // в градусах Цельсия
  isRaining: boolean;
}

export interface Recommendation {
  outfit: Outfit;
  reason: string;
}

export type OutfitStyle = 'casual' | 'formal' | 'sporty' | 'party' | 'beach' | 'work' | 'other';
export type OutfitCategory = 'casual' | 'formal' | 'sporty' | 'party' | 'beach' | 'work' | 'other';


