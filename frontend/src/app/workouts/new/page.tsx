"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useEffect, useRef } from "react";

type SetRecord = {
  id: string;
  reps: string;
  weight: string;
  effort: string;
};

type ExerciseLog = {
  id: string;
  name: string;
  sets: SetRecord[];
};

export default function NewWorkout() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseLog[]>([
    { id: "1", name: "", sets: [{ id: "1-1", reps: "", weight: "", effort: "Reps in Reserve" }] }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Search state
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive the active search query separately to avoid depending on full exercises array
  const activeSearchQuery = activeSearchIndex !== null ? exercises[activeSearchIndex]?.name || "" : "";

  // Debounce search effect — depends only on the query string, not the array
  useEffect(() => {
    if (activeSearchIndex === null) {
      setSearchResults([]);
      return;
    }
    if (activeSearchQuery.trim().length < 2 || !isGlobalSearch) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/discovery/exercise?q=${encodeURIComponent(activeSearchQuery)}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) setSearchResults(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSearchQuery, activeSearchIndex, isGlobalSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveSearchIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addExercise = () => {
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: "", 
      sets: [{ id: Date.now().toString() + "-1", reps: "", weight: "", effort: "Reps in Reserve" }] 
    }]);
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: [...ex.sets, { id: Date.now().toString(), reps: "", weight: "", effort: "Reps in Reserve" }]
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, name } : ex));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof SetRecord, value: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const handleSave = async () => {
    setError("");
    const validExercises = exercises.filter(ex => ex.name.trim());
    if (validExercises.length === 0) {
      setError("Add at least one exercise with a name.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        exercises: validExercises.map(ex => ({
          name: ex.name,
          sets: ex.sets.filter(s => s.reps).map(s => ({
            reps: parseInt(s.reps) || 0,
            weight: s.weight ? parseFloat(s.weight) : null,
            effort: s.effort
          }))
        }))
      };

      const res = await fetch(`${API_BASE}/workouts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save workout");
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col p-6 min-h-screen pb-32">
      <header className="flex items-center justify-between mb-6 mt-2 pb-4 border-b">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight">Log Workout</h1>
        <div className="w-10" />
      </header>

      {error && <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg mb-4">{error}</div>}

      <div className="space-y-8">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-card border rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Exercise {index + 1}</span>
              {exercises.length > 1 && (
                <button 
                  onClick={() => removeExercise(exercise.id)}
                  className="text-destructive p-1 rounded-full hover:bg-destructive/10"
                  aria-label="Remove exercise"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            
            <div className="relative mb-4" ref={activeSearchIndex === index ? dropdownRef : null}>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Barbell Squat" 
                  value={exercise.name}
                  onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  onFocus={() => setActiveSearchIndex(index)}
                  className="pl-11 pr-24 font-bold"
                  autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="h-6 w-px bg-border(100)" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsGlobalSearch(!isGlobalSearch);
                      setSearchResults([]);
                    }}
                    className={`text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                      isGlobalSearch ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>

              {/* Autocomplete Dropdown */}
              {activeSearchIndex === index && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-2xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        updateExerciseName(exercise.id, result.name);
                        setActiveSearchIndex(null);
                      }}
                      className="w-full px-4 py-2.5 flex flex-col items-start hover:bg-secondary/50 transition-colors border-b last:border-b-0"
                    >
                      <span className="font-bold text-sm text-left truncate w-full">{result.name}</span>
                      <span className="text-[10px] text-muted-foreground">{result.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div className="w-12 text-center">Set</div>
                <div className="w-16 text-center">kg</div>
                <div className="w-16 text-center">Reps</div>
                <div className="flex-1 px-4 text-center">Effort</div>
                <div className="w-8"></div>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex gap-2 items-center">
                  <div className="w-12 text-center font-bold text-muted-foreground">
                    {setIndex + 1}
                  </div>
                  <Input 
                    type="number"
                    step="0.5"
                    value={set.weight}
                    onChange={(e) => updateSet(exercise.id, set.id, "weight", e.target.value)}
                    className="w-16 h-12 text-center font-bold px-1"
                    placeholder="-"
                  />
                  <Input 
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)}
                    className="w-16 h-12 text-center text-lg font-bold px-1"
                    placeholder="0"
                  />
                  <select 
                    value={set.effort}
                    onChange={(e) => updateSet(exercise.id, set.id, "effort", e.target.value)}
                    className="flex-1 h-12 rounded-2xl border border-input bg-background/50 px-2 text-sm font-semibold truncate ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Reps in Reserve">Reps in Reserve</option>
                    <option value="Near Failure">Near Failure</option>
                    <option value="Failure">Failure</option>
                  </select>
                  {exercise.sets.length > 1 ? (
                    <button 
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="w-8 h-12 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      aria-label="Remove set"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              ))}
            </div>

            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => addSet(exercise.id)}
              className="mt-6 w-full h-12 rounded-xl text-sm"
            >
              <Plus size={18} className="mr-2" />
              Add Set
            </Button>
          </div>
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={addExercise}
          className="w-full border-dashed border-2 py-8 bg-transparent text-muted-foreground hover:bg-secondary/50"
        >
          <Plus size={24} className="mr-2" />
          Add Exercise
        </Button>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t max-w-md mx-auto z-10 pt-4 pb-4">
        <Button onClick={handleSave} className="w-full h-14 text-lg shadow-xl shadow-primary/20" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Workout"}
        </Button>
      </div>
    </main>
  );
}
