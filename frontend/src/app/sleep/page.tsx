"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Square, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";

export default function SleepTracker() {
  const [activeTab, setActiveTab] = useState<"toggle" | "manual">("toggle");
  
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStart, setSleepStart] = useState<Date | null>(null);
  const [loggedHours, setLoggedHours] = useState<number | null>(null);
  
  const [duration, setDuration] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  const saveSleepLog = async (hours: number): Promise<boolean> => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/sleep/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ duration_hours: hours }),
      });
      if (!res.ok) throw new Error("Failed to save sleep log");
      setLoggedHours(hours);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setLoggedHours(null);
      }, 5000);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const handleToggle = async () => {
    if (!isSleeping) {
      setIsSleeping(true);
      setSleepStart(new Date());
      setIsSaved(false);
      setLoggedHours(null);
    } else {
      if (sleepStart) {
        const elapsed = (Date.now() - sleepStart.getTime()) / (1000 * 60 * 60);
        const saved = await saveSleepLog(parseFloat(elapsed.toFixed(2)));
        if (saved) {
          setIsSleeping(false);
          setSleepStart(null);
        }
      }
    }
  };

  const handleManualSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!duration) {
      setError("Please enter a sleep duration.");
      return;
    }
    
    const saved = await saveSleepLog(parseFloat(duration));
    if (saved) setDuration("");
  };

  return (
    <main className="flex flex-col px-8 py-6 min-h-screen">
      <header className="flex items-center justify-between mb-10 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Sleep Tracker</h1>
        <div className="w-10" />
      </header>

      {/* Tab Switcher */}
      <div className="flex border-b border-border mb-10">
        <button 
          onClick={() => setActiveTab("toggle")}
          className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 ${activeTab === "toggle" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          Auto Toggle
        </button>
        <button 
          onClick={() => setActiveTab("manual")}
          className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 ${activeTab === "manual" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          Manual Log
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {isSaved && (
          <div className="fixed inset-x-4 top-20 z-50 max-w-md mx-auto">
             <div className="bg-primary text-primary-foreground p-4 rounded-2xl flex items-center justify-center gap-2">
               <CheckCircle2 size={20} strokeWidth={1.5} />
               <span className="font-medium text-sm">
                 {loggedHours !== null ? `Logged ${loggedHours.toFixed(1)} hours` : "Sleep logged"}
               </span>
             </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl mb-4">{error}</div>
        )}

        {activeTab === "toggle" ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-16">
            <div className={`w-52 h-52 rounded-full flex items-center justify-center transition-all duration-500 ${isSleeping ? 'bg-primary text-primary-foreground' : 'border-2 border-border text-muted-foreground'}`}>
              <button 
                onClick={handleToggle}
                className="flex flex-col items-center justify-center w-full h-full gap-3 focus:outline-none rounded-full"
              >
                {isSleeping ? (
                  <>
                    <Square size={40} strokeWidth={1.5} className="text-primary-foreground/80" />
                    <span className="font-medium text-xs tracking-widest uppercase text-primary-foreground/80">Wake Up</span>
                  </>
                ) : (
                  <>
                    <Moon size={40} strokeWidth={1.5} />
                    <span className="font-medium text-xs tracking-widest uppercase">Go to Sleep</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-10 text-center h-16">
              {isSleeping && sleepStart ? (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Fell asleep at</p>
                  <p className="text-xl font-semibold mt-1">
                    {sleepStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm font-medium max-w-[250px] leading-relaxed">
                  Tap the moon when you get in bed. Tap it again when you wake up.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <form onSubmit={handleManualSave} className="space-y-6 flex-1 flex flex-col">
              <div className="flex flex-col items-center text-center gap-3 py-8">
                <Clock size={36} strokeWidth={1.5} className="text-muted-foreground mb-2" />
                <h2 className="font-semibold text-base">Forgot to toggle?</h2>
                <p className="text-muted-foreground text-sm max-w-[250px] leading-relaxed">
                  No worries. Enter your total sleep duration manually below.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="sleep-duration" className="text-xs font-medium text-muted-foreground ml-1">
                  Duration (hours)
                </label>
                <Input 
                  id="sleep-duration"
                  type="number" 
                  step="0.5"
                  placeholder="e.g. 7.5" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="text-base font-medium h-14"
                />
              </div>

              <div className="pt-4 pb-6 mt-auto">
                <Button type="submit" className="w-full h-13">
                  Done
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
