"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Apple, Moon, Droplets, Activity } from "lucide-react";
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

  const quickActions = [
    { href: "/workouts/new", icon: Dumbbell, label: "Log Workout", colors: "bg-primary/10 text-primary" },
    { href: "/diet/new", icon: Apple, label: "Add Meal", colors: "bg-emerald-100 text-emerald-600" },
    { href: "/sleep", icon: Moon, label: "Sleep Tracker", colors: "bg-sky-100 text-sky-600" },
    { href: "/cardio/new", icon: Activity, label: "Log Cardio", colors: "bg-primary/10 text-primary" },
    { href: "/water", icon: Droplets, label: "Water Intake", colors: "bg-sky-100 text-sky-600" },
  ];

  return (
    <main className="flex flex-1 flex-col px-8 py-6 min-h-screen">
      <header className="flex items-center justify-between mb-10 mt-2">
        <div className="flex items-center gap-3">
          <HamburgerButton />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Hi, {profile ? profile.name.split(" ")[0] : "User"}
            </h1>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">
              Ready to crush it today?
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="h-10 w-10 rounded-full bg-secondary text-foreground flex items-center justify-center font-semibold text-sm uppercase"
        >
          {profile && profile.name ? profile.name.charAt(0) : "U"}
        </Link>
      </header>

      <div className="space-y-8">
        <PlannerCard />

        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-4 ml-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`bg-secondary/50 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 active:opacity-80 transition-all ${
                    action.label === "Water Intake" ? "col-span-2" : ""
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${action.colors}`}>
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
