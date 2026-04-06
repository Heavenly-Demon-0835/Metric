"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { useRouter } from "next/navigation";
import ProgressRing from "./ProgressRing";
import { database } from "@/db";

export default function PlannerCard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [goals, setGoals] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (!database) return;

    const subG = database.collections.get("daily_goals").query().observe().subscribe(setGoals);
    const subD = database.collections.get("diet").query().observe().subscribe(setDiets);
    const subW = database.collections.get("workouts").query().observe().subscribe(setWorkouts);
    const subWL = database.collections.get("water_logs").query().observe().subscribe(setWaterLogs);

    return () => {
      subG.unsubscribe();
      subD.unsubscribe();
      subW.unsubscribe();
      subWL.unsubscribe();
    };
  }, []);

  if (!isMounted || !database) return (
    <div className="bg-secondary/30 rounded-2xl p-6 animate-pulse">
      <div className="h-20 bg-secondary rounded-xl" />
    </div>
  );

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
    }
  }

  for (const wl of waterLogs) {
    if (new Date(wl.date) >= today) {
      currentWater += wl.amountMl || 0;
    }
  }

  for (const w of workouts) {
    if (new Date(w.date) >= today) {
      workoutCount++;
    }
  }


  return (
    <div className="bg-secondary/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} strokeWidth={1.5} className="text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground">Today&rsquo;s Progress</h3>
        {workoutCount > 0 && (
          <span className="ml-auto text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
            🏋️ {workoutCount}
          </span>
        )}
      </div>

      <div className="flex justify-around">
        <ProgressRing
          current={currentCal}
          target={targets.calories}
          color="hsl(255, 100%, 68%)"
          label="Calories"
          unit="kcal"
          onClick={() => router.push("/diet/new")}
        />
        <ProgressRing
          current={currentProt}
          target={targets.protein}
          color="#10b981"
          label="Protein"
          unit="g"
          onClick={() => router.push("/diet/new")}
        />
        <ProgressRing
          current={currentWater}
          target={targets.water}
          color="#0ea5e9"
          label="Water"
          unit="ml"
          onClick={() => router.push("/water")}
        />
      </div>
    </div>
  );
}
