"use client";

import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { useRouter } from "next/navigation";
import { database } from "@/db";
import { useLiveQuery } from "@/db/useLiveQuery";

function HeroRing({
  current,
  target,
  label,
  unit,
  onClick,
}: {
  current: number;
  target: number;
  label: string;
  unit: string;
  onClick?: () => void;
}) {
  const size = 78;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(current / (target || 1), 1);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="white"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-base font-bold leading-none">{Math.round(current)}</span>
          <span className="text-[9px] font-medium text-white/70 mt-0.5">{unit}</span>
        </div>
      </div>
      <span className="text-[11px] font-medium text-white/85">{label}</span>
    </button>
  );
}

export default function PlannerCard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const goals = useLiveQuery<any>("daily_goals");
  const diets = useLiveQuery<any>("diet");
  const workouts = useLiveQuery<any>("workouts");
  const waterLogs = useLiveQuery<any>("water_logs");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !database)
    return <div className="h-52 rounded-3xl grad-hero opacity-60 animate-pulse" />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targets = { calories: 2000, protein: 150, water: 3000 };
  for (const g of goals) {
    if (g.metricType === "calories") targets.calories = g.targetValue;
    if (g.metricType === "protein") targets.protein = g.targetValue;
    if (g.metricType === "water") targets.water = g.targetValue;
  }

  let currentCal = 0,
    currentProt = 0,
    currentWater = 0,
    workoutCount = 0;

  for (const d of diets) {
    if (d.date && new Date(d.date) >= today) {
      currentCal += d.calories || 0;
      currentProt += d.proteinG || 0;
    }
  }
  for (const wl of waterLogs) {
    if (wl.date && new Date(wl.date) >= today) currentWater += wl.amountMl || 0;
  }
  for (const w of workouts) {
    if (w.date && new Date(w.date) >= today) workoutCount++;
  }

  return (
    <div className="grad-hero rounded-3xl p-6 shadow-lg shadow-primary/25 relative overflow-hidden">
      <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -left-10 -bottom-12 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-base leading-tight">Today&rsquo;s Progress</h3>
          <p className="text-white/70 text-xs font-medium mt-0.5">Keep the momentum going</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
          <Dumbbell size={13} strokeWidth={2} className="text-white" />
          <span className="text-white text-xs font-semibold">{workoutCount}</span>
        </div>
      </div>

      <div className="relative flex justify-around">
        <HeroRing current={currentCal} target={targets.calories} label="Calories" unit="kcal" onClick={() => router.push("/diet/new")} />
        <HeroRing current={currentProt} target={targets.protein} label="Protein" unit="g" onClick={() => router.push("/diet/new")} />
        <HeroRing current={currentWater} target={targets.water} label="Water" unit="ml" onClick={() => router.push("/water")} />
      </div>
    </div>
  );
}
