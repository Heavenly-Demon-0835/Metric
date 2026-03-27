"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Star,
  Pencil,
  Trash2,
  X,
  Database,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import AddFoodDialog from "@/components/AddFoodDialog";
import type { FoodItemData } from "@/lib/macros";
import { HamburgerButton } from "@/components/Sidebar";

interface FoodItemFull extends FoodItemData {
  _id: string;
}

export default function FoodLibraryPage() {
  const [foods, setFoods] = useState<FoodItemFull[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchFoods = async () => {
    try {
      const res = await fetch(`${API_BASE}/food-library/`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setFoods(await res.json());
    } catch (err) {
      console.error("Failed to load foods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStaple = async (food: FoodItemFull) => {
    try {
      await fetch(`${API_BASE}/food-library/${food._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          ...food,
          is_staple: !food.is_staple,
          _id: undefined,
        }),
      });
      setFoods((prev) =>
        prev.map((f) =>
          f._id === food._id ? { ...f, is_staple: !f.is_staple } : f
        )
      );
    } catch (err) {
      console.error("Toggle staple failed:", err);
    }
  };

  const updateMealContext = async (food: FoodItemFull, ctx: string | null) => {
    try {
      await fetch(`${API_BASE}/food-library/${food._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          ...food,
          meal_context: ctx,
          _id: undefined,
        }),
      });
      setFoods((prev) =>
        prev.map((f) =>
          f._id === food._id ? { ...f, meal_context: ctx } : f
        )
      );
    } catch (err) {
      console.error("Update meal context failed:", err);
    }
  };

  const deleteFood = async (id: string) => {
    try {
      await fetch(`${API_BASE}/food-library/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setFoods((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <main className="flex flex-col min-h-screen pb-6">
      {/* Header */}
      <div className="bg-primary/10 p-6 pb-8 rounded-b-[2rem]">
        <header className="flex items-center justify-between mt-2 mb-6">
          <HamburgerButton />
          <Link
            href="/dashboard"
            className="text-primary text-sm font-bold hover:underline"
          >
            Dashboard
          </Link>
        </header>

        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform rotate-[-8deg] mb-2">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Food Library
          </h1>
          <p className="text-muted-foreground font-medium text-sm text-center max-w-[280px]">
            Manage your foods, presets, and staple items.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 mt-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search your library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12"
          />
        </div>

        {/* Food List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Database size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {search
                ? `No foods matching "${search}"`
                : "Your library is empty"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap the + button to add your first food.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((food) => (
              <div
                key={food._id}
                className="bg-card border rounded-2xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{food.name}</p>
                      {food.is_staple && (
                        <Star
                          size={12}
                          className="text-amber-500 fill-amber-500 shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {food.calories_per_100g} kcal · {food.protein_per_100g}g
                      P · {food.carbs_per_100g}g C · {food.fat_per_100g}g F
                      <span className="text-muted-foreground/50"> / 100g</span>
                    </p>
                    {food.meal_context && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-md capitalize">
                        {food.meal_context}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        setEditingId(editingId === food._id ? null : food._id)
                      }
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      {editingId === food._id ? (
                        <X size={14} />
                      ) : (
                        <Pencil size={14} className="text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteFood(food._id)}
                      className="p-2 hover:bg-red-100 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline Edit Panel */}
                {editingId === food._id && (
                  <div className="mt-3 pt-3 border-t space-y-3 animate-in fade-in">
                    {/* Staple Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Staple</span>
                      <button
                        onClick={() => toggleStaple(food)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          food.is_staple
                            ? "bg-amber-500"
                            : "bg-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            food.is_staple
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                    {/* Meal Context */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold">Meal Context</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["breakfast", "lunch", "dinner", "snack"].map(
                          (ctx) => (
                            <button
                              key={ctx}
                              onClick={() =>
                                updateMealContext(
                                  food,
                                  food.meal_context === ctx ? null : ctx
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                food.meal_context === ctx
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {ctx}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 max-w-md mx-auto w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-30 hover:shadow-2xl"
        aria-label="Add food"
      >
        <Plus size={24} />
      </button>

      <AddFoodDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => {
          fetchFoods();
        }}
      />
    </main>
  );
}
