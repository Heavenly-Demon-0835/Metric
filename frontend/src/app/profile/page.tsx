"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE, getAuthHeaders } from "@/lib/api";

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: getAuthHeaders()
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            router.push("/auth/login");
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen p-6 justify-center items-center bg-secondary/30">
        <Activity className="animate-pulse text-primary mb-4" size={48} />
        <p className="text-muted-foreground font-semibold">Loading Profile...</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="flex flex-col min-h-screen p-6 pb-24 bg-secondary/30">
      <header className="flex items-center justify-between mb-8 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Profile</h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-col items-center mb-10">
        <div className="h-24 w-24 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-4xl mb-4 border-4 border-background shadow-sm uppercase">
          {profile.name ? profile.name.charAt(0) : "U"}
        </div>
        <h2 className="text-2xl font-bold">{profile.name || "App User"}</h2>
        <p className="text-muted-foreground">{profile.email}</p>
      </div>

      <div className="space-y-6 flex-1">
        <section className="bg-card rounded-3xl p-5 shadow-sm border space-y-4">
          <h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-2">My Body</h3>
          
          <div className="flex justify-between items-center border-b pb-3 border-border">
            <span className="font-semibold text-foreground">Age</span>
            <span className="font-bold text-muted-foreground">{profile.age ?? "-"}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-3 border-border">
            <span className="font-semibold text-foreground">Gender</span>
            <span className="font-bold text-muted-foreground">{profile.gender || "-"}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-3 border-border">
            <span className="font-semibold text-foreground">Weight (kg)</span>
            <span className="font-bold text-muted-foreground">{profile.weight ?? "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Height (cm)</span>
            <span className="font-bold text-muted-foreground">{profile.height ?? "-"}</span>
          </div>
        </section>
      </div>

      <div className="mt-8">
        <Button onClick={handleLogout} variant="destructive" className="w-full h-14 text-lg">
          <LogOut className="mr-2" size={20} />
          Log Out
        </Button>
      </div>
    </main>
  );
}
