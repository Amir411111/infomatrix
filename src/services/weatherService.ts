import { WEATHER_API_KEY, WEATHER_API_BASE_URL } from './config';
import { WeatherData } from '../types';

export const getWeatherByLocation = async (
    latitude: number,
    longitude: number
): Promise<WeatherData> => {
    try {
        const response = await fetch(
            `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
        );

        if (!response.ok) {
            throw new Error('Weather API returned an error');
        }

        const data = await response.json();
        const current = data.current;

        // Map WeatherAPI condition codes/text to our simple "isRaining" boolean
        // Code 1000 is Sunny/Clear. Rain usually starts around 1063 or 1180+
        // We can also check the condition text for "rain" or "drizzle" or "shower"
        const conditionText = current.condition.text.toLowerCase();
        const isRaining =
            conditionText.includes('rain') ||
            conditionText.includes('drizzle') ||
            conditionText.includes('shower') ||
            conditionText.includes('thunderstorm');

        return {
            temperature: current.temp_c,
            isRaining: isRaining,
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
};
