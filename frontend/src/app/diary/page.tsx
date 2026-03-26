"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Activity, Apple, Moon, Dumbbell } from "lucide-react";
import { API_BASE, getAuthHeaders } from "@/lib/api";

interface EntryItem {
  type: "workout" | "cardio" | "sleep" | "diet";
  title: string;
  subtitle: string;
  date: string;
}

export default function Diary() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  // Fetch all entries for this month
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    const headers = getAuthHeaders();
    const all: EntryItem[] = [];

    try {
      const [workouts, cardio, sleep, diet] = await Promise.all([
        fetch(`${API_BASE}/workouts/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/cardio/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/sleep/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/diet/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      for (const w of workouts) {
        all.push({
          type: "workout",
          title: w.exercises?.length ? `${w.exercises.length} Exercise${w.exercises.length > 1 ? 's' : ''}` : "Workout",
          subtitle: w.exercises?.map((e: any) => e.name).join(", ") || "Strength Training",
          date: w.date,
        });
      }

      for (const c of cardio) {
        all.push({
          type: "cardio",
          title: c.activity_type || "Cardio",
          subtitle: `${c.duration_minutes} min • ${c.distance_km} km`,
          date: c.date,
        });
      }

      for (const s of sleep) {
        all.push({
          type: "sleep",
          title: "Sleep",
          subtitle: `${s.duration_hours} hours`,
          date: s.date,
        });
      }

      for (const d of diet) {
        all.push({
          type: "diet",
          title: d.meal_name || "Meal",
          subtitle: `${d.calories} kcal`,
          date: d.date,
        });
      }
    } catch {
      // Silently handle — entries will be empty
    }

    setEntries(all);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Compute which days have entries this month
  const activeDays = new Set<number>();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      activeDays.add(d.getDate());
    }
  });

  // Filter entries for selected day
  const selectedEntries = selectedDay
    ? entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
      })
    : [];

  const getIcon = (type: string) => {
    switch (type) {
      case "workout": return <Dumbbell size={24} />;
      case "cardio": return <Activity size={24} />;
      case "sleep": return <Moon size={24} />;
      case "diet": return <Apple size={24} />;
      default: return <Activity size={24} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "workout": return "bg-primary/10 text-primary";
      case "cardio": return "bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)]";
      case "sleep": return "bg-indigo-500/10 text-indigo-500";
      case "diet": return "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]";
      default: return "bg-primary/10 text-primary";
    }
  };

  const ordinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-secondary/30 pb-20">
      <header className="flex items-center justify-between p-6 pb-2 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Timeline Diary</h1>
        <button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDay(new Date().getDate());
          }}
          className="w-10 text-primary font-bold text-sm text-right"
        >
          Today
        </button>
      </header>

      {/* Calendar Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="h-10 w-10 bg-background rounded-full border shadow-sm flex items-center justify-center hover:bg-secondary">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="h-10 w-10 bg-background rounded-full border shadow-sm flex items-center justify-center hover:bg-secondary">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Calendar */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center w-full">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-xs font-bold text-muted-foreground uppercase">{d}</div>
          ))}
          
          {/* Offsets */}
          {Array.from({length: startOffset}).map((_, i) => (
            <div key={`offset-${i}`}></div>
          ))}
          
          {daysArray.map(d => {
            const hasActivity = activeDays.has(d);
            const isSelected = selectedDay === d;
            
            return (
              <button 
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`relative flex flex-col items-center justify-center h-[52px] rounded-2xl transition-all font-bold text-sm
                  ${isSelected ? 'bg-primary text-primary-foreground shadow-md scale-105 z-10' : 'bg-background hover:bg-secondary text-foreground'}
                  ${hasActivity && !isSelected ? 'border border-primary/20' : ''}`}
              >
                {d}
                {hasActivity && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-primary'}`} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Entries for selected day */}
      <div className="flex-1 bg-background rounded-t-[2.5rem] border-t p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-24 h-full min-h-[400px]">
        <h3 className="text-xl font-extrabold mb-6">
          {selectedDay ? `Entries on ${selectedDay}${ordinalSuffix(selectedDay)}` : 'Select a day'}
        </h3>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-muted-foreground">Loading entries...</p>
          </div>
        ) : selectedEntries.length > 0 ? (
          <div className="space-y-4">
            {selectedEntries.map((entry, idx) => (
              <div key={idx} className="w-full text-left flex items-center p-4 rounded-3xl border bg-secondary/30">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${getColor(entry.type)}`}>
                  {getIcon(entry.type)}
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-bold">{entry.title}</h4>
                  <p className="text-sm text-muted-foreground">{entry.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <span className="text-4xl mb-4">🤫</span>
            <p className="font-bold text-muted-foreground">No entries for this day.</p>
          </div>
        )}
      </div>
    </main>
  );
}
