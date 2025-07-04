import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWeather } from "@/hooks/useWeather";
import { getCurrentTimeOfDay } from "@/lib/utils";
import type { MoodType } from "@/types";
import type { InsertJournalEntry, DailyGoal } from "@shared/schema";

interface DashboardCardsProps {
  currentMood: MoodType;
  timeOfDay: string;
}

const adviceData = {
  morning: {
    sunny: "Profite de cette belle matinée ensoleillée pour faire une petite promenade. L'air frais et la lumière naturelle vont booster ton humeur ! ☀️",
    cloudy: "Même si le ciel est nuageux, c'est le moment parfait pour une activité créative à l'intérieur. Peut-être dessiner ou écrire ?",
    rainy: "Le bruit de la pluie est apaisant. Prends un thé chaud et profite de ce moment cocooning pour te détendre.",
  },
  afternoon: {
    sunny: "L'après-midi est idéal pour une pause active. Que dirais-tu d'une petite marche ou d'un peu de jardinage ?",
    cloudy: "C'est le moment parfait pour te concentrer sur tes projets. La lumière tamisée aide à la concentration.",
    rainy: "L'après-midi pluvieux est parfait pour une activité manuelle ou pour rattraper tes lectures.",
  },
  evening: {
    sunny: "Profite de cette belle soirée pour un moment de détente en extérieur. Un coucher de soleil, ça fait du bien !",
    cloudy: "C'est le moment idéal pour préparer un bon repas et passer du temps avec tes proches.",
    rainy: "Une soirée pluvieuse parfaite pour un film ou un bon livre avec une boisson chaude.",
  },
  night: {
    sunny: "Profite de cette nuit claire pour admirer les étoiles et te détendre avant le coucher.",
    cloudy: "C'est le moment parfait pour te préparer au sommeil avec une routine relaxante.",
    rainy: "Le bruit de la pluie est apaisant pour dormir. Prépare-toi une tisane relaxante.",
  },
};

const musicSuggestions = {
  morning: [
    { title: "Morning Jazz", description: "Playlist énergisante", gradient: "from-yellow-400 to-orange-400" },
    { title: "Sunny Lo-Fi", description: "Détente productive", gradient: "from-blue-400 to-purple-400" },
  ],
  afternoon: [
    { title: "Afternoon Chill", description: "Concentration optimale", gradient: "from-green-400 to-blue-400" },
    { title: "Focus Flow", description: "Productivité zen", gradient: "from-purple-400 to-pink-400" },
  ],
  evening: [
    { title: "Evening Vibes", description: "Détente du soir", gradient: "from-pink-400 to-purple-400" },
    { title: "Sunset Chill", description: "Ambiance cosy", gradient: "from-orange-400 to-red-400" },
  ],
  night: [
    { title: "Night Calm", description: "Relaxation profonde", gradient: "from-indigo-400 to-purple-400" },
    { title: "Sleep Sounds", description: "Préparation au sommeil", gradient: "from-gray-400 to-blue-400" },
  ],
};

