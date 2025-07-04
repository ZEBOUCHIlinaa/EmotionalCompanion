import { useQuery } from "@tanstack/react-query";
import { getStartOfWeek, getEndOfWeek, getDayName, getMoodEmoji, getMoodColor } from "@/lib/utils";
import type { MoodEntry } from "@shared/schema";

export default function WeeklyRecap() {
  const currentDate = new Date();
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = getEndOfWeek(currentDate);

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries/range", startOfWeek.toISOString(), endOfWeek.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/mood-entries/range?startDate=${startOfWeek.toISOString()}&endDate=${endOfWeek.toISOString()}`);
      if (!response.ok) throw new Error("Failed to fetch mood entries");
      return response.json();
    },
  });

  // Group entries by day
  const entriesByDay = moodEntries.reduce((acc, entry) => {
    const dayKey = entry.timestamp.toString().split('T')[0];
    acc[dayKey] = acc[dayKey] || [];
    acc[dayKey].push(entry);
    return acc;
  }, {} as Record<string, MoodEntry[]>);

  // Calculate weekly stats
  const moodCounts = moodEntries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantMood = Object.entries(moodCounts).length > 0 
    ? Object.entries(moodCounts).reduce((a, b) => 
        moodCounts[a[0]] > moodCounts[b[0]] ? a : b
      )?.[0] || "happy"
    : "happy";

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  const getMoodHeight = (day: Date): number => {
    const dayKey = day.toISOString().split('T')[0];
    const dayEntries = entriesByDay[dayKey] || [];
    if (dayEntries.length === 0) return 20;
    
    // Map mood to height value
    const moodValues = { excited: 100, happy: 80, energetic: 90, calm: 60, sad: 30, anxious: 40 };
    const avgMood = dayEntries.reduce((sum, entry) => sum + (moodValues[entry.mood as keyof typeof moodValues] || 50), 0) / dayEntries.length;
    return Math.max(20, Math.min(100, avgMood));
  };

  const getMoodColor = (day: Date): string => {
    const dayKey = day.toISOString().split('T')[0];
    const dayEntries = entriesByDay[dayKey] || [];
    if (dayEntries.length === 0) return "bg-gray-400";
    
    const lastEntry = dayEntries[dayEntries.length - 1];
    const colorMap = {
      excited: "bg-yellow-400",
      happy: "bg-green-400",
      energetic: "bg-purple-400",
      calm: "bg-blue-400",
      sad: "bg-gray-400",
      anxious: "bg-red-400",
    };
    return colorMap[lastEntry.mood as keyof typeof colorMap] || "bg-gray-400";
  };

  return (
    <section className="journal-card p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-indigo-400 rounded-full p-3 mr-4">
            <i className="fas fa-chart-line text-white"></i>
          </div>
          <h3 className="text-2xl font-semibold">Récap de ta semaine</h3>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium transition-colors">
            7 jours
          </button>
          <button className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-medium transition-colors">
            30 jours
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Chart */}
        <div>
          <h4 className="text-lg font-medium mb-4">Évolution de ton humeur</h4>
          <div className="bg-white/10 rounded-xl p-4 h-64 flex items-end justify-between space-x-2">
            {weekDays.map((day, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className={`w-8 rounded-t-lg ${getMoodColor(day)}`}
                  style={{ height: `${getMoodHeight(day)}px` }}
                ></div>
                <span className="text-xs text-white/70">{getDayName(day)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mood Stats */}
        <div>
          <h4 className="text-lg font-medium mb-4">Statistiques</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getMoodEmoji(dominantMood as any)}</span>
                <span>Humeur dominante</span>
              </div>
              <span className="text-green-400 font-semibold capitalize">{dominantMood}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📈</span>
                <span>Entrées cette semaine</span>
              </div>
              <span className="text-blue-400 font-semibold">{moodEntries.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <span>Jours actifs</span>
              </div>
              <span className="text-purple-400 font-semibold">{Object.keys(entriesByDay).length}/7</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⭐</span>
                <span>Meilleure humeur</span>
              </div>
              <span className="text-yellow-400 font-semibold">
                {moodEntries.find(e => e.mood === "excited" || e.mood === "happy") ? "Très bien" : "Bien"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
