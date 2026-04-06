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

  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSearchQuery = activeSearchIndex !== null ? exercises[activeSearchIndex]?.name || "" : "";

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
    <main className="flex flex-col px-8 py-6 min-h-screen pb-32">
      <header className="flex items-center justify-between mb-8 mt-2">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Log Workout</h1>
        <div className="w-10" />
      </header>

      {error && <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl mb-4">{error}</div>}

      <div className="space-y-6">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="pb-6 border-b border-border last:border-b-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-medium text-muted-foreground">Exercise {index + 1}</span>
              {exercises.length > 1 && (
                <button 
                  onClick={() => removeExercise(exercise.id)}
                  className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  aria-label="Remove exercise"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
            
            <div className="relative mb-4" ref={activeSearchIndex === index ? dropdownRef : null}>
              <div className="relative">
                <Search size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Barbell Squat" 
                  value={exercise.name}
                  onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  onFocus={() => setActiveSearchIndex(index)}
                  className="pl-11 pr-24 font-medium"
                  autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGlobalSearch(!isGlobalSearch);
                      setSearchResults([]);
                    }}
                    className={`text-[10px] font-medium px-2 py-1.5 rounded-lg transition-colors ${
                      isGlobalSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>

              {activeSearchIndex === index && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        updateExerciseName(exercise.id, result.name);
                        setActiveSearchIndex(null);
                      }}
                      className="w-full px-4 py-2.5 flex flex-col items-start hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
                    >
                      <span className="font-medium text-sm text-left truncate w-full">{result.name}</span>
                      <span className="text-[10px] text-muted-foreground">{result.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex px-1 text-[10px] font-medium text-muted-foreground">
                <div className="w-10 text-center">Set</div>
                <div className="w-16 text-center">kg</div>
                <div className="w-16 text-center">Reps</div>
                <div className="flex-1 px-2 text-center">Effort</div>
                <div className="w-8"></div>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex gap-1.5 items-center">
                  <div className="w-10 text-center font-medium text-xs text-muted-foreground">
                    {setIndex + 1}
                  </div>
                  <Input 
                    type="number"
                    step="0.5"
                    value={set.weight}
                    onChange={(e) => updateSet(exercise.id, set.id, "weight", e.target.value)}
                    className="w-16 h-11 text-center font-medium px-1 text-sm"
                    placeholder="-"
                  />
                  <Input 
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)}
                    className="w-16 h-11 text-center font-medium px-1 text-sm"
                    placeholder="0"
                  />
                  <select 
                    value={set.effort}
                    onChange={(e) => updateSet(exercise.id, set.id, "effort", e.target.value)}
                    className="flex-1 h-11 rounded-xl border border-border bg-transparent px-2 text-xs font-medium truncate outline-none focus:border-primary transition-colors"
                  >
                    <option value="Reps in Reserve">Reps in Reserve</option>
                    <option value="Near Failure">Near Failure</option>
                    <option value="Failure">Failure</option>
                  </select>
                  {exercise.sets.length > 1 ? (
                    <button 
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="w-8 h-11 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove set"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              ))}
            </div>

            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => addSet(exercise.id)}
              className="mt-4 w-full h-10 text-xs text-muted-foreground"
            >
              <Plus size={14} className="mr-1.5" />
              Add Set
            </Button>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={addExercise}
          className="w-full py-6 border border-dashed border-border rounded-xl text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-muted-foreground transition-colors"
        >
          <Plus size={18} strokeWidth={1.5} />
          Add Exercise
        </button>
      </div>

      <div className="sticky bottom-0 left-0 right-0 px-8 py-4 bg-background/90 backdrop-blur-sm max-w-md mx-auto z-10">
        <Button onClick={handleSave} className="w-full h-13" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Workout"}
        </Button>
      </div>
    </main>
  );
}
