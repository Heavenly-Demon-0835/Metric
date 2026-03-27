"use client";

import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { useRouter } from "next/navigation";
import ProgressRing from "./ProgressRing";
import { API_BASE, getAuthHeaders } from "@/lib/api";

interface GoalTargets {
  calories: number;
  protein: number;
  water: number;
}

const DEFAULT_TARGETS: GoalTargets = {
  calories: 2000,
  protein: 150,
  water: 3000,
};

export default function PlannerCard() {
  const router = useRouter();
  const [targets, setTargets] = useState<GoalTargets>(DEFAULT_TARGETS);
  const [current, setCurrent] = useState({ calories: 0, protein: 0, water: 0, workouts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [goalsRes, dietRes, waterRes, workoutRes] = await Promise.all([
          fetch(`${API_BASE}/goals/`, { headers }),
          fetch(`${API_BASE}/diet/`, { headers }),
          fetch(`${API_BASE}/water/`, { headers }),
          fetch(`${API_BASE}/workouts/`, { headers }),
        ]);

        if (goalsRes.ok) {
          const goals = await goalsRes.json();
          const t = { ...DEFAULT_TARGETS };
          for (const g of goals) {
            if (g.metric_type === "calories") t.calories = g.target_value;
            if (g.metric_type === "protein") t.protein = g.target_value;
            if (g.metric_type === "water") t.water = g.target_value;
          }
          setTargets(t);
        }

        let totalCal = 0, totalProt = 0;
        if (dietRes.ok) {
          for (const d of await dietRes.json()) {
            if (new Date(d.date) >= today) {
              totalCal += d.calories || 0;
              totalProt += d.protein_g || 0;
            }
          }
        }

        let totalWater = 0;
        if (waterRes.ok) {
          for (const w of await waterRes.json()) {
            if (new Date(w.date) >= today) totalWater += w.amount_ml || 0;
          }
        }

        let workoutCount = 0;
        if (workoutRes.ok) {
          for (const w of await workoutRes.json()) {
            if (new Date(w.date) >= today) workoutCount++;
          }
        }

        setCurrent({ calories: totalCal, protein: totalProt, water: totalWater, workouts: workoutCount });
      } catch (err) {
        console.error("[PlannerCard] Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-3xl border p-6 animate-pulse">
        <div className="h-28 bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Target size={16} />
        </div>
        <h3 className="text-sm font-bold">Today&rsquo;s Progress</h3>
        {current.workouts > 0 && (
          <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            🏋️ {current.workouts}
          </span>
        )}
      </div>

      <div className="flex justify-around">
        <ProgressRing
          current={current.calories}
          target={targets.calories}
          color="hsl(262, 83%, 58%)"
          label="Calories"
          unit="kcal"
          onClick={() => router.push("/diet/new")}
        />
        <ProgressRing
          current={current.protein}
          target={targets.protein}
          color="hsl(217, 91%, 60%)"
          label="Protein"
          unit="g"
          onClick={() => router.push("/diet/new")}
        />
        <ProgressRing
          current={current.water}
          target={targets.water}
          color="hsl(199, 89%, 48%)"
          label="Water"
          unit="ml"
          onClick={() => router.push("/water")}
        />
      </div>
    </div>
  );
}
