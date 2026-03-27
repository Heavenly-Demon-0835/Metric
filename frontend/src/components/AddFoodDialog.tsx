"use client";

import { useState } from "react";
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

  // Reset form when dialog opens with new initial name
  useState(() => {
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
  });

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-background rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 pb-8 max-h-[85vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extrabold">Add to Food Library</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="food-name" className="text-sm font-bold ml-1">
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
              <label className="text-sm font-bold ml-1">
                Nutrition per 100g
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    kcal
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Protein"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="pr-6"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    g
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Carbs"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="pr-6"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    g
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Fat"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="pr-6"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    g
                  </span>
                </div>
              </div>
            </div>

            {/* Staple Toggle */}
            <div className="flex items-center justify-between bg-secondary/50 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Star
                  size={16}
                  className={isStaple ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}
                />
                <span className="text-sm font-bold">Mark as Staple</span>
              </div>
              <button
                type="button"
                onClick={() => setIsStaple(!isStaple)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  isStaple ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                    isStaple ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Meal Context */}
            {isStaple && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-sm font-bold ml-1">
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
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
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

            <Button
              type="submit"
              className="w-full h-14 text-lg shadow-xl shadow-primary/20 mt-4"
              disabled={saving || !name.trim() || !calories}
            >
              {saving ? "Saving..." : "Add to Library"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
