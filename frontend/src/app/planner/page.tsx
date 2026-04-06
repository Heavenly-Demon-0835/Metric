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
  calories: { icon: "🔥", color: "hsl(255, 100%, 68%)", unit: "kcal", label: "Calories", link: "/diet/new" },
  protein: { icon: "💪", color: "#10b981", unit: "g", label: "Protein", link: "/diet/new" },
  water: { icon: "💧", color: "#0ea5e9", unit: "ml", label: "Water", link: "/water" },
  workout: { icon: "🏋️", color: "hsl(255, 100%, 68%)", unit: "sessions", label: "Workouts", link: "/workouts/new" },
};

export default function PlannerPage() {
  const router = useRouter();

  const [goals, setGoals] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.replace("/auth/login"); return; }
  }, [router]);

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

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`planner_checklist_${today}`);
    if (stored) {
      setChecklist(JSON.parse(stored));
    } else {
      setChecklist([]);
    }
  }, []);

  useEffect(() => {
    if (checklist.length > 0) {
      const today = new Date().toDateString();
      localStorage.setItem(`planner_checklist_${today}`, JSON.stringify(checklist));
    }
  }, [checklist]);

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
    await fetch(`${API_BASE}/goals/${id}`, { method: "DELETE", headers: getAuthHeaders() }).catch(() => {});
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

  const onGoalCreated = () => {};

  return (
    <main className="flex flex-col min-h-screen pb-8">
      <header className="flex items-center justify-between px-8 py-6 mt-2">
        <HamburgerButton />
        <h1 className="text-lg font-semibold tracking-tight">Daily Planner</h1>
        <Link href="/dashboard" className="text-primary text-xs font-medium">
          Dashboard
        </Link>
      </header>

      <div className="px-8 space-y-8 flex-1 mt-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />))}
          </div>
        ) : (
          <>
            {/* Metric Goals */}
            {goals.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-medium text-muted-foreground ml-1">
                  Targets
                </h2>
                {goals.map((goal) => {
                  const meta = GOAL_META[goal.metricType];
                  if (!meta) return null;
                  const cur = getProgress(goal.metricType);
                  const pct = Math.min((cur / (goal.targetValue || 1)) * 100, 100);
                  const done = pct >= 100;

                  return (
                    <div key={goal.id} className="flex items-center gap-4 py-3">
                      <ProgressRing current={cur} target={goal.targetValue} color={done ? "hsl(142,71%,45%)" : meta.color} label="" size={48} strokeWidth={4} />
                      <div className="flex-1 min-w-0">
                        <Link href={meta.link}>
                          <p className="font-medium text-sm flex items-center gap-1.5">
                            {meta.icon} {meta.label}
                            {done && <span className="text-green-500 text-xs">✓</span>}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">{Math.round(cur)} / {goal.targetValue} {meta.unit}</p>
                        <div className="h-1 bg-secondary rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: done ? "hsl(142,71%,45%)" : meta.color }} />
                        </div>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            <GoalSetter onCreated={onGoalCreated} />

            {/* Daily Standards Checklist */}
            <section className="space-y-3">
              <h2 className="text-xs font-medium text-muted-foreground ml-1">
                Daily Standards
              </h2>

              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 group py-1">
                  <button onClick={() => toggleCheck(item.id)} className="shrink-0">
                    {item.done ? (
                      <CheckCircle2 size={20} strokeWidth={1.5} className="text-primary" />
                    ) : (
                      <Circle size={20} strokeWidth={1.5} className="text-muted-foreground/30" />
                    )}
                  </button>
                  <span className={`text-sm font-medium flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                    {item.text}
                  </span>
                  <button onClick={() => removeChecklistItem(item.id)} className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a standard..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" ? (e.preventDefault(), addChecklistItem()) : null}
                  className="h-10 text-sm"
                />
                <button onClick={addChecklistItem} className="shrink-0 h-10 w-10 bg-secondary hover:bg-secondary/80 rounded-full flex items-center justify-center transition-colors">
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
