"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Droplets, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { database } from "@/db";

const PRESETS = [100, 250, 500, 750, 1000];

export default function WaterIntake() {
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");

  // Subscribe to WatermelonDB water_logs for real-time reactivity
  useEffect(() => {
    if (!database) return;
    const sub = database.collections.get("water_logs").query().observe().subscribe(setWaterLogs);
    return () => sub.unsubscribe();
  }, []);

  // Filter today's entries reactively
  const todayEntries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return waterLogs.filter((e) => {
      const d = new Date(e.date);
      return d >= today;
    });
  }, [waterLogs]);

  const totalMl = useMemo(() => todayEntries.reduce((sum, e) => sum + (e.amountMl || 0), 0), [todayEntries]);
  const goalMl = 3000;
  const progress = Math.min((totalMl / goalMl) * 100, 100);

  const addWater = async (ml: number) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/water/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ amount_ml: ml }),
      });
      if (!res.ok) throw new Error("Failed to log water");

      const insertedId = await res.json();

      // Write to local WatermelonDB for instant reactivity
      try {
        if (database) {
          await database.write(async () => {
            await database!.get("water_logs").create((record: any) => {
              record._raw.id = insertedId;
              record.userId = "auth-user";
              record.amountMl = ml;
              record.date = new Date();
            });
          });
        }
      } catch (err) {
        console.error("Local DB insert skipped:", err);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entry: any) => {
    try {
      // Delete from API
      await fetch(`${API_BASE}/water/${entry.id}`, { method: "DELETE", headers: getAuthHeaders() });
      // Delete from local DB
      if (database) {
        await database.write(async () => {
          await entry.markAsDeleted();
        });
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <main className="flex flex-col p-6 min-h-screen bg-secondary/30">
      <header className="flex items-center justify-between mb-8 mt-2 pb-4 border-b">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Water Intake</h1>
        <div className="w-10" />
      </header>

      {/* Success Toast */}
      {isSaved && (
        <div className="fixed inset-x-4 top-24 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-sky-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-center gap-3">
            <CheckCircle2 size={24} />
            <span className="font-bold text-lg">Water logged!</span>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg mb-4">{error}</div>}

      {/* Progress Circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" />
            <circle
              cx="100" cy="100" r="85" fill="none"
              stroke="hsl(199, 89%, 48%)" strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets size={28} className="text-sky-500 mb-1" />
            <p className="text-3xl font-extrabold">{totalMl}</p>
            <p className="text-xs font-bold text-muted-foreground">/ {goalMl} ml</p>
          </div>
        </div>
      </div>

      {/* Quick Add Presets */}
      <section className="mb-8">
        <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3 ml-1">Quick Add</h2>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              disabled={isLoading}
              className="bg-background border rounded-2xl p-4 text-center hover:bg-sky-50 hover:border-sky-200 active:scale-95 transition-all"
            >
              <p className="font-extrabold text-lg">{ml >= 1000 ? `${ml / 1000}L` : `${ml}`}</p>
              <p className="text-xs font-bold text-muted-foreground">{ml < 1000 ? "ml" : ""}</p>
            </button>
          ))}
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="ml"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full h-full rounded-2xl border bg-background text-center font-bold text-lg px-2 outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        </div>
        {customAmount && (
          <Button onClick={() => { addWater(parseInt(customAmount) || 0); setCustomAmount(""); }} className="w-full mt-3 h-12 bg-sky-500 hover:bg-sky-600" disabled={isLoading}>
            <Plus size={18} className="mr-2" /> Add {customAmount} ml
          </Button>
        )}
      </section>

      {/* Today's Log */}
      {todayEntries.length > 0 && (
        <section>
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3 ml-1">Today&apos;s Log</h2>
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-background border rounded-2xl p-3 px-4">
                <div className="flex items-center gap-3">
                  <Droplets size={18} className="text-sky-500" />
                  <span className="font-bold">{entry.amountMl} ml</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => deleteEntry(entry)} className="text-muted-foreground hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
