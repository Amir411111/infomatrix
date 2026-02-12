/**
 * Сервис для получения рекомендаций по одежде на основе погоды
 * Имитирует запрос к AI-советнику
 */
import { ClothingItem, WeatherData, Recommendation, Outfit } from '../types';
import { t } from 'i18next';

/**
 * Алгоритм подбора одежды на основе температуры и погодных условий
 * 
 * Логика:
 * - Температура < 0°C: теплая одежда (куртки, зимние ботинки)
 * - Температура 0-10°C: осенняя/весенняя одежда (свитеры, джинсы, кроссовки)
 * - Температура 10-20°C: легкая одежда (футболки, легкие брюки)
 * - Температура > 20°C: летняя одежда (шорты, сандалии)
 * - Дождь: предпочтение закрытой обуви и верхней одежды
 */
export const getSmartRecommendation = async (
  weather: WeatherData,
  items: ClothingItem[]
): Promise<Recommendation> => {
  // Имитация задержки запроса к AI
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { temperature, isRaining } = weather;
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();

  const monthToSeason = (m: number) => {
    // m: 0..11
    if (m === 11 || m === 0 || m === 1) return 'winter';
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    return 'autumn';
  };

  const season = monthToSeason(month);
  
  // Нормализуем категорию (учесть русские и английские варианты)
  const normalizeCategory = (cat?: string) => {
    if (!cat) return undefined;
    const c = cat.toString().toLowerCase();
    if (c === 'верх' || c === 'top' || c === 'tops') return 'top';
    if (c === 'низ' || c === 'bottom' || c === 'bottoms') return 'bottom';
    if (c === 'обувь' || c === 'shoes' || c === 'shoe') return 'shoes';
    return undefined;
  };

  // Разделяем вещи по нормализованным категориям
  const tops = items.filter(item => normalizeCategory(item.category) === 'top');
  const bottoms = items.filter(item => normalizeCategory(item.category) === 'bottom');
  const shoes = items.filter(item => normalizeCategory(item.category) === 'shoes');

  const prefersSeason = (item?: ClothingItem) => {
    if (!item) return false;
    if (!item.season || item.season.length === 0) return false;
    return item.season.map(s => s.toLowerCase()).includes(season);
  };

  const looksWaterproof = (item?: ClothingItem) => {
    if (!item) return false;
    const fields = [item.condition, item.notes, item.material, item.name].filter(Boolean).join(' ').toLowerCase();
    return fields.includes('waterproof') || fields.includes('водонепроница') || fields.includes('резин') || fields.includes('leather') || fields.includes('rubber');
  };

  const outfit: Outfit = {};
  let reason = '';

  // Подбор верха — предпочитаем вещи, помеченные для текущего сезона
  if (tops.length > 0) {
    const seasonalTops = tops.filter(prefersSeason);
    const pool = seasonalTops.length > 0 ? seasonalTops : tops;
    // Более холодные варианты для низких температур
    if (temperature < 0) {
       outfit.top = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonColdTop') + ' ';
    } else if (temperature < 10) {
      outfit.top = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonCoolTop') + ' ';
    } else if (temperature < 20) {
      outfit.top = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonMildTop') + ' ';
    } else {
      outfit.top = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonWarmTop') + ' ';
    }
    // Если дождь — при возможности выбрать верх с заметной защитой/материалом
    if (isRaining && looksWaterproof(outfit.top)) {
      reason += t('recommendations.reasonWaterproofTop') + '   ';
    }
  } 

  // Подбор низа — также учитываем сезон и погоду
  if (bottoms.length > 0) {
    const seasonalBottoms = bottoms.filter(prefersSeason);
    const pool = seasonalBottoms.length > 0 ? seasonalBottoms : bottoms;
    if (temperature > 22) {
      // Жарко - попытка выбрать лёгкую вещь
      outfit.bottom = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonHotBottom') + ' ';
    } else if (temperature < 5) {
      outfit.bottom = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonColdBottom') + ' ';
    } else {
      outfit.bottom = pool[Math.floor(Math.random() * pool.length)];
      reason += t('recommendations.reasonNormalBottom') + ' ';
    }
  }

  // Подбор обуви — даём приоритет водонепроницаемым/закрытым в дождь
  if (shoes.length > 0) {
    let pool = shoes;
    if (isRaining) {
      const waterproofShoes = shoes.filter(looksWaterproof);
      pool = waterproofShoes.length > 0 ? waterproofShoes : shoes;
      reason += t('recommendations.reasonRainShoes') + ' ';
    } else {
      const seasonalShoes = shoes.filter(prefersSeason);
      pool = seasonalShoes.length > 0 ? seasonalShoes : shoes;
      reason += temperature > 20 ? t('recommendations.reasonHotShoes') + ' ' : t('recommendations.reasonNormalShoes') + ' ';
    }
    outfit.shoes = pool[Math.floor(Math.random() * pool.length)];
  }

  // Если не удалось подобрать полный комплект
  const dateString = today.toLocaleDateString();
  if (!outfit.top && !outfit.bottom && !outfit.shoes) {
    reason = t('recommendations.reasonEmptyWardrobe');
  } else if (!outfit.top || !outfit.bottom || !outfit.shoes) {
    reason = `${today.toLocaleDateString()} — ${season}. ${reason} ${t('recommendations.reasonIncompleteOutfit')}`;
  } else {
  const rainText = isRaining ? ', with rain' : '';
  reason = `${today.toLocaleDateString()} — ${season}. ${t('recommendations.reasonPerfectOutfit', { temperature, rain: rainText })} ${reason}`;
}


  return { outfit, reason };
};

