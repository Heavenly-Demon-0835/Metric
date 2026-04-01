"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, Trash2, CheckCircle2, Circle, Plus, X } from "lucide-react";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import ProgressRing from "@/components/ProgressRing";
import GoalSetter from "@/components/GoalSetter";
import { HamburgerButton } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { database } from "@/db";

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

const GOAL_META: Record<string, { icon: string; color: string; unit: string; label: string; link: string }> = {
  calories: { icon: "🔥", color: "hsl(262, 83%, 58%)", unit: "kcal", label: "Calories", link: "/diet/new" },
  protein: { icon: "💪", color: "hsl(217, 91%, 60%)", unit: "g", label: "Protein", link: "/diet/new" },
  water: { icon: "💧", color: "hsl(199, 89%, 48%)", unit: "ml", label: "Water", link: "/water" },
  workout: { icon: "🏋️", color: "hsl(262, 83%, 58%)", unit: "sessions", label: "Workouts", link: "/workouts/new" },
};

const DEFAULT_STANDARDS = [
  { id: "vitamins", text: "Take Vitamins", done: false },
  { id: "steps", text: "Hit 10k Steps", done: false },
  { id: "sleep8", text: "8 Hours Sleep", done: false },
];

export default function PlannerPage() {
  const router = useRouter();

  // WatermelonDB reactive state
  const [goals, setGoals] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily checklist — persisted in localStorage
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  // Auth check
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.replace("/auth/login"); return; }
  }, [router]);

  // Subscribe to WatermelonDB observables for real-time reactivity
  useEffect(() => {
    if (!database) { setLoading(false); return; }

    const subG = database.collections.get("daily_goals").query().observe().subscribe(setGoals);
    const subD = database.collections.get("diet").query().observe().subscribe(setDiets);
    const subW = database.collections.get("water_logs").query().observe().subscribe(setWaterLogs);
    const subWk = database.collections.get("workouts").query().observe().subscribe(setWorkouts);

    setLoading(false);

    return () => {
      subG.unsubscribe();
      subD.unsubscribe();
      subW.unsubscribe();
      subWk.unsubscribe();
    };
  }, []);

  // Load checklist from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`planner_checklist_${today}`);
    if (stored) {
      setChecklist(JSON.parse(stored));
    } else {
      setChecklist(DEFAULT_STANDARDS.map((s) => ({ ...s })));
    }
  }, []);

  // Persist checklist
  useEffect(() => {
    if (checklist.length > 0) {
      const today = new Date().toDateString();
      localStorage.setItem(`planner_checklist_${today}`, JSON.stringify(checklist));
    }
  }, [checklist]);

  // Compute today's progress reactively from observed WatermelonDB data
  const progress = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cal = 0, prot = 0, wat = 0, wrk = 0;

    for (const d of diets) {
      if (new Date(d.date) >= today) {
        cal += d.calories || 0;
        prot += d.proteinG || 0;
      }
    }

    for (const w of waterLogs) {
      if (new Date(w.date) >= today) {
        wat += w.amountMl || 0;
      }
    }

    for (const w of workouts) {
      if (new Date(w.date) >= today) wrk++;
    }

    return { calories: cal, protein: prot, water: wat, workouts: wrk };
  }, [diets, waterLogs, workouts]);

  const deleteGoal = async (id: string) => {
    // Delete from API
    await fetch(`${API_BASE}/goals/${id}`, { method: "DELETE", headers: getAuthHeaders() }).catch(() => {});
    // Delete from local DB
    try {
      if (database) {
        await database.write(async () => {
          const record = await database!.get("daily_goals").find(id);
          await record.markAsDeleted();
        });
      }
    } catch (err) {
      console.error("Local delete failed:", err);
    }
  };

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, done: !c.done } : c));
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setChecklist((prev) => [...prev, { id: Date.now().toString(), text: newItem.trim(), done: false }]);
    setNewItem("");
  };

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((c) => c.id !== id));
  };

  const getProgress = (metric: string): number => {
    switch (metric) {
      case "calories": return progress.calories;
      case "protein": return progress.protein;
      case "water": return progress.water;
      case "workout": return progress.workouts;
      default: return 0;
    }
  };

  // Refresh callback for GoalSetter — no-op since we're reactive now
  const onGoalCreated = () => {};

  return (
    <main className="flex flex-col min-h-screen pb-8">
      <div className="bg-primary/10 p-6 pb-8 rounded-b-[2rem]">
        <header className="flex items-center justify-between mt-2 mb-6">
          <HamburgerButton />
          <Link href="/dashboard" className="text-primary text-sm font-bold hover:underline">
            Dashboard
          </Link>
        </header>

        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform rotate-[-8deg] mb-2">
            <Target size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Daily Planner</h1>
          <p className="text-muted-foreground font-medium text-sm text-center max-w-[280px]">
            Define your intent. Track your execution.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 mt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="h-24 bg-secondary rounded-2xl animate-pulse" />))}
          </div>
        ) : (
          <>
            {/* === METRIC GOALS === */}
            {goals.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  Metric Targets
                </h2>
                {goals.map((goal) => {
                  const meta = GOAL_META[goal.metricType];
                  if (!meta) return null;
                  const cur = getProgress(goal.metricType);
                  const pct = Math.min((cur / (goal.targetValue || 1)) * 100, 100);
                  const done = pct >= 100;

                  return (
                    <div key={goal.id} className={`bg-card border rounded-2xl p-4 flex items-center gap-4 ${done ? "border-green-500/30" : ""}`}>
                      <ProgressRing current={cur} target={goal.targetValue} color={done ? "hsl(142,71%,45%)" : meta.color} label="" size={56} strokeWidth={5} />
                      <div className="flex-1 min-w-0">
                        <Link href={meta.link}>
                          <p className="font-bold text-sm flex items-center gap-1.5">
                            {meta.icon} {meta.label}
                            {done && <span className="text-green-500 text-xs">✓</span>}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">{Math.round(cur)} / {goal.targetValue} {meta.unit}</p>
                        <div className="h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: done ? "hsl(142,71%,45%)" : meta.color }} />
                        </div>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="p-2 hover:bg-red-100 text-red-400 rounded-lg transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            <GoalSetter onCreated={onGoalCreated} />

            {/* === DAILY STANDARDS CHECKLIST === */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Daily Standards
              </h2>

              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <button onClick={() => toggleCheck(item.id)} className="shrink-0">
                    {item.done ? (
                      <CheckCircle2 size={22} className="text-green-500" />
                    ) : (
                      <Circle size={22} className="text-muted-foreground/40" />
                    )}
                  </button>
                  <span className={`text-sm font-medium flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                    {item.text}
                  </span>
                  <button onClick={() => removeChecklistItem(item.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-400 rounded transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Add custom standard */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a standard..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" ? (e.preventDefault(), addChecklistItem()) : null}
                  className="h-10 text-sm"
                />
                <button onClick={addChecklistItem} className="shrink-0 h-10 w-10 bg-secondary hover:bg-secondary/80 rounded-xl flex items-center justify-center transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
