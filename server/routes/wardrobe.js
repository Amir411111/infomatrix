import express from 'express';
import { ClothingItem } from '../models/ClothingItem.js';

const router = express.Router();

/**
 * GET /api/wardrobe
 * Получить все вещи из гардероба
 */
router.get('/', async (req, res) => {
  try {
    console.log('📥 Processing GET /api/wardrobe');
    const items = await ClothingItem.find({ userId: 'default' }).sort({ createdAt: -1 });
    console.log('✓ Found items:', items.length);
    res.json(items);
  } catch (error) {
    console.error('❌ Error in GET /api/wardrobe:', error.message);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

/**
 * GET /api/wardrobe/category/:category
 * Получить все вещи определённой категории
 * ВАЖНО: этот маршрут должен быть ПЕРЕД маршрутом /:id
 */
router.get('/category/:category', async (req, res) => {
  try {
    console.log('📥 Processing GET /api/wardrobe/category/', req.params.category);
    const items = await ClothingItem.find({
      category: req.params.category,
      userId: 'default',
    }).sort({ createdAt: -1 });

    console.log('✓ Found items in category:', items.length);
    res.json(items);
  } catch (error) {
    console.error('❌ Error in GET /category/:category:', error.message);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

/**
 * GET /api/wardrobe/:id
 * Получить одну вещь по ID
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('📥 Processing GET /api/wardrobe/:id', req.params.id);
    const item = await ClothingItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Вещь не найдена' });
    }
    console.log('✓ Found item:', item._id);
    res.json(item);
  } catch (error) {
    console.error('❌ Error in GET /:id:', error.message);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

/**
 * POST /api/wardrobe
 * Добавить новую вещь в гардероб
 */
router.post('/', async (req, res) => {
  try {
    console.log('📥 Processing POST /api/wardrobe');
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    
    const { name, category, color, season, imageBase64, material, style, condition, notes, userId } = req.body;

    // Проверяем обязательные поля
    if (!name || !name.trim()) {
      console.warn('⚠️  Missing name');
      return res.status(400).json({ error: 'Название вещи обязательно' });
    }
    
    if (!category) {
      console.warn('⚠️  Missing category');
      return res.status(400).json({ error: 'Категория обязательна' });
    }
    
    if (!color || !color.trim()) {
      console.warn('⚠️  Missing color');
      return res.status(400).json({ error: 'Цвет обязателен' });
    }
    
    if (!season || (Array.isArray(season) && season.length === 0)) {
      console.warn('⚠️  Missing season');
      return res.status(400).json({ error: 'Выберите хотя бы один сезон' });
    }

    const newItem = new ClothingItem({
      name: name.trim(),
      category,
      color: color.trim(),
      season: Array.isArray(season) ? season : [season],
      imageBase64,
      material: material ? material.trim() : null,
      style,
      condition,
      notes: notes ? notes.trim() : null,
      userId: userId || 'default',
    });

    const savedItem = await newItem.save();
    console.log('✓ Item created:', savedItem._id);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('❌ Error in POST /:', error.message);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

/**
 * PUT /api/wardrobe/:id
 * Обновить вещь
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('📥 Processing PUT /api/wardrobe/:id', req.params.id);
    const { name, category, color, season, imageBase64, material, style, condition, notes } = req.body;

    const updatedItem = await ClothingItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        color,
        season: Array.isArray(season) ? season : [season],
        imageBase64,
        material,
        style,
        condition,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Вещь не найдена' });
    }

    console.log('✓ Item updated:', updatedItem._id);
    res.json(updatedItem);
  } catch (error) {
    console.error('❌ Error in PUT /:id:', error.message);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

/**
 * DELETE /api/wardrobe/:id
 * Удалить вещь
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('📥 Processing DELETE /api/wardrobe/:id', req.params.id);
    const deletedItem = await ClothingItem.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ error: 'Вещь не найдена' });
    }

    console.log('✓ Item deleted:', deletedItem._id);
    res.json({ message: 'Вещь удалена успешно', item: deletedItem });
  } catch (error) {
    console.error('❌ Error in DELETE /:id:', error.message);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

export default router;
