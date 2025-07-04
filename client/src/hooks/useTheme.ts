import { useState, useEffect } from "react";
import { getCurrentTimeOfDay } from "@/lib/utils";
import type { TimeOfDay, MoodType, Theme } from "@/types";

const themes: Record<TimeOfDay, Theme> = {
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
  const [currentMood, setCurrentMood] = useState<MoodType>("happy");
  const [theme, setTheme] = useState<Theme>(themes[timeOfDay]);

  useEffect(() => {
    const updateTimeOfDay = () => {
      const newTimeOfDay = getCurrentTimeOfDay();
      setTimeOfDay(newTimeOfDay);
      setTheme(themes[newTimeOfDay]);
    };

    // Update immediately
    updateTimeOfDay();

    // Update every hour
    const interval = setInterval(updateTimeOfDay, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const updateMood = (mood: MoodType) => {
    setCurrentMood(mood);
    // Store in localStorage
    localStorage.setItem("moodaware-current-mood", mood);
  };

  useEffect(() => {
    // Load saved mood from localStorage
    const savedMood = localStorage.getItem("moodaware-current-mood") as MoodType;
    if (savedMood) {
      setCurrentMood(savedMood);
    }
  }, []);

  return {
    timeOfDay,
    currentMood,
    theme,
    updateMood,
  };
}
