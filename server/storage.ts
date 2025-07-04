import { 
  moodEntries, 
  journalEntries, 
  dailyGoals, 
  userPreferences,
  type MoodEntry,
  type InsertMoodEntry,
  type JournalEntry,
  type InsertJournalEntry,
  type DailyGoal,
  type InsertDailyGoal,
  type UserPreferences,
  type InsertUserPreferences
} from "@shared/schema";

export interface IStorage {
  // Mood entries
  getMoodEntries(limit?: number): Promise<MoodEntry[]>;
  getMoodEntriesByDateRange(startDate: Date, endDate: Date): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  
  // Journal entries
  getJournalEntries(limit?: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  
  // Daily goals
  getDailyGoals(date?: Date): Promise<DailyGoal[]>;
  createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal>;
  updateDailyGoal(id: number, progress: number, completed: number): Promise<DailyGoal>;
  
  // User preferences
  getUserPreferences(): Promise<UserPreferences | undefined>;
  updateUserPreferences(preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private moodEntries: Map<number, MoodEntry>;
  private journalEntries: Map<number, JournalEntry>;
  private dailyGoals: Map<number, DailyGoal>;
  private userPreferences: UserPreferences | undefined;
  private currentMoodId: number;
  private currentJournalId: number;
  private currentGoalId: number;

  constructor() {
    this.moodEntries = new Map();
    this.journalEntries = new Map();
    this.dailyGoals = new Map();
    this.currentMoodId = 1;
    this.currentJournalId = 1;
    this.currentGoalId = 1;
    
    // Initialize with default preferences
    this.userPreferences = {
      id: 1,
      weatherLocation: "Paris",
      theme: "auto",
      notifications: 1,
      language: "fr"
    };
  }

  async getMoodEntries(limit = 50): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return entries;
  }

  async getMoodEntriesByDateRange(startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values())
      .filter(entry => entry.timestamp >= startDate && entry.timestamp <= endDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return entries;
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentMoodId++;
    const entry: MoodEntry = {
      ...insertEntry,
      id,
      timestamp: new Date(),
      note: insertEntry.note || null,
      weatherData: insertEntry.weatherData || null,
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  async getJournalEntries(limit = 20): Promise<JournalEntry[]> {
    const entries = Array.from(this.journalEntries.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return entries;
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.currentJournalId++;
    const entry: JournalEntry = {
      ...insertEntry,
      id,
      timestamp: new Date(),
      weatherData: insertEntry.weatherData || null,
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  async getDailyGoals(date?: Date): Promise<DailyGoal[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const goals = Array.from(this.dailyGoals.values())
      .filter(goal => goal.date >= startOfDay && goal.date < endOfDay);
    return goals;
  }

  async createDailyGoal(insertGoal: InsertDailyGoal): Promise<DailyGoal> {
    const id = this.currentGoalId++;
    const goal: DailyGoal = {
      ...insertGoal,
      id,
      date: new Date(),
      description: insertGoal.description || null,
      progress: insertGoal.progress || 0,
      target: insertGoal.target || 100,
      completed: insertGoal.completed || 0,
    };
    this.dailyGoals.set(id, goal);
    return goal;
  }

  async updateDailyGoal(id: number, progress: number, completed: number): Promise<DailyGoal> {
    const goal = this.dailyGoals.get(id);
    if (!goal) {
      throw new Error(`Goal with id ${id} not found`);
    }
    
    const updatedGoal = { ...goal, progress, completed };
    this.dailyGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async getUserPreferences(): Promise<UserPreferences | undefined> {
    return this.userPreferences;
  }

  async updateUserPreferences(preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    this.userPreferences = {
      ...this.userPreferences!,
      ...preferences,
    };
    return this.userPreferences;
  }
}

export const storage = new MemStorage();
