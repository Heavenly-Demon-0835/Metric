"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { useRouter } from "next/navigation";
import ProgressRing from "./ProgressRing";
import { database } from "@/db";

export default function PlannerCardInner() {
  const router = useRouter();

  const [goals, setGoals] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);

  useEffect(() => {
    if (!database) return;

    const subG = database.collections.get("daily_goals").query().observe().subscribe(setGoals);
    const subD = database.collections.get("diet").query().observe().subscribe(setDiets);
    const subW = database.collections.get("workouts").query().observe().subscribe(setWorkouts);

    return () => {
      subG.unsubscribe();
      subD.unsubscribe();
      subW.unsubscribe();
    };
  }, []);

  if (!database) return null;

  // Process data locally instead of making API calls
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targets = { calories: 2000, protein: 150, water: 3000 };
  for (const g of goals) {
    if (g.metricType === "calories") targets.calories = g.targetValue;
    if (g.metricType === "protein") targets.protein = g.targetValue;
    if (g.metricType === "water") targets.water = g.targetValue;
  }

  let currentCal = 0, currentProt = 0, currentWater = 0, workoutCount = 0;

  for (const d of diets) {
    if (new Date(d.date) >= today) {
      currentCal += d.calories || 0;
      currentProt += d.proteinG || 0;
      currentWater += d.waterMl || 0;
    }
  }

  for (const w of workouts) {
    if (new Date(w.date) >= today) {
      workoutCount++;
    }
  }

  return (
    <div className="bg-card rounded-3xl border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Target size={16} />
        </div>
        <h3 className="text-sm font-bold">Today&rsquo;s Progress</h3>
        {workoutCount > 0 && (
          <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            🏋️ {workoutCount}
          </span>
        )}
      </div>

      <div className="flex justify-around">
        <ProgressRing
          current={currentCal}
          target={targets.calories}
          color="hsl(262, 83%, 58%)"
          label="Calories"
          unit="kcal"
          onClick={() => router.push("/diet/new")}
        />
        <ProgressRing
          current={currentProt}
          target={targets.protein}
          color="hsl(217, 91%, 60%)"
          label="Protein"
          unit="g"
          onClick={() => router.push("/diet/new")}
        />
        <ProgressRing
          current={currentWater}
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
