"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Activity, Timer, Navigation, Play, Square, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

const ACTIVITY_TYPES = ["Walking", "Running"] as const;
type ActivityType = (typeof ACTIVITY_TYPES)[number];

export default function NewCardio() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"gps" | "manual">("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("Running");
  
  // Manual State
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  // GPS State
  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [gpsDistance, setGpsDistance] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Haversine distance in km
  const haversine = (a: [number, number], b: [number, number]): number => {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a[0] * Math.PI) / 180) *
        Math.cos((b[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setError("");
    setIsTracking(true);
    setCoords([]);
    setGpsDistance(0);
    setElapsedSec(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPt: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(newPt);
        setCoords((prev) => {
          if (prev.length > 0) {
            const d = haversine(prev[prev.length - 1], newPt);
            if (d > 0.003) {
              // Only add point if moved > 3m (noise filter)
              setGpsDistance((old) => old + d);
              return [...prev, newPt];
            }
            return prev;
          }
          return [newPt];
        });
      },
      (err) => setError(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    watchIdRef.current = null;
    timerRef.current = null;
    setIsTracking(false);

    // Auto-save
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cardio/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          duration_minutes: Math.round(elapsedSec / 60),
          distance_km: parseFloat(gpsDistance.toFixed(2)),
          activity_type: activityType,
          route_coords: coords,
        }),
      });
      if (!res.ok) throw new Error("Failed to save cardio session");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [elapsedSec, gpsDistance, coords, activityType, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Get initial position for map centering
  useEffect(() => {
    if (activeTab === "gps" && !currentPos) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        () => {} // Silently ignore
      );
    }
  }, [activeTab, currentPos]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
          activity_type: activityType,
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

  return (
    <main className="flex flex-col min-h-screen bg-secondary/30 pb-24">
      <header className="flex items-center justify-between p-6 pb-4 border-b">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Log Cardio</h1>
        <div className="w-10" />
      </header>

      {/* Activity Type Selector */}
      <div className="flex gap-3 px-6 mt-6">
        {ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActivityType(type)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border ${
              activityType === type
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background text-muted-foreground border-input hover:bg-secondary"
            }`}
          >
            {type === "Walking" ? <Footprints size={18} /> : <Activity size={18} />}
            {type}
          </button>
        ))}
      </div>

      <div className="flex bg-secondary p-1 rounded-2xl mx-6 mt-4 mb-6">
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
        {error && <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg mb-4">{error}</div>}

        {activeTab === "manual" ? (
          <form onSubmit={handleManualSave} className="space-y-8 animate-in fade-in slide-in-from-left-4">
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
            {/* Live Map */}
            <div className="rounded-[2rem] overflow-hidden border shadow-sm mb-6 min-h-[300px] bg-background relative">
              {currentPos ? (
                <LeafletMap center={currentPos} coords={coords} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Navigation size={32} className="mx-auto mb-3 text-primary/40 animate-pulse" />
                    <p className="font-bold">Acquiring GPS position...</p>
                    <p className="text-sm mt-1">Allow location access when prompted</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            {isTracking && (
              <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-background border rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Time</p>
                  <p className="text-2xl font-extrabold text-foreground">{formatTime(elapsedSec)}</p>
                </div>
                <div className="bg-background border rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Distance</p>
                  <p className="text-2xl font-extrabold text-foreground">{gpsDistance.toFixed(2)} km</p>
                </div>
              </div>
            )}

            <Button 
               onClick={isTracking ? stopTracking : startTracking} 
               variant={isTracking ? "destructive" : "default"}
               className="w-full h-16 text-xl shadow-xl transition-all"
               disabled={isLoading}
            >
              {isLoading ? "Saving..." : isTracking ? (
                <><Square size={20} className="mr-2" /> Stop & Save</>
              ) : (
                <><Play size={20} className="mr-2" /> Start {activityType}</>
              )}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
