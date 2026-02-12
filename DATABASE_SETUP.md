# Подключение MongoDB к ClothMatch

## 🎯 Структура проекта

Проект разделён на две части:
- **Frontend** (Expo App): `./` 
- **Backend** (Node.js + Express): `./server`

## 📋 Требования

- Node.js 16+ и npm/yarn
- MongoDB Atlas аккаунт (бесплатный)
- Python 3+ для Expo

## 🚀 Установка

### 1. Создайте MongoDB Atlas кластер

1. Зайдите на [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Создайте бесплатный аккаунт
3. Создайте новый кластер (выберите наиболее близкий регион)
4. Нажмите "Connect" → "Drivers"
5. Скопируйте Connection String (выглядит как: `mongodb+srv://...`)

### 2. Настройте Backend

```bash
cd server
npm install
```

Создайте файл `.env` в папке `server/` (используйте `.env.example` как шаблон):

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/clothmatch?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
```

**Важно:** Замените:
- `your-username` и `your-password` на свои креденшалы MongoDB
- `your-cluster` на название вашего кластера

### 3. Настройте Frontend

Для работы с Backend на локальной машине обновите [src/services/config.ts](src/services/config.ts):

```typescript
export const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'      // Для разработки
  : 'https://your-api-url.com/api';  // Для production
```

## 🎬 Запуск проекта

### Способ 1: Отдельные терминалы (рекомендуется)

**Терминал 1 - Backend:**
```bash
cd server
npm start
# или для режима разработки с автоперезагрузкой:
npm run dev
```

**Терминал 2 - Frontend:**
```bash
npm start
# или выберите платформу:
npm run android
npm run ios
npm run web
```

### Способ 2: Параллельный запуск

Можно добавить скрипт в корневой `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd server && npm start\" \"npm start\""
  }
}
```

Установите `concurrently`:
```bash
npm install --save-dev concurrently
```

Затем запустите:
```bash
npm run dev
```

## 🧪 Проверка подключения

### Health Check Backend
```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:
```json
{"status":"OK","message":"Server is running"}
```

### Тестирование API в Postman

1. **GET все вещи:**
   ```
   GET http://localhost:3000/api/wardrobe
   ```

2. **Добавить вещь:**
   ```
   POST http://localhost:3000/api/wardrobe
   Content-Type: application/json
   
   {
     "name": "Синяя рубашка",
     "category": "tops",
     "color": "blue",
     "season": ["spring", "summer"],
     "material": "cotton",
     "style": "casual",
     "condition": "new"
   }
   ```

3. **Удалить вещь:**
   ```
   DELETE http://localhost:3000/api/wardrobe/{id}
   ```

## 📱 Использование в приложении

### Загрузка гардероба

```typescript
import { useWardrobeStore } from './src/store/wardrobeStore';

export function WardrobeScreen() {
  const { items, isLoading, loadItems } = useWardrobeStore();

  useEffect(() => {
    loadItems(); // Загружает с сервера, fallback на локальное хранилище
  }, []);

  // ...
}
```

### Добавление вещи

```typescript
const { addItem } = useWardrobeStore();

const handleAddClothing = async (formData) => {
  try {
    await addItem({
      name: formData.name,
      category: formData.category,
      color: formData.color,
      season: formData.season,
      imageBase64: formData.imageBase64,
      material: formData.material,
      style: formData.style,
      condition: formData.condition,
      notes: formData.notes,
    });
    console.log('✅ Вещь добавлена');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
};
```

### Удаление вещи

```typescript
const { deleteItem } = useWardrobeStore();

const handleDelete = async (itemId) => {
  try {
    await deleteItem(itemId);
    console.log('✅ Вещь удалена');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
};
```

## 🔗 API Эндпоинты

| Метод | Путь | Описание |
|-------|------|---------|
| `GET` | `/api/wardrobe` | Получить все вещи |
| `GET` | `/api/wardrobe/:id` | Получить одну вещь |
| `POST` | `/api/wardrobe` | Добавить вещь |
| `PUT` | `/api/wardrobe/:id` | Обновить вещь |
| `DELETE` | `/api/wardrobe/:id` | Удалить вещь |
| `GET` | `/api/wardrobe/category/:category` | Получить вещи по категории |

## 🔐 Безопасность

- ✅ Переменные окружения хранятся в `.env` (не коммитятся в git)
- ✅ CORS настроен для разработки
- ✅ Входные данные валидируются на сервере
- ✅ Поддержка больших изображений в base64 (до 50MB)

**Для production:**
- Используйте HTTPS
- Добавьте аутентификацию (JWT)
- Ограничьте CORS только нужными доменами
- Добавьте rate limiting

## 🐛 Решение проблем

### Backend не запускается
```bash
# Проверьте Node.js версию
node --version  # Должно быть 16+

# Проверьте, установлены ли зависимости
npm install

# Проверьте .env файл
cat .env
```

### Ошибка подключения к MongoDB
- Убедитесь, что строка подключения верна
- Проверьте IP whitelist в MongoDB Atlas (должно быть `0.0.0.0/0` для разработки)
- Убедитесь, что пользователь создан и пароль правильный

### Приложение не видит Backend
- Убедитесь, что `API_URL` в `config.ts` верный
- Проверьте, что Backend запущен: `curl http://localhost:3000/health`
- В Android эмуляторе используйте `10.0.2.2` вместо `localhost`

### Большие изображения не загружаются
- Убедитесь, что в `index.js` установлен лимит `50mb`
- Для больших файлов используйте сжатие изображений

## 📚 Дополнительные ресурсы

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose ODM](https://mongoosejs.com/)
- [Zustand Store](https://github.com/pmndrs/zustand)
- [Expo Docs](https://docs.expo.dev/)

## ✅ Чеклист настройки

- [ ] MongoDB Atlas кластер создан
- [ ] `.env` файл заполнен с MONGODB_URI
- [ ] Backend установлен: `cd server && npm install`
- [ ] Backend запускается: `npm start`
- [ ] Health check работает: `curl http://localhost:3000/health`
- [ ] Frontend видит Backend: `API_URL` правильный
- [ ] Первая вещь добавлена через приложение
- [ ] Вещь видна в MongoDB Atlas

---

**Готово!** 🎉 Ваша база данных подключена и готова к использованию.
