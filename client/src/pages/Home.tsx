import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import MoodSelector from "@/components/MoodSelector";
import DashboardCards from "@/components/DashboardCards";
import WeeklyRecap from "@/components/WeeklyRecap";
import RecentEntries from "@/components/RecentEntries";
import Footer from "@/components/Footer";

export default function Home() {
  const { timeOfDay, currentMood, theme, updateMood } = useTheme();

  return (
    <div className={`min-h-screen theme-transition ${theme.bg}`}>
      <Header currentMood={currentMood} />
      
      <main className="max-w-6xl mx-auto p-4 space-y-8">
        <MoodSelector 
          currentMood={currentMood} 
          onMoodChange={updateMood}
        />
        
        <DashboardCards 
          currentMood={currentMood} 
          timeOfDay={timeOfDay}
        />
        
        <WeeklyRecap />
        
        <RecentEntries />
      </main>
      
      <Footer />
    </div>
  );
}
