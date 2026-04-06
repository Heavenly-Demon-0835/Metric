"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
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
      <main className="flex flex-col min-h-screen px-8 py-6 justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Loading...</p>
      </main>
    );
  }

  if (!profile) return null;

  const fields = [
    { label: "Age", value: profile.age ?? "—" },
    { label: "Gender", value: profile.gender || "—" },
    { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "—" },
    { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
  ];

  return (
    <main className="flex flex-col min-h-screen px-8 py-6 pb-24">
      <header className="flex items-center mb-10 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full transition-colors">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
      </header>

      <div className="flex flex-col items-center mb-12">
        <div className="h-20 w-20 rounded-full bg-secondary text-foreground flex items-center justify-center font-semibold text-2xl mb-4 uppercase">
          {profile.name ? profile.name.charAt(0) : "U"}
        </div>
        <h2 className="text-xl font-semibold">{profile.name || "App User"}</h2>
        <p className="text-muted-foreground text-sm mt-1">{profile.email}</p>
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-medium text-muted-foreground mb-4 ml-1">My Body</h3>
        <div className="space-y-0">
          {fields.map((field) => (
            <div key={field.label} className="flex justify-between items-center py-4 border-b border-border last:border-b-0">
              <span className="text-sm font-medium">{field.label}</span>
              <span className="text-sm text-muted-foreground">{field.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={handleLogout} variant="outline" className="w-full h-13">
          <LogOut className="mr-2" size={18} strokeWidth={1.5} />
          Log Out
        </Button>
      </div>
    </main>
  );
}
