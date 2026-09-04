"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Apple, Moon, Droplets, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, getToken } from "@/lib/api";
import PlannerCard from "@/components/PlannerCard";

const quickActions = [
  { href: "/workouts/new", icon: Dumbbell, label: "Log Workout", sub: "Track your sets", grad: "grad-violet", tint: "bg-violet-50", shadow: "shadow-violet-500/30" },
  { href: "/diet/new", icon: Apple, label: "Add Meal", sub: "Log nutrition", grad: "grad-emerald", tint: "bg-emerald-50", shadow: "shadow-emerald-500/30" },
  { href: "/cardio/new", icon: Activity, label: "Log Cardio", sub: "Run, walk, ride", grad: "grad-fuchsia", tint: "bg-fuchsia-50", shadow: "shadow-fuchsia-500/30" },
  { href: "/sleep", icon: Moon, label: "Sleep Tracker", sub: "Rest & recover", grad: "grad-indigo", tint: "bg-indigo-50", shadow: "shadow-indigo-500/30" },
];

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    window.history.replaceState(null, "", "/dashboard");
    setGreeting(greetingFor(new Date().getHours()));

    const fetchProfile = async () => {
      if (!getToken()) {
        router.replace("/auth/login");
        return;
      }
      try {
        setProfile(await apiGet("/users/me"));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [router]);

  const firstName = profile?.name ? profile.name.split(" ")[0] : null;
  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : "U";

  return (
    <main className="flex flex-1 flex-col px-6 py-6 pb-28 min-h-screen">
      <header className="flex items-center justify-between mb-8 mt-2 animate-fade-up">
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-muted-foreground text-xs font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold tracking-tight -mt-0.5">
              {firstName ? (
                firstName
              ) : (
                <span className="inline-block h-6 w-24 rounded-lg bg-secondary animate-pulse align-middle" />
              )}
            </h1>
          </div>
        </div>
        <Link
          href="/profile"
          className="grad-violet h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          {initial}
        </Link>
      </header>

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <PlannerCard />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold mb-4 ml-1 animate-fade-up" style={{ animationDelay: "120ms" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`${action.tint} rounded-3xl p-5 flex flex-col active:scale-[0.97] transition-transform animate-fade-up`}
                style={{ animationDelay: `${150 + i * 50}ms` }}
              >
                <div className={`${action.grad} w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${action.shadow} mb-3`}>
                  <Icon size={22} strokeWidth={2} className="text-white" />
                </div>
                <span className="font-semibold text-sm text-foreground">{action.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{action.sub}</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/water"
          className="grad-sky rounded-3xl p-5 mt-3 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-lg shadow-sky-500/25 animate-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          <div className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
            <Droplets size={22} strokeWidth={2} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">Water Intake</p>
            <p className="text-xs text-white/80 mt-0.5">Stay hydrated today</p>
          </div>
          <ChevronRight size={20} strokeWidth={2} className="text-white/80" />
        </Link>
      </section>
    </main>
  );
}
