import mongoose from 'mongoose';

const clothingItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['top', 'bottom', 'shoes', 'tops', 'bottoms', 'dresses', 'outerwear', 'accessories'],
    },
    color: {
      type: String,
      required: true,
    },
    season: {
      type: [String],
      enum: ['spring', 'summer', 'autumn', 'winter'],
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imageBase64: {
      type: String,
      default: null,
    },
    material: {
      type: String,
      default: null,
    },
    style: {
      type: String,
      default: null,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'worn'],
      default: 'good',
    },
    notes: {
      type: String,
      default: null,
    },
    // Можно добавить userId в будущем для поддержки нескольких пользователей
    userId: {
      type: String,
      default: 'default',
    },
  },
  {
    timestamps: true, // Добавляет createdAt и updatedAt автоматически
  }
);

export const ClothingItem = mongoose.model('ClothingItem', clothingItemSchema);
