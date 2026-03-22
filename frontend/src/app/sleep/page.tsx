"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Square, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SleepTracker() {
  const [activeTab, setActiveTab] = useState<"toggle" | "manual">("toggle");
  
  // Toggle State
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStart, setSleepStart] = useState<Date | null>(null);
  
  // Manual State
  const [duration, setDuration] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleToggle = () => {
    if (!isSleeping) {
      setIsSleeping(true);
      setSleepStart(new Date());
      setIsSaved(false);
    } else {
      setIsSleeping(false);
      setSleepStart(null);
      // Show success message inline instead of throwing out to dashboard
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    }
  };

  const handleManualSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!duration) {
      alert("Please enter a sleep duration.");
      return;
    }
    
    // Show success message inline
    setIsSaved(true);
    setDuration("");
    setTimeout(() => setIsSaved(false), 4000);
  };

  return (
    <main className="flex flex-col p-6 min-h-screen bg-secondary/30">
      <header className="flex items-center justify-between mb-8 mt-2 pb-4 border-b">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Sleep Tracker</h1>
        <div className="w-10" />
      </header>

      <div className="flex bg-secondary p-1 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab("toggle")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "toggle" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Auto Toggle
        </button>
        <button 
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Manual Log
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Success Modal/Toast overlay */}
        {isSaved && (
          <div className="fixed inset-x-4 top-24 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
             <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl flex items-center justify-center gap-3">
               <CheckCircle2 size={24} />
               <span className="font-bold text-lg">Sleep safely logged!</span>
             </div>
          </div>
        )}

        {activeTab === "toggle" ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
            <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-700 shadow-xl ${isSleeping ? 'bg-primary text-primary-foreground scale-105 shadow-primary/30' : 'bg-background text-primary border'}`}>
              <button 
                onClick={handleToggle}
                className="flex flex-col items-center justify-center w-full h-full gap-4 focus:outline-none rounded-full"
              >
                {isSleeping ? (
                  <>
                    <Square size={56} className="fill-current animate-pulse text-primary-foreground/80" />
                    <span className="font-bold tracking-widest uppercase opacity-90 text-primary-foreground">Wake Up</span>
                  </>
                ) : (
                  <>
                    <Moon size={56} className="fill-current text-primary" />
                    <span className="font-bold tracking-widest uppercase opacity-80 text-primary">Go to Sleep</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-12 text-center h-20">
              {isSleeping && sleepStart ? (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-muted-foreground font-bold tracking-tight">Fell asleep at</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">
                    {sleepStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground font-medium max-w-[250px]">
                  Tap the moon when you get in bed. Tap it again when you wake up.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in flex-1 flex flex-col">
            <form onSubmit={handleManualSave} className="space-y-6 flex-1 flex flex-col">
              <div className="bg-background border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-4 py-8">
                <div className="p-4 bg-primary/10 text-primary rounded-full mb-2">
                  <Clock size={48} />
                </div>
                <h2 className="font-bold text-lg text-foreground">Forgot to toggle?</h2>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                  No worries. Enter your total sleep duration manually below.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 ml-1 text-foreground">
                  <Moon size={18} className="text-primary" /> Duration (hours)
                </label>
                <Input 
                  type="number" 
                  step="0.5"
                  placeholder="e.g. 7.5" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="text-lg font-bold h-16 bg-background"
                />
              </div>

              <div className="pt-8 mt-auto">
                {/* Changed to button type to avoid silent HTML5 validation blocks on mobile */}
                <Button type="button" onClick={() => handleManualSave()} className="w-full h-16 text-lg shadow-xl shadow-primary/20 transition-colors">
                  Submit Sleep Log
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
