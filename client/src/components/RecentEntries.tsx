import { useQuery } from "@tanstack/react-query";
import { formatRelativeTime, getMoodEmoji, getMoodColor, getMoodLabel } from "@/lib/utils";
import type { JournalEntry } from "@shared/schema";

export default function RecentEntries() {
  const { data: journalEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
    queryFn: async () => {
      const response = await fetch("/api/journal-entries?limit=10");
      if (!response.ok) throw new Error("Failed to fetch journal entries");
      return response.json();
    },
  });

  if (journalEntries.length === 0) {
    return (
      <section className="journal-card p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-rose-400 rounded-full p-3 mr-4">
              <i className="fas fa-history text-white"></i>
            </div>
            <h3 className="text-2xl font-semibold">Entrées récentes</h3>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-white/60 mb-4">
            <i className="fas fa-book text-4xl mb-4"></i>
            <p className="text-lg">Aucune entrée de journal pour le moment</p>
            <p className="text-sm">Commence à écrire pour voir tes entrées ici !</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="journal-card p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-rose-400 rounded-full p-3 mr-4">
            <i className="fas fa-history text-white"></i>
          </div>
          <h3 className="text-2xl font-semibold">Entrées récentes</h3>
        </div>
        <button className="bg-white/20 hover:bg-white/30 rounded-full px-6 py-2 text-sm font-medium transition-colors">
          Voir tout
        </button>
      </div>
      
      <div className="space-y-4">
        {journalEntries.map((entry) => (
          <div 
            key={entry.id} 
            className={`bg-white/10 rounded-xl p-4 border-l-4 ${getMoodColor(entry.mood as any)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getMoodEmoji(entry.mood as any)}</span>
                <span className="font-medium">{getMoodLabel(entry.mood as any)}</span>
              </div>
              <span className="text-sm text-white/60">
                {formatRelativeTime(new Date(entry.timestamp))}
              </span>
            </div>
            <p className="text-white/90 text-sm">{entry.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
