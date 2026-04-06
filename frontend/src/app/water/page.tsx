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

  useEffect(() => {
    if (!database) return;
    const sub = database.collections.get("water_logs").query().observe().subscribe(setWaterLogs);
    return () => sub.unsubscribe();
  }, []);

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
      await fetch(`${API_BASE}/water/${entry.id}`, { method: "DELETE", headers: getAuthHeaders() });
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
    <main className="flex flex-col px-8 py-6 min-h-screen">
      <header className="flex items-center justify-between mb-10 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Water Intake</h1>
        <div className="w-10" />
      </header>

      {isSaved && (
        <div className="fixed inset-x-4 top-20 z-50 max-w-md mx-auto">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle2 size={20} strokeWidth={1.5} />
            <span className="font-medium text-sm">Water logged</span>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl mb-4">{error}</div>}

      {/* Progress Circle */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
            <circle
              cx="100" cy="100" r="85" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold">{totalMl}</p>
            <p className="text-xs font-medium text-muted-foreground">/ {goalMl} ml</p>
          </div>
        </div>
      </div>

      {/* Quick Add Presets */}
      <section className="mb-10">
        <h2 className="text-xs font-medium text-muted-foreground mb-3 ml-1">Quick Add</h2>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              disabled={isLoading}
              className="border border-border rounded-xl p-4 text-center hover:border-primary active:opacity-80 transition-all"
            >
              <p className="font-semibold text-base">{ml >= 1000 ? `${ml / 1000}L` : `${ml}`}</p>
              <p className="text-xs font-medium text-muted-foreground">{ml < 1000 ? "ml" : ""}</p>
            </button>
          ))}
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="ml"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full h-full rounded-xl border border-border bg-transparent text-center font-medium text-base px-2 outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        {customAmount && (
          <Button onClick={() => { addWater(parseInt(customAmount) || 0); setCustomAmount(""); }} className="w-full mt-3 h-12 bg-primary hover:opacity-90" disabled={isLoading}>
            <Plus size={16} className="mr-2" /> Add {customAmount} ml
          </Button>
        )}
      </section>

      {/* Today's Log */}
      {todayEntries.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-3 ml-1">Today&apos;s Log</h2>
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <Droplets size={16} strokeWidth={1.5} className="text-muted-foreground" />
                  <span className="font-medium text-sm">{entry.amountMl} ml</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => deleteEntry(entry)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                    <Trash2 size={14} strokeWidth={1.5} />
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
