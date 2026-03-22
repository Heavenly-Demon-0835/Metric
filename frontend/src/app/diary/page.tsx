"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Activity, Apple, Moon } from "lucide-react";

export default function Diary() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Basic date manipulation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust JS getDay() where 0 is Sunday to make Monday=0, Sunday=6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const activeDays = [3, 5, 8, 12, 14, 15, 18, 22, 23, 24]; // Dummy data
  const [selectedDay, setSelectedDay] = useState<number | null>(24);

  const handleView = () => {
    alert("Detailed entry view will be implemented along with backend sync in Phase 2!");
  };

  return (
    <main className="flex flex-col min-h-screen bg-secondary/30 pb-20">
      <header className="flex items-center justify-between p-6 pb-2 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Timeline Diary</h1>
        <div className="w-10 text-primary font-bold text-sm text-right">Today</div>
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
            const hasActivity = activeDays.includes(d);
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
        <h3 className="text-xl font-extrabold mb-6">Entries {selectedDay ? `on ${selectedDay}th` : ''}</h3>
        
        {selectedDay && activeDays.includes(selectedDay) ? (
          <div className="space-y-4">
            
            {/* Workout Entry item */}
            <button onClick={handleView} className="w-full text-left flex items-center p-4 rounded-3xl border bg-secondary/30 hover:bg-secondary transition-colors group">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Activity size={24} />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-bold">Strength Training</h4>
                <p className="text-sm text-muted-foreground">3 Exercises • 75 mins</p>
              </div>
              <div className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                View
              </div>
            </button>

            {/* Diet Entry item */}
            <button onClick={handleView} className="w-full text-left flex items-center p-4 rounded-3xl border bg-secondary/30 hover:bg-secondary transition-colors group">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Apple size={24} />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-bold">Chicken & Rice</h4>
                <p className="text-sm text-muted-foreground">Lunch • 650 kcal</p>
              </div>
              <div className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                View
              </div>
            </button>

            {/* Sleep Entry item */}
            <button onClick={handleView} className="w-full text-left flex items-center p-4 rounded-3xl border bg-secondary/30 hover:bg-secondary transition-colors group">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Moon size={24} />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-bold">Night Sleep</h4>
                <p className="text-sm text-muted-foreground">7.5 hours duration</p>
              </div>
              <div className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                View
              </div>
            </button>

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
