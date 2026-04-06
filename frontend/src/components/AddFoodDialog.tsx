"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import type { FoodItemData } from "@/lib/macros";

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (food: FoodItemData) => void;
  initialName?: string;
}

export default function AddFoodDialog({
  open,
  onClose,
  onCreated,
  initialName = "",
}: AddFoodDialogProps) {
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isStaple, setIsStaple] = useState(false);
  const [mealContext, setMealContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName);
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setIsStaple(false);
      setMealContext("");
      setError("");
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: name.trim(),
      calories_per_100g: parseFloat(calories) || 0,
      protein_per_100g: parseFloat(protein) || 0,
      carbs_per_100g: parseFloat(carbs) || 0,
      fat_per_100g: parseFloat(fat) || 0,
      is_staple: isStaple,
      meal_context: mealContext || null,
    };

    try {
      const res = await fetch(`${API_BASE}/food-library/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setError(`"${payload.name}" already exists in your library.`);
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to save food item");

      const insertedId = await res.json();
      
      try {
        const { database } = await import("@/db");
        if (database) {
          await database.write(async () => {
            await database.get("food_items").create((record: any) => {
              record._raw.id = insertedId;
              record.name = payload.name;
              record.caloriesPer100g = payload.calories_per_100g;
              record.proteinPer100g = payload.protein_per_100g;
              record.carbsPer100g = payload.carbs_per_100g;
              record.fatPer100g = payload.fat_per_100g;
              record.isStaple = payload.is_staple;
              record.mealContext = payload.meal_context || undefined;
              record.userId = "auth-user";
            });
          });
        }
      } catch (err) {
        console.error("Local DB insert skipped:", err);
      }

      onCreated({ ...payload, _id: insertedId });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/20"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-background rounded-t-2xl">
        <div className="p-6 pb-8 max-h-[85vh] overflow-y-auto">
          <div className="w-8 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold">Add to Food Library</h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="food-name" className="text-xs font-medium text-muted-foreground ml-1">
                Food Name
              </label>
              <Input
                id="food-name"
                placeholder="e.g. Chicken Breast"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground ml-1">
                Nutrition per 100g
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { placeholder: "Calories", value: calories, set: setCalories, unit: "kcal", required: true },
                  { placeholder: "Protein", value: protein, set: setProtein, unit: "g", required: false },
                  { placeholder: "Carbs", value: carbs, set: setCarbs, unit: "g", required: false },
                  { placeholder: "Fat", value: fat, set: setFat, unit: "g", required: false },
                ].map((field) => (
                  <div key={field.placeholder} className="relative">
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      required={field.required}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      {field.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staple Toggle */}
            <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Star
                  size={14}
                  strokeWidth={1.5}
                  className={isStaple ? "text-primary fill-primary" : "text-muted-foreground"}
                />
                <span className="text-sm font-medium">Mark as Staple</span>
              </div>
              <button
                type="button"
                onClick={() => setIsStaple(!isStaple)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  isStaple ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    isStaple ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Meal Context */}
            {isStaple && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Best for (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["breakfast", "lunch", "dinner", "snack"].map((ctx) => (
                    <button
                      key={ctx}
                      type="button"
                      onClick={() =>
                        setMealContext(mealContext === ctx ? "" : ctx)
                      }
                      className={`px-3 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                        mealContext === ctx
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {ctx}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-13"
                disabled={saving || !name.trim() || !calories}
              >
                {saving ? "Saving..." : "Add to Library"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
