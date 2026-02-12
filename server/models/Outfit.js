import mongoose from 'mongoose';

const outfitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    // IDs вещей из гардероба
    topId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClothingItem',
      default: null,
    },
    bottomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClothingItem',
      default: null,
    },
    shoesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClothingItem',
      default: null,
    },
    // Стиль (casual, formal, sporty, etc.)
    style: {
      type: String,
      default: 'casual',
    },
    // Сезон
    season: {
      type: [String],
      enum: ['spring', 'summer', 'autumn', 'winter'],
      default: ['spring', 'summer', 'autumn', 'winter'],
    },
    // Категория (категории по назначению)
    category: {
      type: String,
      default: 'casual',
      enum: ['casual', 'formal', 'sporty', 'party', 'beach', 'work', 'other'],
    },
    // Избранное
    isFavorite: {
      type: Boolean,
      default: false,
    },
    // Изображение полного комплекта (если захотим сохранять)
    imageBase64: {
      type: String,
      default: null,
    },
    userId: {
      type: String,
      default: 'default',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    occasions: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Outfit = mongoose.model('Outfit', outfitSchema);
