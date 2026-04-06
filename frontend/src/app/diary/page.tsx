"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Activity, Apple, Moon, Dumbbell, X, Trash2, Pencil, Eye, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { parseAPIDate } from "@/lib/utils";

interface RawEntry {
  _id: string;
  type: "workout" | "cardio" | "sleep" | "diet";
  date: string;
  exercises?: any[];
  duration_minutes?: number;
  distance_km?: number;
  activity_type?: string;
  duration_hours?: number;
  quality?: string;
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
    const monthParam = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    try {
      const [workouts, cardio, sleep, diet] = await Promise.all([
        fetch(`${API_BASE}/workouts/?month=${monthParam}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/cardio/?month=${monthParam}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/sleep/?month=${monthParam}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/diet/?month=${monthParam}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      workouts.forEach((w: any) => all.push({ ...w, type: "workout" }));
      cardio.forEach((c: any) => all.push({ ...c, type: "cardio" }));
      sleep.forEach((s: any) => all.push({ ...s, type: "sleep" }));
      diet.forEach((d: any) => all.push({ ...d, type: "diet" }));
    } catch {}

    setEntries(all);
    setIsLoading(false);
  }, [currentDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const activeDays = new Set<number>();
  entries.forEach((e) => {
    const d = parseAPIDate(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) activeDays.add(d.getDate());
  });

  const dayEntries = selectedDay
    ? entries.filter((e) => {
        const d = parseAPIDate(e.date);
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
      case "workout": return <div className="p-2 bg-primary/10 text-primary rounded-xl"><Dumbbell size={18} strokeWidth={1.5} /></div>;
      case "cardio": return <div className="p-2 bg-primary/10 text-primary rounded-xl"><Footprints size={18} strokeWidth={1.5} /></div>;
      case "sleep": return <div className="p-2 bg-sky-100 text-sky-600 rounded-xl"><Moon size={18} strokeWidth={1.5} /></div>;
      case "diet": return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Apple size={18} strokeWidth={1.5} /></div>;
      default: return <div className="p-2 bg-secondary text-muted-foreground rounded-xl"><Activity size={18} strokeWidth={1.5} /></div>;
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
      case "cardio": return `${e.duration_minutes ?? 0} min · ${e.distance_km ?? 0} km`;
      case "sleep": return e.quality || "";
      case "diet": return `${e.calories ?? 0} kcal`;
      default: return "";
    }
  };

  const ordinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
  };

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
    <main className="flex flex-col min-h-screen pb-20">
      <header className="flex items-center justify-between px-8 py-6 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Diary</h1>
        <button
          onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); }}
          className="text-primary font-medium text-xs"
        >Today</button>
      </header>

      {/* Calendar Header */}
      <div className="px-8 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button onClick={nextMonth} className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Grid Calendar */}
      <div className="px-8 mb-8">
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center w-full">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] font-medium text-muted-foreground mb-1">{d}</div>
          ))}
          {Array.from({length: startOffset}).map((_, i) => <div key={`offset-${i}`}></div>)}
          {daysArray.map(d => {
            const hasActivity = activeDays.has(d);
            const isSelected = selectedDay === d;
            return (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`relative flex flex-col items-center justify-center h-11 rounded-xl transition-all text-sm font-medium
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'}`}>
                {d}
                {hasActivity && <div className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries Section */}
      <div className="flex-1 px-8 pb-24 min-h-[300px]">
        <h3 className="text-base font-semibold mb-6">
          {selectedDay ? `${selectedDay}${ordinalSuffix(selectedDay)}` : 'Select a day'}
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Loading...</p>
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  {getIcon(type)}
                  <span className="text-xs font-medium text-muted-foreground">{getLabel(type)}</span>
                  {items.length > 1 && (
                    <span className="text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">{items.length}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {items.map((entry) => (
                    <button
                      key={entry._id}
                      onClick={() => openDetail(entry)}
                      className="w-full text-left flex items-center py-3 px-1 hover:bg-secondary/50 rounded-xl transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{getEntryTitle(entry)}</h4>
                        <p className="text-xs text-muted-foreground truncate">{getEntrySub(entry)}</p>
                      </div>
                      <Eye size={14} strokeWidth={1.5} className="text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-sm font-medium">No entries for this day</p>
          </div>
        )}
      </div>

      {/* Detail Slide Panel */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => { setDetailEntry(null); setIsEditing(false); }} />
          <div className="relative w-full max-w-md mx-auto bg-background rounded-t-2xl border-t max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-background z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {getIcon(detailEntry.type)}
                <h3 className="font-semibold">{getLabel(detailEntry.type).replace(/s$/, '')}</h3>
              </div>
              <button onClick={() => { setDetailEntry(null); setIsEditing(false); }} className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {deleteConfirm === detailEntry._id && (
                <div className="bg-destructive/8 rounded-xl p-4">
                  <p className="text-destructive text-sm font-medium mb-3">Delete this entry?</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" className="flex-1" disabled={actionLoading}
                      onClick={() => deleteEntry(detailEntry._id, detailEntry.type)}>
                      {actionLoading ? "Deleting..." : "Delete"}
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {!isEditing ? (
                <>
                  <div className="text-xs font-medium text-muted-foreground">
                    {parseAPIDate(detailEntry.date).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {detailEntry.type === "workout" && detailEntry.exercises?.map((ex: any, i: number) => (
                    <div key={i} className="bg-secondary/40 rounded-xl p-4">
                      <p className="font-medium text-sm mb-2">{ex.name}</p>
                      {ex.sets?.map((s: any, j: number) => (
                        <div key={j} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground">Set {j+1}</span>
                          <span className="font-medium">{s.weight ? `${s.weight}kg × ` : ''}{s.reps} reps — {s.effort}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {detailEntry.type === "cardio" && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Activity", value: detailEntry.activity_type || "Cardio" },
                        { label: "Duration", value: `${detailEntry.duration_minutes} min` },
                        { label: "Distance", value: `${detailEntry.distance_km} km` },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-secondary/40 rounded-xl p-3 text-center">
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">{stat.label}</p>
                          <p className="font-semibold text-sm">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailEntry.type === "sleep" && (
                    <div className="bg-secondary/40 rounded-xl p-5 text-center">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">Duration</p>
                      <p className="font-semibold text-2xl">{detailEntry.duration_hours} hrs</p>
                    </div>
                  )}

                  {detailEntry.type === "diet" && (
                    <div className="space-y-3">
                      <div className="bg-secondary/40 rounded-xl p-4">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Meal</p>
                        <p className="font-semibold">{detailEntry.meal_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Calories", value: `${detailEntry.calories} kcal`, show: true },
                          { label: "Protein", value: `${detailEntry.protein_g}g`, show: detailEntry.protein_g != null },
                          { label: "Carbs", value: `${detailEntry.carbs_g}g`, show: detailEntry.carbs_g != null },
                          { label: "Fat", value: `${detailEntry.fat_g}g`, show: detailEntry.fat_g != null },
                        ].filter(s => s.show).map((stat) => (
                          <div key={stat.label} className="bg-secondary/40 rounded-xl p-3 text-center">
                            <p className="text-[10px] font-medium text-muted-foreground mb-1">{stat.label}</p>
                            <p className="font-semibold text-sm">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      {detailEntry.water_ml != null && detailEntry.water_ml > 0 && (
                        <div className="bg-secondary/40 rounded-xl p-3 text-center">
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Water</p>
                          <p className="font-semibold text-sm">{detailEntry.water_ml} ml</p>
                        </div>
                      )}
                      {detailEntry.supplements && detailEntry.supplements.length > 0 && (
                        <div className="bg-secondary/40 rounded-xl p-4">
                          <p className="text-[10px] font-medium text-muted-foreground mb-2">Supplements</p>
                          <div className="flex flex-wrap gap-2">
                            {detailEntry.supplements.map((s) => (
                              <span key={s} className="bg-primary/8 text-primary text-xs font-medium px-3 py-1 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 h-12" onClick={startEdit}>
                      <Pencil size={14} strokeWidth={1.5} className="mr-2" /> Edit
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeleteConfirm(detailEntry._id)}>
                      <Trash2 size={14} strokeWidth={1.5} className="mr-2" /> Delete
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-medium text-primary">Editing</p>

                  {detailEntry.type === "sleep" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Duration (hours)</label>
                      <Input type="number" step="0.5" value={editData.duration_hours}
                        onChange={(e) => setEditData({ ...editData, duration_hours: parseFloat(e.target.value) || 0 })} className="h-13 font-medium" />
                    </div>
                  )}

                  {detailEntry.type === "diet" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Meal Name</label>
                        <Input value={editData.meal_name} onChange={(e) => setEditData({ ...editData, meal_name: e.target.value })} className="h-13 font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Calories</label>
                        <Input type="number" value={editData.calories} onChange={(e) => setEditData({ ...editData, calories: parseInt(e.target.value) || 0 })} className="h-13 font-medium" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "protein_g", label: "Protein (g)" },
                          { key: "carbs_g", label: "Carbs (g)" },
                          { key: "fat_g", label: "Fat (g)" },
                        ].map((field) => (
                          <div key={field.key} className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
                            <Input type="number" value={editData[field.key]} onChange={(e) => setEditData({ ...editData, [field.key]: parseFloat(e.target.value) || 0 })} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {detailEntry.type === "cardio" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Activity</label>
                        <div className="flex gap-2">
                          {["Walking", "Running"].map((t) => (
                            <button key={t} type="button" onClick={() => setEditData({ ...editData, activity_type: t })}
                              className={`flex-1 py-3 rounded-full text-sm font-medium border transition-all ${editData.activity_type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Duration (min)</label>
                          <Input type="number" value={editData.duration_minutes}
                            onChange={(e) => setEditData({ ...editData, duration_minutes: parseInt(e.target.value) || 0 })} className="h-13 font-medium" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Distance (km)</label>
                          <Input type="number" step="0.1" value={editData.distance_km}
                            onChange={(e) => setEditData({ ...editData, distance_km: parseFloat(e.target.value) || 0 })} className="h-13 font-medium" />
                        </div>
                      </div>
                    </>
                  )}

                  {detailEntry.type === "workout" && (
                    <p className="text-sm text-muted-foreground">To edit exercises, delete this and log a new workout.</p>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 h-12" onClick={saveEdit} disabled={actionLoading}>
                      {actionLoading ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" className="flex-1 h-12" onClick={() => setIsEditing(false)}>Cancel</Button>
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
