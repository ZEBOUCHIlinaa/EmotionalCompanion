import { useQuery } from "@tanstack/react-query";
import type { WeatherData } from "@shared/schema";

export function useWeather(city: string = "Paris") {
  return useQuery<WeatherData>({
    queryKey: ["/api/weather", city],
    queryFn: async () => {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}