export default function DashboardCards({ currentMood, timeOfDay }: DashboardCardsProps) {
  const [journalText, setJournalText] = useState("");
  const queryClient = useQueryClient();
  const { data: weather } = useWeather();

  const { data: dailyGoals } = useQuery<DailyGoal[]>({
    queryKey: ["/api/daily-goals"],
  });

  const createJournalEntry = useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      const response = await apiRequest("POST", "/api/journal-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      setJournalText("");
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, progress }: { id: number; progress: number }) => {
      const response = await apiRequest("PATCH", `/api/daily-goals/${id}`, {
        progress,
        completed: progress >= 100 ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-goals"] });
    },
  });

  const handleJournalSave = () => {
    if (!journalText.trim()) return;

    const entry: InsertJournalEntry = {
      content: journalText,
      mood: currentMood,
      weatherData: weather,
    };

    createJournalEntry.mutate(entry);
  };

  const currentAdvice = adviceData[timeOfDay as keyof typeof adviceData]?.[weather?.condition as keyof typeof adviceData.morning] || 
                      adviceData[timeOfDay as keyof typeof adviceData]?.cloudy || 
                      "Prends un moment pour toi aujourd'hui. Tu le mérites !";

  const currentMusic = musicSuggestions[timeOfDay as keyof typeof musicSuggestions] || musicSuggestions.morning;

  const currentGoal = dailyGoals?.[0] || {
    id: 1,
    title: "15 minutes de focus profond",
    progress: 33,
    target: 100,
    completed: 0,
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Advice Card */}
      <div className="journal-card p-6 text-white">
        <div className="flex items-center mb-4">
          <div className="bg-yellow-400 rounded-full p-3 mr-4">
            <i className="fas fa-lightbulb text-white"></i>
          </div>
          <h3 className="text-xl font-semibold">Conseil du moment</h3>
        </div>
        <p className="text-white/90 mb-4">{currentAdvice}</p>
        <button className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium transition-colors">
          Nouveau conseil
        </button>
      </div>

      {/* Music Suggestions */}
      <div className="journal-card p-6 text-white">
        <div className="flex items-center mb-4">
          <div className="bg-green-400 rounded-full p-3 mr-4">
            <i className="fas fa-music text-white"></i>
          </div>
          <h3 className="text-xl font-semibold">Musique suggérée</h3>
        </div>
        <div className="space-y-3">
          {currentMusic.map((music, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
              <div className={`w-10 h-10 bg-gradient-to-br ${music.gradient} rounded-lg flex items-center justify-center`}>
                <i className="fas fa-play text-white text-sm"></i>
              </div>
              <div>
                <p className="font-medium">{music.title}</p>
                <p className="text-sm text-white/70">{music.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="journal-card p-6 text-white">
        <div className="flex items-center mb-4">
          <div className="bg-purple-400 rounded-full p-3 mr-4">
            <i className="fas fa-target text-white"></i>
          </div>
          <h3 className="text-xl font-semibold">Défi du jour</h3>
        </div>
        <div className="mb-4">
          <p className="text-white/90 mb-3">{currentGoal.title}</p>
          <div className="bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${currentGoal.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-white/70">{currentGoal.progress}% / {currentGoal.target}%</p>
        </div>
        <button 
          className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          onClick={() => updateGoal.mutate({ id: currentGoal.id, progress: Math.min(currentGoal.progress + 20, 100) })}
          disabled={updateGoal.isPending}
        >
          {currentGoal.progress >= 100 ? "Terminé !" : "Continuer"}
        </button>
      </div>

      {/* Journal Quick Entry */}
      <div className="journal-card p-6 text-white md:col-span-2">
        <div className="flex items-center mb-4">
          <div className="bg-pink-400 rounded-full p-3 mr-4">
            <i className="fas fa-book text-white"></i>
          </div>
          <h3 className="text-xl font-semibold">Journal personnel</h3>
        </div>
        <textarea 
          className="w-full bg-white/10 rounded-lg p-4 text-white placeholder-white/60 resize-none border-none focus:outline-none focus:ring-2 focus:ring-white/30" 
          rows={4}
          placeholder="Comment te sens-tu aujourd'hui ? Écris quelques lignes sur ton humeur, tes pensées..."
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-white/60">
            {journalText.length > 0 ? "Prêt à sauvegarder" : "Commence à écrire..."}
          </span>
          <button 
            className="bg-white/20 hover:bg-white/30 rounded-full px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            onClick={handleJournalSave}
            disabled={!journalText.trim() || createJournalEntry.isPending}
          >
            {createJournalEntry.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Weather Impact */}
      <div className="journal-card p-6 text-white">
        <div className="flex items-center mb-4">
          <div className="bg-blue-400 rounded-full p-3 mr-4">
            <i className="fas fa-cloud-sun text-white"></i>
          </div>
          <h3 className="text-xl font-semibold">Impact météo</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/90">Luminosité</span>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    weather?.condition === "sunny" ? (i < 5 ? "bg-yellow-400" : "bg-white/30") :
                    weather?.condition === "cloudy" ? (i < 3 ? "bg-yellow-400" : "bg-white/30") :
                    (i < 2 ? "bg-yellow-400" : "bg-white/30")
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/90">Énergie</span>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    weather?.condition === "sunny" ? (i < 5 ? "bg-green-400" : "bg-white/30") :
                    weather?.condition === "cloudy" ? (i < 3 ? "bg-green-400" : "bg-white/30") :
                    (i < 2 ? "bg-green-400" : "bg-white/30")
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-white/70 mt-3">
            {weather?.condition === "sunny" ? "Le soleil booste naturellement ton humeur ! Parfait pour des activités créatives." :
             weather?.condition === "rainy" ? "La pluie peut être apaisante. Profite de ce moment cocooning." :
             "Temps nuageux, parfait pour la concentration et la réflexion."}
          </p>
        </div>
      </div>
    </section>
  );
}
