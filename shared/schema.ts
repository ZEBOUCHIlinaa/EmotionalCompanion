import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  mood: text("mood").notNull(), // excited, happy, calm, sad, anxious, energetic
  emoji: text("emoji").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  note: text("note"),
  weatherData: jsonb("weather_data"),
  timeOfDay: text("time_of_day").notNull(), // morning, afternoon, evening, night
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  mood: text("mood").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  weatherData: jsonb("weather_data"),
});

export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull().default(100),
  date: timestamp("date").notNull().defaultNow(),
  completed: integer("completed").notNull().default(0), // 0 = not completed, 1 = completed
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  weatherLocation: text("weather_location").default("Paris"),
  theme: text("theme").default("auto"), // auto, morning, afternoon, evening, night
  notifications: integer("notifications").default(1), // 0 = off, 1 = on
  language: text("language").default("fr"),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  timestamp: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  timestamp: true,
});

export const insertDailyGoalSchema = createInsertSchema(dailyGoals).omit({
  id: true,
  date: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type WeatherData = {
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
};

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type MoodType = "excited" | "happy" | "calm" | "sad" | "anxious" | "energetic";
