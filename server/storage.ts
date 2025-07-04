import { 
  users,
  moodEntries, 
  journalEntries, 
  dailyGoals, 
  userPreferences,
  type User,
  type InsertUser,
  type MoodEntry,
  type InsertMoodEntry,
  type JournalEntry,
  type InsertJournalEntry,
  type DailyGoal,
  type InsertDailyGoal,
  type UserPreferences,
  type InsertUserPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // Mood entries
  getMoodEntries(userId?: number, limit?: number): Promise<MoodEntry[]>;
  getMoodEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  
  // Journal entries
  getJournalEntries(userId?: number, limit?: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  
  // Daily goals
  getDailyGoals(userId?: number, date?: Date): Promise<DailyGoal[]>;
  createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal>;
  updateDailyGoal(id: number, progress: number, completed: number): Promise<DailyGoal>;
  
  // User preferences
  getUserPreferences(userId?: number): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        profileImageUrl: insertUser.profileImageUrl || null,
        isPremium: insertUser.isPremium || false,
        premiumExpiresAt: insertUser.premiumExpiresAt || null,
        appPassword: insertUser.appPassword || null,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Mood entries
  async getMoodEntries(userId?: number, limit = 50): Promise<MoodEntry[]> {
    const query = db.select().from(moodEntries);
    
    if (userId) {
      query.where(eq(moodEntries.userId, userId));
    }
    
    const entries = await query
      .orderBy(desc(moodEntries.timestamp))
      .limit(limit);
    
    return entries;
  }

  async getMoodEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.timestamp, startDate),
          lte(moodEntries.timestamp, endDate)
        )
      )
      .orderBy(desc(moodEntries.timestamp));
    
    return entries;
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await db
      .insert(moodEntries)
      .values({
        ...insertEntry,
        userId: insertEntry.userId || 1, // Default to guest user
        note: insertEntry.note || null,
        weatherData: insertEntry.weatherData || null,
      })
      .returning();
    return entry;
  }

  // Journal entries
  async getJournalEntries(userId?: number, limit = 20): Promise<JournalEntry[]> {
    const query = db.select().from(journalEntries);
    
    if (userId) {
      query.where(eq(journalEntries.userId, userId));
    }
    
    const entries = await query
      .orderBy(desc(journalEntries.timestamp))
      .limit(limit);
    
    return entries;
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db
      .insert(journalEntries)
      .values({
        ...insertEntry,
        userId: insertEntry.userId || 1, // Default to guest user
        weatherData: insertEntry.weatherData || null,
      })
      .returning();
    return entry;
  }

  // Daily goals
  async getDailyGoals(userId?: number, date?: Date): Promise<DailyGoal[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const query = db.select().from(dailyGoals);
    
    if (userId) {
      query.where(
        and(
          eq(dailyGoals.userId, userId),
          gte(dailyGoals.date, startOfDay),
          lte(dailyGoals.date, endOfDay)
        )
      );
    } else {
      query.where(
        and(
          gte(dailyGoals.date, startOfDay),
          lte(dailyGoals.date, endOfDay)
        )
      );
    }
    
    return await query;
  }

  async createDailyGoal(insertGoal: InsertDailyGoal): Promise<DailyGoal> {
    const [goal] = await db
      .insert(dailyGoals)
      .values({
        ...insertGoal,
        userId: insertGoal.userId || 1, // Default to guest user
        description: insertGoal.description || null,
        progress: insertGoal.progress || 0,
        target: insertGoal.target || 100,
        completed: insertGoal.completed || 0,
      })
      .returning();
    return goal;
  }

  async updateDailyGoal(id: number, progress: number, completed: number): Promise<DailyGoal> {
    const [goal] = await db
      .update(dailyGoals)
      .set({ progress, completed })
      .where(eq(dailyGoals.id, id))
      .returning();
    return goal;
  }

  // User preferences
  async getUserPreferences(userId?: number): Promise<UserPreferences | undefined> {
    const targetUserId = userId || 1; // Default to guest user
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, targetUserId));
    return prefs || undefined;
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Try to update existing preferences
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (existingPrefs) {
      const [updatedPrefs] = await db
        .update(userPreferences)
        .set(preferences)
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(userPreferences)
        .values({
          userId,
          weatherLocation: preferences.weatherLocation || "Paris",
          theme: preferences.theme || "auto",
          notifications: preferences.notifications || 1,
          language: preferences.language || "fr",
        })
        .returning();
      return newPrefs;
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moodEntries: Map<number, MoodEntry>;
  private journalEntries: Map<number, JournalEntry>;
  private dailyGoals: Map<number, DailyGoal>;
  private userPreferences: Map<number, UserPreferences>;
  private currentUserId: number;
  private currentMoodId: number;
  private currentJournalId: number;
  private currentGoalId: number;
  private currentPrefsId: number;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.journalEntries = new Map();
    this.dailyGoals = new Map();
    this.userPreferences = new Map();
    this.currentUserId = 1;
    this.currentMoodId = 1;
    this.currentJournalId = 1;
    this.currentGoalId = 1;
    this.currentPrefsId = 1;
    
    // Create a default guest user for demo purposes
    const guestUser: User = {
      id: 1,
      email: "guest@moodaware.com",
      username: "guest",
      passwordHash: "",
      firstName: "Utilisateur",
      lastName: "Invité",
      profileImageUrl: null,
      isPremium: false,
      premiumExpiresAt: null,
      appPassword: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(1, guestUser);
    
    // Initialize with default preferences for guest user
    const defaultPrefs: UserPreferences = {
      id: 1,
      userId: 1,
      weatherLocation: "Paris",
      theme: "auto",
      notifications: 1,
      language: "fr"
    };
    this.userPreferences.set(1, defaultPrefs);
    this.currentUserId = 2; // Next user will get ID 2
  }

  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Mood entries
  async getMoodEntries(userId?: number, limit = 50): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values())
      .filter(entry => !userId || entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return entries;
  }

  async getMoodEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId && entry.timestamp >= startDate && entry.timestamp <= endDate)
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
      userId: insertEntry.userId || 1, // Default to guest user
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  // Journal entries
  async getJournalEntries(userId?: number, limit = 20): Promise<JournalEntry[]> {
    const entries = Array.from(this.journalEntries.values())
      .filter(entry => !userId || entry.userId === userId)
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
      userId: insertEntry.userId || 1, // Default to guest user
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  // Daily goals
  async getDailyGoals(userId?: number, date?: Date): Promise<DailyGoal[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const goals = Array.from(this.dailyGoals.values())
      .filter(goal => (!userId || goal.userId === userId) && goal.date >= startOfDay && goal.date < endOfDay);
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
      userId: insertGoal.userId || 1, // Default to guest user
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

  // User preferences
  async getUserPreferences(userId?: number): Promise<UserPreferences | undefined> {
    const targetUserId = userId || 1; // Default to guest user
    return this.userPreferences.get(targetUserId);
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existingPrefs = this.userPreferences.get(userId);
    
    if (existingPrefs) {
      const updatedPrefs = { ...existingPrefs, ...preferences };
      this.userPreferences.set(userId, updatedPrefs);
      return updatedPrefs;
    } else {
      const id = this.currentPrefsId++;
      const newPrefs: UserPreferences = {
        id,
        userId,
        weatherLocation: preferences.weatherLocation || "Paris",
        theme: preferences.theme || "auto",
        notifications: preferences.notifications || 1,
        language: preferences.language || "fr",
      };
      this.userPreferences.set(userId, newPrefs);
      return newPrefs;
    }
  }
}

export const storage = new DatabaseStorage();
