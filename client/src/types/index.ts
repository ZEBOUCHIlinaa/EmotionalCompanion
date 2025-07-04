export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type MoodType = "excited" | "happy" | "calm" | "sad" | "anxious" | "energetic";

export interface Theme {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

export interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
}

export interface MusicSuggestion {
  id: string;
  title: string;
  description: string;
  genre: string;
  gradient: string;
}

export interface Advice {
  id: string;
  text: string;
  icon: string;
  type: string;
}
