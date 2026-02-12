import express from 'express';
import { Outfit } from '../models/Outfit.js';

const router = express.Router();

/**
 * GET /outfits - получить все луки пользователя
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    console.log('📖 Получаю луки для пользователя:', userId);

    const outfits = await Outfit.find({ userId })
      .populate('topId bottomId shoesId')
      .sort({ createdAt: -1 });

    console.log(`✓ Найдено ${outfits.length} луков`);
    res.json(outfits);
  } catch (error) {
    console.error('❌ Ошибка при получении луков:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /outfits/:id - получить конкретный лук
 */
router.get('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id)
      .populate('topId bottomId shoesId');

    if (!outfit) {
      return res.status(404).json({ error: 'Лук не найден' });
    }

    res.json(outfit);
  } catch (error) {
    console.error('❌ Ошибка при получении лука:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /outfits - создать новый лук
 */
router.post('/', async (req, res) => {
  try {
    console.log('📨 POST /outfits received');
    console.log('Body:', JSON.stringify(req.body, null, 2).substring(0, 500));
    
    const {
      name,
      description,
      topId,
      bottomId,
      shoesId,
      style,
      season,
      category,
      isFavorite,
      imageBase64,
      userId = 'default',
      rating,
      occasions,
      notes,
    } = req.body;

    if (!name || (!topId && !bottomId && !shoesId)) {
      return res.status(400).json({
        error: 'Требуется название лука и хотя бы одна вещь',
      });
    }

    const outfit = new Outfit({
      name,
      description,
      topId,
      bottomId,
      shoesId,
      style,
      season,
      category,
      isFavorite,
      imageBase64,
      userId,
      rating,
      occasions,
      notes,
    });

    console.log('💾 Saving outfit...');
    await outfit.save();
    console.log('✓ Outfit saved, populating references...');
    
    // Populate references - может вызвать ошибку если IDs неверные
    try {
      await outfit.populate('topId bottomId shoesId');
    } catch (popErr) {
      console.warn('⚠️  Populate warning (не критично):', popErr.message);
      // Не критично если populate не сработал
    }

    console.log('✓ Лук создан:', outfit._id);
    res.status(201).json(outfit);
  } catch (error) {
    console.error('❌ Ошибка при создании лука:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /outfits/:id - обновить лук
 */
router.put('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('topId bottomId shoesId');

    if (!outfit) {
      return res.status(404).json({ error: 'Лук не найден' });
    }

    console.log('✓ Лук обновлен:', req.params.id);
    res.json(outfit);
  } catch (error) {
    console.error('❌ Ошибка при обновлении лука:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /outfits/:id - удалить лук
 */
router.delete('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findByIdAndDelete(req.params.id);

    if (!outfit) {
      return res.status(404).json({ error: 'Лук не найден' });
    }

    console.log('✓ Лук удален:', req.params.id);
    res.json({ message: 'Лук успешно удален' });
  } catch (error) {
    console.error('❌ Ошибка при удалении лука:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /outfits/filter/by-style - получить луки по стилю
 */
router.get('/filter/by-style/:style', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const outfits = await Outfit.find({
      userId,
      style: req.params.style,
    })
      .populate('topId bottomId shoesId')
      .sort({ createdAt: -1 });

    res.json(outfits);
  } catch (error) {
    console.error('❌ Ошибка при фильтрации луков:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /outfits/filter/favorites - получить избранные луки
 */
router.get('/filter/favorites', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const outfits = await Outfit.find({
      userId,
      isFavorite: true,
    })
      .populate('topId bottomId shoesId')
      .sort({ createdAt: -1 });

    res.json(outfits);
  } catch (error) {
    console.error('❌ Ошибка при получении избранных луков:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
