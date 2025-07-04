import { useState, useEffect } from "react";
import { getCurrentTimeOfDay } from "@/lib/utils";
import type { TimeOfDay, MoodType, Theme } from "@/types";

// Mood-based themes as requested by user
const moodThemes: Record<MoodType, Theme> = {
  excited: {
    bg: "bg-gradient-to-br from-red-400 via-red-500 to-orange-500",
    primary: "#FF5E5B", // rouge corail
    secondary: "#FFD166", // jaune soleil
    accent: "#FFFFFF",
    text: "text-white",
  },
  happy: {
    bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500",
    primary: "#FFE66D", // jaune doux
    secondary: "#4ECDC4", // turquoise pastel
    accent: "#FFFFFF",
    text: "text-gray-800",
  },
  calm: {
    bg: "bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400",
    primary: "#A8DADC", // bleu pâle
    secondary: "#457B9D", // bleu profond
    accent: "#FFFFFF",
    text: "text-gray-800",
  },
  sad: {
    bg: "bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600",
    primary: "#5C5470", // mauve/gris
    secondary: "#B8B8FF", // lavande pâle
    accent: "#FFFFFF",
    text: "text-white",
  },
  anxious: {
    bg: "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900",
    primary: "#2B2D42", // gris foncé/bleuté
    secondary: "#EF233C", // rouge discret
    accent: "#FFFFFF",
    text: "text-white",
  },
  energetic: {
    bg: "bg-gradient-to-br from-green-400 via-green-500 to-cyan-500",
    primary: "#06D6A0", // vert menthe fluo
    secondary: "#118AB2", // bleu électrique
    accent: "#FFFFFF",
    text: "text-white",
  },
};

// Fallback time-based themes for when no mood is selected
const timeThemes: Record<TimeOfDay, Theme> = {
  morning: {
    bg: "bg-gradient-to-br from-navy-700 via-blue-800 to-indigo-900",
    primary: "hsl(20, 79%, 58%)",
    secondary: "hsl(51, 100%, 63%)",
    accent: "hsl(195, 100%, 79%)",
    text: "text-orange-100",
  },
  afternoon: {
    bg: "bg-gradient-to-br from-navy-800 via-blue-900 to-indigo-900",
    primary: "hsl(207, 90%, 54%)",
    secondary: "hsl(145, 63%, 49%)",
    accent: "hsl(0, 0%, 100%)",
    text: "text-blue-100",
  },
  evening: {
    bg: "bg-gradient-to-br from-navy-900 via-purple-900 to-indigo-900",
    primary: "hsl(236, 72%, 79%)",
    secondary: "hsl(291, 95%, 84%)",
    accent: "hsl(14, 100%, 86%)",
    text: "text-purple-100",
  },
  night: {
    bg: "bg-gradient-to-br from-navy-900 via-gray-900 to-slate-900",
    primary: "hsl(208, 25%, 23%)",
    secondary: "hsl(259, 46%, 58%)",
    accent: "hsl(208, 22%, 28%)",
    text: "text-gray-100",
  },
};

export function useTheme() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getCurrentTimeOfDay());
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  const [theme, setTheme] = useState<Theme>(timeThemes[getCurrentTimeOfDay()]);

  useEffect(() => {
    const updateTimeOfDay = () => {
      const newTimeOfDay = getCurrentTimeOfDay();
      setTimeOfDay(newTimeOfDay);
      
      // Only update theme with time if no mood is selected
      if (!currentMood) {
        setTheme(timeThemes[newTimeOfDay]);
      }
    };

    // Update immediately
    updateTimeOfDay();

    // Update every hour
    const interval = setInterval(updateTimeOfDay, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentMood]);

  const updateMood = (mood: MoodType) => {
    setCurrentMood(mood);
    // Switch to mood-based theme
    setTheme(moodThemes[mood]);
    // Store in localStorage
    localStorage.setItem("moodaware-current-mood", mood);
  };

  useEffect(() => {
    // Load saved mood from localStorage
    const savedMood = localStorage.getItem("moodaware-current-mood") as MoodType;
    if (savedMood && savedMood in moodThemes) {
      setCurrentMood(savedMood);
      setTheme(moodThemes[savedMood]);
    }
  }, []);

  return {
    timeOfDay,
    currentMood: currentMood || "happy", // Fallback for components that expect a mood
    theme,
    updateMood,
  };
}
