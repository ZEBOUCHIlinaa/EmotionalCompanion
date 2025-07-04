import { useMutation, useQuery } from "@tanstack/react-query";
import { exportMoodData } from "@/lib/utils";
import type { MoodEntry, JournalEntry } from "@shared/schema";

export default function Footer() {
  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  const { data: journalEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });

  const handleExportData = () => {
    exportMoodData(moodEntries, journalEntries);
  };

  return (
    <footer className="mt-16 p-8 glass-effect">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <button className="text-white/80 hover:text-white transition-colors">
              <i className="fas fa-cog mr-2"></i>
              Paramètres
            </button>
            <button 
              className="text-white/80 hover:text-white transition-colors"
              onClick={handleExportData}
            >
              <i className="fas fa-download mr-2"></i>
              Exporter mes données
            </button>
            <button className="text-white/80 hover:text-white transition-colors">
              <i className="fas fa-palette mr-2"></i>
              Thèmes
            </button>
          </div>
          <div className="text-white/60 text-sm">
            MoodAware © 2024 - Ton bien-être, notre priorité
          </div>
        </div>
      </div>
    </footer>
  );
}
