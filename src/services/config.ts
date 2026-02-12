export const WEATHER_API_KEY = '24a833ab573e479991c155546262301';
export const WEATHER_API_BASE_URL = 'http://api.weatherapi.com/v1';

// Backend API Configuration
// Для локальной разработки:
// - На web: http://localhost:3000/api
// - На Android эмуляторе: http://10.0.2.2:3000/api (используется для доступа к хосту)
// - На реальном устройстве: http://<YOUR_PC_IP>:3000/api (получите через ipconfig)

const __DEV__ = process.env.NODE_ENV !== 'production';

export const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development (для web и iOS)
  : 'https://your-production-url.com/api'; // Production

// Экспортируем также функцию для получения правильного API URL по платформе
export const getApiUrl = (platform?: string) => {
  if (!__DEV__) {
    return 'https://your-production-url.com/api';
  }
  
  // Для Android эмулятора нужно использовать 10.0.2.2 вместо localhost
  // if (platform === 'android') {
  //   return 'http://10.0.2.2:3000/api';
  // }
  
  return API_URL;
};
