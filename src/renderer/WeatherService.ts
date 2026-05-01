export type WeatherCondition =
  | 'sunny' | 'partly-cloudy' | 'cloudy' | 'overcast'
  | 'rain' | 'drizzle' | 'thunderstorm'
  | 'snow' | 'fog' | 'mist' | 'unknown';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
}

interface WttrResponse {
  current_condition: Array<{
    temp_C: string;
    humidity: string;
    windspeedKmph: string;
    weatherCode: string;
    weatherDesc: Array<{ value: string }>;
  }>;
}

function mapWttrCode(code: number): WeatherCondition {
  if (code === 113) return 'sunny';
  if (code === 116) return 'partly-cloudy';
  if (code === 119) return 'cloudy';
  if (code === 122) return 'overcast';
  if ((code >= 176 && code <= 185) || (code >= 293 && code <= 305)) return 'drizzle';
  if ((code >= 263 && code <= 302) || (code >= 353 && code <= 359)) return 'rain';
  if (code === 200 || code === 386 || code === 389) return 'thunderstorm';
  if ((code >= 179 && code <= 182) || (code >= 227 && code <= 230) ||
      (code >= 323 && code <= 395)) return 'snow';
  if (code >= 248 && code <= 260) return 'fog';
  if (code === 143) return 'mist';
  return 'unknown';
}

export class WeatherService {
  private currentWeather: WeatherData | null = null;
  private lastFetchTime: number = 0;
  private fetchInterval: number = 30 * 60 * 1000;
  private cacheKey: string = 'desktop-pet-weather';

  constructor() {
    this.loadFromCache();
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        this.currentWeather = data.weather;
        this.lastFetchTime = data.time;
      }
    } catch {
      // ignore
    }
  }

  private saveToCache(): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        weather: this.currentWeather,
        time: this.lastFetchTime,
      }));
    } catch {
      // ignore
    }
  }

  async getWeather(): Promise<WeatherData | null> {
    const now = Date.now();
    if (this.currentWeather && now - this.lastFetchTime < this.fetchInterval) {
      return this.currentWeather;
    }

    try {
      const response = await fetch('https://wttr.in/?format=j1', {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as WttrResponse;

      if (!data.current_condition || data.current_condition.length === 0) {
        throw new Error('No weather data');
      }

      const current = data.current_condition[0];
      const code = parseInt(current.weatherCode, 10);

      this.currentWeather = {
        condition: mapWttrCode(code),
        temperature: parseInt(current.temp_C, 10),
        humidity: parseInt(current.humidity, 10),
        windSpeed: parseInt(current.windspeedKmph, 10),
        description: current.weatherDesc[0]?.value ?? 'Unknown',
      };
      this.lastFetchTime = now;
      this.saveToCache();
    } catch (error) {
      console.warn('[WeatherService] Fetch failed:', error);
    }

    return this.currentWeather;
  }

  getCurrentWeather(): WeatherData | null {
    return this.currentWeather;
  }
}
