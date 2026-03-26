"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, Timer, Navigation, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";

export default function NewCardio() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"gps" | "manual">("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Manual State
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  // GPS State Mockup
  const [isTracking, setIsTracking] = useState(false);

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/cardio/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          duration_minutes: parseInt(duration) || 0,
          distance_km: parseFloat(distance) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to save cardio session");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      router.push("/dashboard");
    } else {
      setIsTracking(true);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-secondary/30 pb-24">
      <header className="flex items-center justify-between p-6 pb-4 border-b">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Log Cardio</h1>
        <div className="w-10" />
      </header>

      <div className="flex bg-secondary p-1 rounded-2xl mx-6 mt-6 mb-8">
        <button 
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Manual Log
        </button>
        <button 
          onClick={() => setActiveTab("gps")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "gps" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          GPS Tracking
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6">
        {activeTab === "manual" ? (
          <form onSubmit={handleManualSave} className="space-y-8 animate-in fade-in slide-in-from-left-4">
            {error && <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg">{error}</div>}
            
            <div className="bg-background border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-4 py-8">
              <div className="p-4 bg-primary/10 text-primary rounded-full mb-2">
                <Activity size={48} />
              </div>
              <h2 className="font-bold text-lg text-foreground">Great job getting moving!</h2>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                Input your time and distance below to log this session manually.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="cardio-duration" className="text-sm font-semibold flex items-center gap-2 ml-1 text-foreground">
                  <Timer size={18} className="text-primary" /> Duration (minutes)
                </label>
                <Input 
                  id="cardio-duration"
                  type="number" 
                  placeholder="e.g. 30" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required 
                  className="text-lg font-bold h-16 bg-background"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cardio-distance" className="text-sm font-semibold flex items-center gap-2 ml-1 text-foreground">
                  <Navigation size={18} className="text-primary" /> Distance (km)
                </label>
                <Input 
                  id="cardio-distance"
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 5.2" 
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  required 
                  className="text-lg font-bold h-16 bg-background"
                />
              </div>
            </div>

            <div className="pt-8">
              <Button type="submit" className="w-full h-14 text-lg shadow-xl shadow-primary/20" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Cardio Session"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4">
            <div className="bg-background border rounded-3xl shadow-sm flex flex-col items-center justify-center text-center gap-4 py-6 px-6 mb-6">
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <Map size={36} />
              </div>
              <h2 className="font-bold text-lg text-foreground">Live GPS Tracking</h2>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                GPS integration coming soon — track your route in real-time and auto-calculate distance/pace!
              </p>
            </div>

            {/* Map Placeholder */}
            <div className="flex-1 bg-secondary/50 border border-dashed rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden mb-8 min-h-[300px]">
              {isTracking ? (
                <>
                  <div className="absolute inset-0 bg-primary/5 animate-pulse mix-blend-multiply" />
                  <div className="z-10 bg-background/90 backdrop-blur px-6 py-4 rounded-3xl shadow-lg text-center border">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Tracking Active</p>
                    <p className="text-3xl font-extrabold text-foreground">0:12:34</p>
                    <p className="text-sm font-semibold text-muted-foreground mt-1">1.2 km mapped</p>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                   <Navigation size={32} className="mx-auto text-primary/40 mb-3" />
                   <p className="font-bold text-muted-foreground">Map Area Placeholder</p>
                </div>
              )}
            </div>

            <Button 
               onClick={toggleTracking} 
               variant={isTracking ? "destructive" : "default"}
               className="w-full h-16 text-xl shadow-xl transition-all"
            >
              {isTracking ? "Stop & Save" : "Start Tracking Run"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
