"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Star, Pencil, Trash2, X, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import AddFoodDialog from "@/components/AddFoodDialog";
import { HamburgerButton } from "@/components/Sidebar";
import { database } from "@/db";

export default function FoodLibraryInner() {
  const [foods, setFoods] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!database) return;
    const sub = database.collections.get("food_items").query().observe().subscribe(setFoods);
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const toggleStaple = async (food: any) => {
    try {
      // Optistic local update
      await database?.write(async () => {
        await food.update((f: any) => {
          f.isStaple = !f.isStaple;
        });
      });

      // Background API sync
      fetch(`${API_BASE}/food-library/${food.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: food.name,
          calories_per_100g: food.caloriesPer100g,
          protein_per_100g: food.proteinPer100g,
          carbs_per_100g: food.carbsPer100g,
          fat_per_100g: food.fatPer100g,
          is_staple: food.isStaple,
          meal_context: food.mealContext,
        }),
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

      fetch(`${API_BASE}/food-library/${food.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: food.name,
          calories_per_100g: food.caloriesPer100g,
          protein_per_100g: food.proteinPer100g,
          carbs_per_100g: food.carbsPer100g,
          fat_per_100g: food.fatPer100g,
          is_staple: food.isStaple,
          meal_context: food.mealContext,
        }),
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

      fetch(`${API_BASE}/food-library/${food.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }).catch(console.error);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <main className="flex flex-col min-h-screen pb-6 animate-in fade-in">
      <div className="bg-primary/10 p-6 pb-8 rounded-b-[2rem]">
        <header className="flex items-center justify-between mt-2 mb-6">
          <HamburgerButton />
        </header>

        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform rotate-[-8deg] mb-2">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Food Library</h1>
          <p className="text-muted-foreground font-medium text-sm text-center max-w-[280px]">
            Manage your foods, presets, and staple items.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 mt-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Database size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {search ? `No foods matching "${search}"` : "Your library is empty"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tap the + button to add your first food.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((food) => (
              <div key={food.id} className="bg-card border rounded-2xl p-4 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{food.name}</p>
                      {food.isStaple && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {food.caloriesPer100g} kcal · {food.proteinPer100g}g P · {food.carbsPer100g}g C · {food.fatPer100g}g F
                      <span className="text-muted-foreground/50"> / 100g</span>
                    </p>
                    {food.mealContext && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-md capitalize">
                        {food.mealContext}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(editingId === food.id ? null : food.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      {editingId === food.id ? <X size={14} /> : <Pencil size={14} className="text-muted-foreground" />}
                    </button>
                    {editingId === food.id && (
                      <button
                        onClick={() => deleteFood(food)}
                        className="p-2 hover:bg-red-100 text-red-400 hover:text-red-500 rounded-lg transition-colors mt-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === food.id && (
                  <div className="mt-3 pt-3 border-t space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Staple</span>
                      <button
                        onClick={() => toggleStaple(food)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${food.isStaple ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${food.isStaple ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold">Meal Context</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["breakfast", "lunch", "dinner", "snack"].map((ctx) => (
                          <button
                            key={ctx}
                            onClick={() => updateMealContext(food, food.mealContext === ctx ? null : ctx)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${food.mealContext === ctx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
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

      <div className="sticky bottom-6 flex justify-end px-6 z-30 pointer-events-none mt-auto">
        <button
          onClick={() => setShowAdd(true)}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform hover:shadow-2xl pointer-events-auto"
        >
          <Plus size={24} />
        </button>
      </div>

      <AddFoodDialog open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => {}} />
    </main>
  );
}
