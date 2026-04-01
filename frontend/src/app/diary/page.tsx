"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Activity, Apple, Moon, Dumbbell, X, Trash2, Pencil, Eye, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";

interface RawEntry {
  _id: string;
  type: "workout" | "cardio" | "sleep" | "diet";
  date: string;
  // workout
  exercises?: any[];
  // cardio
  duration_minutes?: number;
  distance_km?: number;
  activity_type?: string;
  // sleep
  duration_hours?: number;
  quality?: string;
  // diet
  meal_name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  water_ml?: number;
  supplements?: string[];
}

export default function Diary() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [detailEntry, setDetailEntry] = useState<RawEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    const headers = getAuthHeaders();
    const all: RawEntry[] = [];

    try {
      const [workouts, cardio, sleep, diet] = await Promise.all([
        fetch(`${API_BASE}/workouts/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/cardio/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/sleep/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/diet/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      workouts.forEach((w: any) => all.push({ ...w, type: "workout" }));
      cardio.forEach((c: any) => all.push({ ...c, type: "cardio" }));
      sleep.forEach((s: any) => all.push({ ...s, type: "sleep" }));
      diet.forEach((d: any) => all.push({ ...d, type: "diet" }));
    } catch {}

    setEntries(all);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const activeDays = new Set<number>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) activeDays.add(d.getDate());
  });

  // Group entries for selected day by type
  const dayEntries = selectedDay
    ? entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
      })
    : [];

  const grouped: Record<string, RawEntry[]> = {};
  dayEntries.forEach((e) => {
    if (!grouped[e.type]) grouped[e.type] = [];
    grouped[e.type].push(e);
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "workout": return <Dumbbell size={22} />;
      case "cardio": return <Footprints size={22} />;
      case "sleep": return <Moon size={22} />;
      case "diet": return <Apple size={22} />;
      default: return <Activity size={22} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "workout": return "bg-primary/10 text-primary";
      case "cardio": return "bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)]";
      case "sleep": return "bg-indigo-500/10 text-indigo-500";
      case "diet": return "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]";
      default: return "bg-primary/10 text-primary";
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case "workout": return "Workouts";
      case "cardio": return "Cardio";
      case "sleep": return "Sleep";
      case "diet": return "Meals";
      default: return type;
    }
  };

  const getEntryTitle = (e: RawEntry) => {
    switch (e.type) {
      case "workout": return e.exercises?.length ? `${e.exercises.length} Exercise${e.exercises.length > 1 ? 's' : ''}` : "Workout";
      case "cardio": return e.activity_type || "Cardio";
      case "sleep": return `${e.duration_hours} hours`;
      case "diet": return e.meal_name || "Meal";
      default: return "Entry";
    }
  };

  const getEntrySub = (e: RawEntry) => {
    switch (e.type) {
      case "workout": return e.exercises?.map((ex: any) => ex.name).join(", ") || "";
      case "cardio": return `${e.duration_minutes ?? 0} min • ${e.distance_km ?? 0} km`;
      case "sleep": return e.quality || "";
      case "diet": return `${e.calories ?? 0} kcal`;
      default: return "";
    }
  };

  const ordinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
  };

  // ---- Detail / Edit / Delete handlers ----
  const openDetail = (entry: RawEntry) => {
    setDetailEntry(entry);
    setIsEditing(false);
    setDeleteConfirm(null);
  };

  const startEdit = () => {
    if (!detailEntry) return;
    const e = detailEntry;
    switch (e.type) {
      case "sleep": setEditData({ duration_hours: e.duration_hours ?? 0 }); break;
      case "diet": setEditData({ meal_name: e.meal_name ?? "", calories: e.calories ?? 0, protein_g: e.protein_g ?? "", carbs_g: e.carbs_g ?? "", fat_g: e.fat_g ?? "" }); break;
      case "cardio": setEditData({ duration_minutes: e.duration_minutes ?? 0, distance_km: e.distance_km ?? 0, activity_type: e.activity_type ?? "Running" }); break;
      case "workout": setEditData({ exercises: e.exercises ?? [] }); break;
    }
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!detailEntry) return;
    setActionLoading(true);
    try {
      const endpoint = `${API_BASE}/${detailEntry.type === "workout" ? "workouts" : detailEntry.type}/${detailEntry._id}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed to update");
      setDetailEntry(null);
      setIsEditing(false);
      await fetchEntries();
    } catch {}
    setActionLoading(false);
  };

  const deleteEntry = async (id: string, type: string) => {
    setActionLoading(true);
    try {
      const endpoint = `${API_BASE}/${type === "workout" ? "workouts" : type}/${id}`;
      const res = await fetch(endpoint, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete");
      setDetailEntry(null);
      setDeleteConfirm(null);
      await fetchEntries();
    } catch {}
    setActionLoading(false);
  };

  return (
    <main className="flex flex-col min-h-screen bg-secondary/30 pb-20">
      <header className="flex items-center justify-between p-6 pb-2 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Timeline Diary</h1>
        <button
          onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); }}
          className="w-10 text-primary font-bold text-sm text-right"
        >Today</button>
      </header>

      {/* Calendar Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="h-10 w-10 bg-background rounded-full border shadow-sm flex items-center justify-center hover:bg-secondary"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="h-10 w-10 bg-background rounded-full border shadow-sm flex items-center justify-center hover:bg-secondary"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Grid Calendar */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center w-full">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-xs font-bold text-muted-foreground uppercase">{d}</div>
          ))}
          {Array.from({length: startOffset}).map((_, i) => <div key={`offset-${i}`}></div>)}
          {daysArray.map(d => {
            const hasActivity = activeDays.has(d);
            const isSelected = selectedDay === d;
            return (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`relative flex flex-col items-center justify-center h-[52px] rounded-2xl transition-all font-bold text-sm
                  ${isSelected ? 'bg-primary text-primary-foreground shadow-md scale-105 z-10' : 'bg-background hover:bg-secondary text-foreground'}
                  ${hasActivity && !isSelected ? 'border border-primary/20' : ''}`}>
                {d}
                {hasActivity && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-primary'}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries Section */}
      <div className="flex-1 bg-background rounded-t-[2.5rem] border-t p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-24 min-h-[400px]">
        <h3 className="text-xl font-extrabold mb-6">
          {selectedDay ? `Entries on ${selectedDay}${ordinalSuffix(selectedDay)}` : 'Select a day'}
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-muted-foreground">Loading entries...</p>
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getColor(type)}`}>
                    {getIcon(type)}
                  </div>
                  <span className="font-bold text-sm text-foreground">{getLabel(type)}</span>
                  {items.length > 1 && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{items.length}</span>
                  )}
                </div>

                {/* Individual entries */}
                <div className="space-y-2 ml-2">
                  {items.map((entry) => (
                    <button
                      key={entry._id}
                      onClick={() => openDetail(entry)}
                      className="w-full text-left flex items-center p-3 rounded-2xl border bg-secondary/30 hover:bg-secondary transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{getEntryTitle(entry)}</h4>
                        <p className="text-xs text-muted-foreground truncate">{getEntrySub(entry)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2">
                        <Eye size={16} />
                        <span className="text-xs font-bold">View</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <span className="text-4xl mb-4">🤫</span>
            <p className="font-bold text-muted-foreground">No entries for this day.</p>
          </div>
        )}
      </div>

      {/* Detail Slide Panel */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDetailEntry(null); setIsEditing(false); }} />
          <div className="relative w-full max-w-md mx-auto bg-background rounded-t-[2rem] shadow-2xl border-t animate-in slide-in-from-bottom-8 duration-300 max-h-[85vh] overflow-y-auto">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 pb-3 border-b sticky top-0 bg-background z-10 rounded-t-[2rem]">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${getColor(detailEntry.type)}`}>
                  {getIcon(detailEntry.type)}
                </div>
                <h3 className="font-extrabold text-lg">{getLabel(detailEntry.type).replace(/s$/, '')}</h3>
              </div>
              <button onClick={() => { setDetailEntry(null); setIsEditing(false); }} className="p-2 rounded-full hover:bg-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Delete Confirmation */}
              {deleteConfirm === detailEntry._id && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-in fade-in">
                  <p className="font-bold text-red-600 text-sm mb-3">Are you sure you want to delete this entry?</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" className="flex-1" disabled={actionLoading}
                      onClick={() => deleteEntry(detailEntry._id, detailEntry.type)}>
                      {actionLoading ? "Deleting..." : "Yes, Delete"}
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {!isEditing ? (
                /* --- VIEW MODE --- */
                <>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {new Date(detailEntry.date).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {detailEntry.type === "workout" && detailEntry.exercises?.map((ex: any, i: number) => (
                    <div key={i} className="bg-secondary/50 rounded-2xl p-4">
                      <p className="font-bold mb-2">{ex.name}</p>
                      {ex.sets?.map((s: any, j: number) => (
                        <div key={j} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground">Set {j+1}</span>
                          <span className="font-bold">{s.weight ? `${s.weight}kg × ` : ''}{s.reps} reps — {s.effort}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {detailEntry.type === "cardio" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Activity</p>
                        <p className="font-extrabold text-lg">{detailEntry.activity_type || "Cardio"}</p>
                      </div>
                      <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Duration</p>
                        <p className="font-extrabold text-lg">{detailEntry.duration_minutes} min</p>
                      </div>
                      <div className="bg-secondary/50 rounded-2xl p-4 text-center col-span-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Distance</p>
                        <p className="font-extrabold text-lg">{detailEntry.distance_km} km</p>
                      </div>
                    </div>
                  )}

                  {detailEntry.type === "sleep" && (
                    <div className="bg-secondary/50 rounded-2xl p-6 text-center">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Duration</p>
                      <p className="font-extrabold text-3xl">{detailEntry.duration_hours} hrs</p>
                    </div>
                  )}

                  {detailEntry.type === "diet" && (
                    <div className="space-y-3">
                      <div className="bg-secondary/50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Meal</p>
                        <p className="font-extrabold text-lg">{detailEntry.meal_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Calories</p>
                          <p className="font-extrabold text-lg">{detailEntry.calories} kcal</p>
                        </div>
                        {detailEntry.protein_g != null && (
                          <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Protein</p>
                            <p className="font-extrabold text-lg">{detailEntry.protein_g}g</p>
                          </div>
                        )}
                        {detailEntry.carbs_g != null && (
                          <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Carbs</p>
                            <p className="font-extrabold text-lg">{detailEntry.carbs_g}g</p>
                          </div>
                        )}
                        {detailEntry.fat_g != null && (
                          <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Fat</p>
                            <p className="font-extrabold text-lg">{detailEntry.fat_g}g</p>
                          </div>
                        )}
                      </div>
                      {detailEntry.water_ml != null && detailEntry.water_ml > 0 && (
                        <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Water</p>
                          <p className="font-extrabold text-lg">{detailEntry.water_ml} ml</p>
                        </div>
                      )}
                      {detailEntry.supplements && detailEntry.supplements.length > 0 && (
                        <div className="bg-secondary/50 rounded-2xl p-4">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Supplements</p>
                          <div className="flex flex-wrap gap-2">
                            {detailEntry.supplements.map((s) => (
                              <span key={s} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" className="flex-1 h-12" onClick={startEdit}>
                      <Pencil size={16} className="mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" className="flex-1 h-12" onClick={() => setDeleteConfirm(detailEntry._id)}>
                      <Trash2 size={16} className="mr-2" /> Delete
                    </Button>
                  </div>
                </>
              ) : (
                /* --- EDIT MODE --- */
                <div className="space-y-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Editing</p>

                  {detailEntry.type === "sleep" && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Duration (hours)</label>
                      <Input type="number" step="0.5" value={editData.duration_hours}
                        onChange={(e) => setEditData({ ...editData, duration_hours: parseFloat(e.target.value) || 0 })} className="h-14 text-lg font-bold" />
                    </div>
                  )}

                  {detailEntry.type === "diet" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Meal Name</label>
                        <Input value={editData.meal_name} onChange={(e) => setEditData({ ...editData, meal_name: e.target.value })} className="h-14 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Calories</label>
                        <Input type="number" value={editData.calories} onChange={(e) => setEditData({ ...editData, calories: parseInt(e.target.value) || 0 })} className="h-14 font-bold" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Protein (g)</label>
                          <Input type="number" value={editData.protein_g} onChange={(e) => setEditData({ ...editData, protein_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Carbs (g)</label>
                          <Input type="number" value={editData.carbs_g} onChange={(e) => setEditData({ ...editData, carbs_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Fat (g)</label>
                          <Input type="number" value={editData.fat_g} onChange={(e) => setEditData({ ...editData, fat_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </>
                  )}

                  {detailEntry.type === "cardio" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Activity</label>
                        <div className="flex gap-2">
                          {["Walking", "Running"].map((t) => (
                            <button key={t} type="button" onClick={() => setEditData({ ...editData, activity_type: t })}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${editData.activity_type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Duration (min)</label>
                          <Input type="number" value={editData.duration_minutes}
                            onChange={(e) => setEditData({ ...editData, duration_minutes: parseInt(e.target.value) || 0 })} className="h-14 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Distance (km)</label>
                          <Input type="number" step="0.1" value={editData.distance_km}
                            onChange={(e) => setEditData({ ...editData, distance_km: parseFloat(e.target.value) || 0 })} className="h-14 font-bold" />
                        </div>
                      </div>
                    </>
                  )}

                  {detailEntry.type === "workout" && (
                    <p className="text-sm text-muted-foreground">To edit exercises, delete this and log a new workout.</p>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 h-12" onClick={saveEdit} disabled={actionLoading}>
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="secondary" className="flex-1 h-12" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
