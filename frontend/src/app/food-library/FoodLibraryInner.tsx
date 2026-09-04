"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Star, Pencil, Trash2, X, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiSend } from "@/lib/api";
import AddFoodDialog from "@/components/AddFoodDialog";
import { database } from "@/db";
import { useLiveQuery } from "@/db/useLiveQuery";

export default function FoodLibraryInner() {
  const foods = useLiveQuery<any>("food_items");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const toggleStaple = async (food: any) => {
    try {
      await database?.write(async () => {
        await food.update((f: any) => {
          f.isStaple = !f.isStaple;
        });
      });

      apiSend("PUT", `/food-library/${food.id}`, {
        name: food.name,
        calories_per_100g: food.caloriesPer100g,
        protein_per_100g: food.proteinPer100g,
        carbs_per_100g: food.carbsPer100g,
        fat_per_100g: food.fatPer100g,
        is_staple: food.isStaple,
        meal_context: food.mealContext,
      }).catch(console.error);
    } catch (err) {
      console.error("Toggle staple failed:", err);
    }
  };

  const updateMealContext = async (food: any, ctx: string | null) => {
    try {
      await database?.write(async () => {
        await food.update((f: any) => {
          f.mealContext = ctx || undefined;
        });
      });

      apiSend("PUT", `/food-library/${food.id}`, {
        name: food.name,
        calories_per_100g: food.caloriesPer100g,
        protein_per_100g: food.proteinPer100g,
        carbs_per_100g: food.carbsPer100g,
        fat_per_100g: food.fatPer100g,
        is_staple: food.isStaple,
        meal_context: food.mealContext,
      }).catch(console.error);
    } catch (err) {
      console.error("Update meal context failed:", err);
    }
  };

  const deleteFood = async (food: any) => {
    try {
      await database?.write(async () => {
        await food.markAsDeleted();
      });

      apiSend("DELETE", `/food-library/${food.id}`).catch(console.error);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <main className="flex flex-col min-h-screen pb-28">
      <header className="flex items-center justify-between px-8 py-6 mt-2">
        <div className="w-10" />
        <h1 className="text-lg font-bold tracking-tight">Food Library</h1>
        <div className="w-10" />
      </header>

      <div className="px-8 space-y-4 flex-1 mt-2">
        <div className="relative">
          <Search size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Database size={32} strokeWidth={1.5} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {search ? `No foods matching "${search}"` : "Your library is empty"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tap + to add your first food.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filtered.map((food) => (
              <div key={food.id} className="py-4 border-b border-border last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{food.name}</p>
                      {food.isStaple && <Star size={10} className="text-primary fill-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {food.caloriesPer100g} kcal · {food.proteinPer100g}g P · {food.carbsPer100g}g C · {food.fatPer100g}g F
                      <span className="text-muted-foreground/50"> / 100g</span>
                    </p>
                    {food.mealContext && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded capitalize">
                        {food.mealContext}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(editingId === food.id ? null : food.id)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {editingId === food.id ? <X size={14} strokeWidth={1.5} /> : <Pencil size={14} strokeWidth={1.5} />}
                    </button>
                    {editingId === food.id && (
                      <button
                        onClick={() => deleteFood(food)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === food.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Staple</span>
                      <button
                        onClick={() => toggleStaple(food)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${food.isStaple ? "bg-primary" : "bg-muted-foreground/20"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${food.isStaple ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium">Meal Context</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["breakfast", "lunch", "dinner", "snack"].map((ctx) => (
                          <button
                            key={ctx}
                            onClick={() => updateMealContext(food, food.mealContext === ctx ? null : ctx)}
                            className={`px-2.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${food.mealContext === ctx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                          >
                            {ctx}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offset clears the floating tab pill (~63px tall, 0.75rem off the bottom)
          plus the iPhone home indicator, so the FAB stays reachable once the
          list is long enough to scroll. */}
      <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] flex justify-end px-8 z-30 pointer-events-none mt-auto">
        <button
          onClick={() => setShowAdd(true)}
          className="w-13 h-13 grad-violet text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform pointer-events-auto"
        >
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>

      <AddFoodDialog open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => {}} />
    </main>
  );
}
