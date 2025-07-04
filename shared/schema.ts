import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table for authentication and premium features
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  premiumExpiresAt: timestamp("premium_expires_at"),
  appPassword: text("app_password"), // For app locking feature
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  mood: text("mood").notNull(), // excited, happy, calm, sad, anxious, energetic
  emoji: text("emoji").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  note: text("note"),
  weatherData: jsonb("weather_data"),
  timeOfDay: text("time_of_day").notNull(), // morning, afternoon, evening, night
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  mood: text("mood").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  weatherData: jsonb("weather_data"),
});

export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull().default(100),
  date: timestamp("date").notNull().defaultNow(),
  completed: integer("completed").notNull().default(0), // 0 = not completed, 1 = completed
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  weatherLocation: text("weather_location").default("Paris"),
  theme: text("theme").default("auto"), // auto, morning, afternoon, evening, night, galaxy, ocean
  notifications: integer("notifications").default(1), // 0 = off, 1 = on
  language: text("language").default("fr"),
});

// Premium features tables
export const workoutSuggestions = pgTable("workout_suggestions", {
  id: serial("id").primaryKey(),
  mood: text("mood").notNull(),
  weather: text("weather").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  equipment: text("equipment"), // none, basic, gym
});

export const musicTracks = pgTable("music_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  mood: text("mood").notNull(),
  timeOfDay: text("time_of_day"),
  isPremium: boolean("is_premium").default(false),
  url: text("url"),
  duration: integer("duration"), // in seconds
});

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  mood: text("mood"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertWorkoutSuggestionSchema = createInsertSchema(workoutSuggestions).omit({
  id: true,
});

export const insertMusicTrackSchema = createInsertSchema(musicTracks).omit({
  id: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type WorkoutSuggestion = typeof workoutSuggestions.$inferSelect;
export type InsertWorkoutSuggestion = z.infer<typeof insertWorkoutSuggestionSchema>;
export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = z.infer<typeof insertMusicTrackSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;

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
