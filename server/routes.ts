import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { weatherService } from "./services/weather";
import { insertMoodEntrySchema, insertJournalEntrySchema, insertDailyGoalSchema, insertUserPreferencesSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Weather API
  app.get("/api/weather", async (req, res) => {
    try {
      const city = req.query.city as string || "Paris";
      const weather = await weatherService.getCurrentWeather(city);
      res.json(weather);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Mood entries API
  app.get("/api/mood-entries", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getMoodEntries(limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  app.get("/api/mood-entries/range", async (req, res) => {
    try {
      const { startDate, endDate, userId } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to guest user
      const entries = await storage.getMoodEntriesByDateRange(
        userIdNum,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries by date range" });
    }
  });

  app.post("/api/mood-entries", async (req, res) => {
    try {
      const data = insertMoodEntrySchema.parse(req.body);
      const entry = await storage.createMoodEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid mood entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create mood entry" });
      }
    }
  });

  // Journal entries API
  app.get("/api/journal-entries", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getJournalEntries(limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal-entries", async (req, res) => {
    try {
      const data = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid journal entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create journal entry" });
      }
    }
  });

  // Daily goals API
  app.get("/api/daily-goals", async (req, res) => {
    try {
      const { date, userId } = req.query;
      const targetDate = date ? new Date(date as string) : undefined;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to guest user
      const goals = await storage.getDailyGoals(userIdNum, targetDate);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily goals" });
    }
  });

  app.post("/api/daily-goals", async (req, res) => {
    try {
      const data = insertDailyGoalSchema.parse(req.body);
      const goal = await storage.createDailyGoal(data);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid daily goal data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create daily goal" });
      }
    }
  });

  app.patch("/api/daily-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { progress, completed } = req.body;
      
      if (typeof progress !== "number" || typeof completed !== "number") {
        return res.status(400).json({ error: "Progress and completed must be numbers" });
      }
      
      const goal = await storage.updateDailyGoal(id, progress, completed);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update daily goal" });
    }
  });

  // User preferences API
  app.get("/api/preferences", async (req, res) => {
    try {
      const { userId } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to guest user
      const preferences = await storage.getUserPreferences(userIdNum);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.patch("/api/preferences", async (req, res) => {
    try {
      const { userId } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to guest user
      const data = insertUserPreferencesSchema.partial().parse(req.body);
      const preferences = await storage.updateUserPreferences(userIdNum, data);
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid preferences data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update preferences" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
