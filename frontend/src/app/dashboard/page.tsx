"use client";

import { useState, useEffect } from "react";
import { Activity, Dumbbell, Apple, Moon, Droplets } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import PlannerCard from "@/components/PlannerCard";
import { HamburgerButton } from "@/components/Sidebar";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    window.history.replaceState(null, "", "/dashboard");

    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) setProfile(await res.json());
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.replace("/auth/login");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [router]);

  return (
    <main className="flex flex-1 flex-col p-6 pb-8 bg-secondary/30 min-h-screen">
      <header className="flex items-center justify-between mb-8 mt-2">
        <div className="flex items-center gap-3">
          <HamburgerButton />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Hi, {profile ? profile.name.split(" ")[0] : "User"}!
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Ready to crush it today?
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="h-12 w-12 rounded-full bg-primary/20 hover:bg-primary/30 active:scale-95 transition-all text-primary flex items-center justify-center font-bold text-xl ring-2 ring-primary/20 uppercase"
        >
          {profile && profile.name ? profile.name.charAt(0) : "U"}
        </Link>
      </header>

      <div className="space-y-6">
        <PlannerCard />

        <section>
          <h2 className="text-lg font-bold mb-3 px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/workouts/new"
              className="bg-card p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Dumbbell size={24} />
              </div>
              <span className="font-bold text-sm">Log Workout</span>
            </Link>
            <Link
              href="/diet/new"
              className="bg-card p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-[hsl(142,71%,45%)]/10 justify-center text-[hsl(142,71%,45%)] flex items-center">
                <Apple size={24} />
              </div>
              <span className="font-bold text-sm">Add Meal</span>
            </Link>
            <Link
              href="/sleep"
              className="bg-card p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Moon size={24} />
              </div>
              <span className="font-bold text-sm">Sleep Tracker</span>
            </Link>
            <Link
              href="/cardio/new"
              className="bg-card p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)] flex items-center justify-center">
                <Activity size={24} />
              </div>
              <span className="font-bold text-sm">Log Cardio</span>
            </Link>
            <Link
              href="/water"
              className="bg-card p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform col-span-2"
            >
              <div className="h-12 w-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Droplets size={24} />
              </div>
              <span className="font-bold text-sm">Water Intake</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
