import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TimeOfDay, MoodType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    if (days === 1) return "Hier";
    if (days === 2) return "Avant-hier";
    return `Il y a ${days} jours`;
  }
  if (hours > 0) return `Il y a ${hours}h`;
  if (minutes > 0) return `Il y a ${minutes}min`;
  return "À l'instant";
}

export function getMoodEmoji(mood: MoodType): string {
  const emojiMap: Record<MoodType, string> = {
    excited: "🤩",
    happy: "😊",
    calm: "😌",
    sad: "😢",
    anxious: "😰",
    energetic: "⚡",
  };
  return emojiMap[mood] || "😊";
}

export function getMoodLabel(mood: MoodType): string {
  const labelMap: Record<MoodType, string> = {
    excited: "Excité",
    happy: "Heureux",
    calm: "Calme",
    sad: "Triste",
    anxious: "Anxieux",
    energetic: "Énergique",
  };
  return labelMap[mood] || "Heureux";
}

export function getMoodColor(mood: MoodType): string {
  const colorMap: Record<MoodType, string> = {
    excited: "border-yellow-400",
    happy: "border-green-400",
    calm: "border-blue-400",
    sad: "border-gray-400",
    anxious: "border-red-400",
    energetic: "border-purple-400",
  };
  return colorMap[mood] || "border-green-400";
}

export function getWeatherIcon(condition: string): string {
  const iconMap: Record<string, string> = {
    sunny: "☀️",
    cloudy: "☁️",
    rainy: "🌧️",
    stormy: "⛈️",
    snowy: "❄️",
    foggy: "🌫️",
  };
  return iconMap[condition] || "☁️";
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export function getEndOfWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return endOfWeek;
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "short" });
}

export function exportMoodData(moodEntries: any[], journalEntries: any[]) {
  const data = {
    moodEntries,
    journalEntries,
    exportDate: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `moodaware-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
