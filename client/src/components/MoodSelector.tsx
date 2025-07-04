import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWeather } from "@/hooks/useWeather";
import { getCurrentTimeOfDay, getMoodEmoji, getMoodLabel } from "@/lib/utils";
import type { MoodType } from "@/types";
import type { InsertMoodEntry } from "@shared/schema";

interface MoodSelectorProps {
  currentMood: MoodType;
  onMoodChange: (mood: MoodType) => void;
}

const moodOptions: Array<{ id: MoodType; position: string }> = [
  { id: "excited", position: "top-0 left-1/2 transform -translate-x-1/2 -translate-y-8" },
  { id: "happy", position: "top-8 right-0 transform translate-x-4" },
  { id: "calm", position: "bottom-8 right-0 transform translate-x-4" },
  { id: "sad", position: "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8" },
  { id: "anxious", position: "bottom-8 left-0 transform -translate-x-4" },
  { id: "energetic", position: "top-8 left-0 transform -translate-x-4" },
];

export default function MoodSelector({ currentMood, onMoodChange }: MoodSelectorProps) {
  const queryClient = useQueryClient();
  const { data: weather } = useWeather();
  
  const createMoodEntry = useMutation({
    mutationFn: async (data: InsertMoodEntry) => {
      const response = await apiRequest("POST", "/api/mood-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
    },
  });

  const handleMoodSelect = (mood: MoodType) => {
    onMoodChange(mood);
    
    // Create mood entry
    const moodEntry: InsertMoodEntry = {
      mood,
      emoji: getMoodEmoji(mood),
      note: null,
      weatherData: weather,
      timeOfDay: getCurrentTimeOfDay(),
    };

    createMoodEntry.mutate(moodEntry);
  };

  return (
    <section className="text-center py-8">
      <h2 className="text-3xl font-bold text-white mb-2">Comment te sens-tu aujourd'hui ?</h2>
      <p className="text-white/80 mb-8">Choisis ton humeur pour personnaliser ton expérience</p>
      
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="mood-wheel w-64 h-64 rounded-full p-8 flex items-center justify-center shadow-2xl floating-animation">
            <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
              <span className="text-4xl">{getMoodEmoji(currentMood)}</span>
            </div>
          </div>
          
          {/* Mood Options */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {moodOptions.map((option) => (
                <button
                  key={option.id}
                  className={`absolute ${option.position} pointer-events-auto bg-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform ${
                    currentMood === option.id ? "ring-4 ring-blue-400" : ""
                  }`}
                  onClick={() => handleMoodSelect(option.id)}
                  disabled={createMoodEntry.isPending}
                >
                  <span className="text-2xl">{getMoodEmoji(option.id)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
