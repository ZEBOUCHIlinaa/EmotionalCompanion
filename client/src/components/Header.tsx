import { useState, useEffect } from "react";
import { formatTime } from "@/lib/utils";
import { useWeather } from "@/hooks/useWeather";
import { getMoodEmoji, getMoodLabel } from "@/lib/utils";
import type { MoodType } from "@/types";

interface HeaderProps {
  currentMood: MoodType;
}

export default function Header({ currentMood }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: weather, isLoading } = useWeather();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full p-4 glass-effect">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">🌤 MoodAware</h1>
          <div className="hidden md:flex items-center space-x-2 text-white/80">
            <i className="fas fa-clock"></i>
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Weather Widget */}
          <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="weather-icon text-yellow-300">
                  {weather?.condition === "sunny" ? "☀️" : 
                   weather?.condition === "cloudy" ? "☁️" : 
                   weather?.condition === "rainy" ? "🌧️" : "☁️"}
                </span>
                <span className="text-white font-medium">{weather?.temperature}°C</span>
                <span className="text-white/80 text-sm">{weather?.city}</span>
              </>
            )}
          </div>
          
          {/* Current Mood Indicator */}
          <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
            <span className="text-lg">{getMoodEmoji(currentMood)}</span>
            <span className="text-white font-medium">{getMoodLabel(currentMood)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
