import type { WeatherData } from "@shared/schema";

export class WeatherService {
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Weather API key not found. Weather features will be limited.");
    }
  }

  async getCurrentWeather(city: string = "Paris"): Promise<WeatherData> {
    if (!this.apiKey) {
      // Return mock data when API key is not available
      return {
        temperature: 22,
        condition: "sunny",
        description: "Ensoleillé",
        icon: "01d",
        humidity: 65,
        windSpeed: 5,
        city: city
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=fr`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        condition: this.mapWeatherCondition(data.weather[0].main),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        city: data.name
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Return fallback data
      return {
        temperature: 20,
        condition: "cloudy",
        description: "Nuageux",
        icon: "02d",
        humidity: 70,
        windSpeed: 10,
        city: city
      };
    }
  }

  private mapWeatherCondition(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      "Clear": "sunny",
      "Clouds": "cloudy",
      "Rain": "rainy",
      "Drizzle": "rainy",
      "Thunderstorm": "stormy",
      "Snow": "snowy",
      "Mist": "foggy",
      "Fog": "foggy",
      "Haze": "foggy",
    };
    
    return conditionMap[condition] || "cloudy";
  }
}

export const weatherService = new WeatherService();
