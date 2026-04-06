"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Activity, Timer, Navigation, Play, Square, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

const ACTIVITY_TYPES = ["Walking", "Running"] as const;
type ActivityType = (typeof ACTIVITY_TYPES)[number];

export default function NewCardio() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"gps" | "manual">("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("Running");
  
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [gpsDistance, setGpsDistance] = useState(0);
  const [locationDenied, setLocationDenied] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
    setLocationDenied(false);
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

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "gps" && !currentPos && !locationDenied) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          if (err.code === 1) {
            setLocationDenied(true);
          } else {
            setError(`Could not get location: ${err.message}`);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [activeTab, currentPos, locationDenied]);

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
    <main className="flex flex-col min-h-screen pb-24">
      <header className="flex items-center justify-between px-8 py-6 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Log Cardio</h1>
        <div className="w-10" />
      </header>

      {/* Activity Type Selector */}
      <div className="flex gap-3 px-8">
        {ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActivityType(type)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium transition-all border ${
              activityType === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
            }`}
          >
            {type === "Walking" ? <Footprints size={16} strokeWidth={1.5} /> : <Activity size={16} strokeWidth={1.5} />}
            {type}
          </button>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border mx-8 mt-6 mb-6">
        <button 
          onClick={() => setActiveTab("manual")}
          className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 ${activeTab === "manual" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          Manual Log
        </button>
        <button 
          onClick={() => setActiveTab("gps")}
          className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 ${activeTab === "gps" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          GPS Tracking
        </button>
      </div>

      <div className="flex-1 flex flex-col px-8">
        {error && <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl mb-4">{error}</div>}

        {activeTab === "manual" ? (
          <form onSubmit={handleManualSave} className="space-y-6">
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <Activity size={36} strokeWidth={1.5} className="text-muted-foreground mb-2" />
              <h2 className="font-semibold text-base">Great job getting moving!</h2>
              <p className="text-muted-foreground text-sm max-w-[250px] leading-relaxed">
                Input your time and distance below.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="cardio-duration" className="text-xs font-medium text-muted-foreground ml-1">
                  Duration (minutes)
                </label>
                <Input 
                  id="cardio-duration"
                  type="number" 
                  placeholder="e.g. 30" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required 
                  className="font-medium h-14"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cardio-distance" className="text-xs font-medium text-muted-foreground ml-1">
                  Distance (km)
                </label>
                <Input 
                  id="cardio-distance"
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 5.2" 
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  required 
                  className="font-medium h-14"
                />
              </div>
            </div>

            <div className="pt-6">
              <Button type="submit" className="w-full h-13" disabled={isLoading}>
                {isLoading ? "Saving..." : "Done"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Live Map */}
            <div className="rounded-2xl overflow-hidden border border-border mb-6 min-h-[280px] bg-secondary/30 relative">
              {currentPos ? (
                <LeafletMap center={currentPos} coords={coords} />
              ) : locationDenied ? (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  <div className="text-center px-6">
                    <Navigation size={32} strokeWidth={1.5} className="mx-auto mb-4 text-destructive/60" />
                    <p className="font-semibold text-foreground mb-2">Location is Off</p>
                    <p className="text-sm mb-4">Please enable location services.</p>
                    <button
                      onClick={() => { setLocationDenied(false); setCurrentPos(null); }}
                      className="bg-primary text-primary-foreground font-medium text-sm px-6 py-3 rounded-full"
                    >Try Again</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  <div className="text-center">
                    <Navigation size={28} strokeWidth={1.5} className="mx-auto mb-3 text-muted-foreground/40 animate-pulse" />
                    <p className="font-medium text-sm">Acquiring GPS...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            {isTracking && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-secondary/40 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Time</p>
                  <p className="text-xl font-semibold">{formatTime(elapsedSec)}</p>
                </div>
                <div className="bg-secondary/40 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Distance</p>
                  <p className="text-xl font-semibold">{gpsDistance.toFixed(2)} km</p>
                </div>
              </div>
            )}

            <Button 
               onClick={isTracking ? stopTracking : startTracking} 
               variant={isTracking ? "destructive" : "default"}
               className="w-full h-14 text-base"
               disabled={isLoading}
            >
              {isLoading ? "Saving..." : isTracking ? (
                <><Square size={16} strokeWidth={1.5} className="mr-2" /> Stop & Save</>
              ) : (
                <><Play size={16} strokeWidth={1.5} className="mr-2" /> Start {activityType}</>
              )}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
