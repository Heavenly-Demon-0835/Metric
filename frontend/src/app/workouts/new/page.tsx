"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SetRecord = {
  id: string;
  reps: string;
  effort: string;
};

type ExerciseLog = {
  id: string;
  name: string;
  sets: SetRecord[];
};

export default function NewWorkout() {
  const [exercises, setExercises] = useState<ExerciseLog[]>([
    { id: "1", name: "", sets: [{ id: "1-1", reps: "", effort: "Reps in Reserve" }] }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: "", 
      sets: [{ id: Date.now().toString() + "-1", reps: "", effort: "Reps in Reserve" }] 
    }]);
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: [...ex.sets, { id: Date.now().toString(), reps: "", effort: "Reps in Reserve" }]
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

  const handleSave = () => {
    // TODO: implement logic
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

      <div className="space-y-8">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-card border rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Exercise {index + 1}</span>
              {exercises.length > 1 && (
                <button 
                  onClick={() => removeExercise(exercise.id)}
                  className="text-destructive p-1 rounded-full hover:bg-destructive/10"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            
            <Input 
              placeholder="e.g. Barbell Squat" 
              value={exercise.name}
              onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
              className="mb-4 font-bold"
            />

            <div className="space-y-3">
              <div className="flex px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div className="w-12 text-center">Set</div>
                <div className="w-20 text-center">Reps</div>
                <div className="flex-1 px-4">Effort</div>
                <div className="w-8"></div>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex gap-2 items-center">
                  <div className="w-12 text-center font-bold text-muted-foreground">
                    {setIndex + 1}
                  </div>
                  <Input 
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)}
                    className="w-20 h-12 text-center text-lg font-bold"
                    placeholder="0"
                  />
                  <select 
                    value={set.effort}
                    onChange={(e) => updateSet(exercise.id, set.id, "effort", e.target.value)}
                    className="flex-1 h-12 rounded-2xl border border-input bg-background/50 px-3 text-sm font-semibold truncate ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Reps in Reserve">Reps in Reserve</option>
                    <option value="Near Failure">Near Failure</option>
                    <option value="Failure">Failure</option>
                  </select>
                  {exercise.sets.length > 1 ? (
                    <button 
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="w-8 h-12 flex items-center justify-center text-muted-foreground hover:text-destructive"
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

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t max-w-md mx-auto">
        <Button onClick={handleSave} className="w-full h-14 text-lg shadow-xl shadow-primary/20">
          Save Workout
        </Button>
      </div>
    </main>
  );
}
