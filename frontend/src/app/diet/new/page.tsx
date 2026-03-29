"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Apple,
  Check,
  ChevronDown,
  Search,
  X,
  Star,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import {
  calculateMacros,
  evaluateWeightExpression,
  getMealContext,
  type FoodItemData,
  type FoodMacros,
} from "@/lib/macros";
import AddFoodDialog from "@/components/AddFoodDialog";

interface SelectedItem {
  food: FoodItemData;
  weightExpr: string;
  weightG: number;
  macros: FoodMacros;
}

export default function NewDietEntry() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItemData[]>([]);
  const [staples, setStaples] = useState<FoodItemData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Global search state
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);

  // AddFoodDialog state
  const [showAddFood, setShowAddFood] = useState(false);

  // Selected food items
  const [items, setItems] = useState<SelectedItem[]>([]);

  // Legacy fields for manual entry fallback
  const [manualMode, setManualMode] = useState(false);
  const [mealName, setMealName] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  // Macros toggle (manual mode)
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  // Supplements
  const [supplements, setSupplements] = useState<string[]>([]);
  const [newSupplement, setNewSupplement] = useState("");

  // Load staples on mount
  useEffect(() => {
    const ctx = getMealContext();
    fetch(`${API_BASE}/food-library/staples?context=${ctx}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then(setStaples)
      .catch(() => {});
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const endpoint = isGlobalSearch
          ? `${API_BASE}/discovery/food?q=${encodeURIComponent(searchQuery)}`
          : `${API_BASE}/food-library/search?q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(endpoint, { headers: getAuthHeaders() });
        if (res.ok) setSearchResults(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isGlobalSearch]);

  // Click outside to close search results
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Aggregate totals from items
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.macros.calories,
        protein: acc.protein + item.macros.protein,
        carbs: acc.carbs + item.macros.carbs,
        fat: acc.fat + item.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items]);

  const selectFood = (food: any) => {
    const macros = calculateMacros(food, 100);
    setItems((prev) => [
      ...prev,
      { food, weightExpr: "100", weightG: 100, macros },
    ]);
    setSearchQuery("");
    setShowResults(false);
  };

  const importAndSelectFood = async (food: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const payload = {
        name: food.name,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fat_per_100g: food.fat_per_100g,
        is_staple: false,
      };
      const res = await fetch(`${API_BASE}/food-library/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 409) {
        // Even if 409 (duplicate), we can just select the food directly
        selectFood(food);
      }
    } catch {
      selectFood(food); // Fallback to just using it without saving if network issues
    }
  };

  const updateItemWeight = (index: number, expr: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const weightG = evaluateWeightExpression(expr);
        return {
          ...item,
          weightExpr: expr,
          weightG,
          macros: calculateMacros(item.food, weightG),
        };
      })
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSupplement = () => {
    if (newSupplement.trim() && !supplements.includes(newSupplement.trim())) {
      setSupplements([...supplements, newSupplement.trim()]);
    }
    setNewSupplement("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload: any = {};

      if (manualMode || items.length === 0) {
        // Legacy manual entry
        payload.meal_name = mealName || "Manual Entry";
        payload.calories = parseInt(manualCalories) || 0;
        if (protein) payload.protein_g = parseFloat(protein);
        if (carbs) payload.carbs_g = parseFloat(carbs);
        if (fat) payload.fat_g = parseFloat(fat);
      } else {
        // Food library entry
        payload.meal_name = items.map((i) => i.food.name).join(" + ");
        payload.calories = totals.calories;
        payload.protein_g = totals.protein;
        payload.carbs_g = totals.carbs;
        payload.fat_g = totals.fat;
        payload.items = items.map((i) => ({
          food_id: i.food._id || null,
          food_name: i.food.name,
          weight_g: i.weightG,
          calories: i.macros.calories,
          protein_g: i.macros.protein,
          carbs_g: i.macros.carbs,
          fat_g: i.macros.fat,
        }));
      }

      if (supplements.length > 0) payload.supplements = supplements;

      const res = await fetch(`${API_BASE}/diet/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save diet entry");
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen pb-6">
      <div className="bg-primary/10 p-6 pb-8 rounded-b-[2rem]">
        <header className="flex items-center justify-between mt-2 mb-6">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 text-primary hover:bg-primary/20 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div className="w-10 text-primary text-sm font-bold flex justify-end">
            Diary
          </div>
        </header>

        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform rotate-[-8deg] mb-2">
            <Apple size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Log a Meal
          </h1>
          <p className="text-muted-foreground font-medium text-sm text-center max-w-[280px]">
            Search your food library or enter macros manually.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-5 flex-1 mt-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex rounded-2xl bg-secondary p-1 gap-1">
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              !manualMode
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Search size={14} className="inline mr-1.5 -mt-0.5" />
            Food Search
          </button>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              manualMode
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Calculator size={14} className="inline mr-1.5 -mt-0.5" />
            Manual
          </button>
        </div>

        {!manualMode ? (
          <>
            {/* Staple Chips */}
            {staples.length > 0 && items.length === 0 && (
              <div className="space-y-2 animate-in fade-in">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  {getMealContext()} staples
                </p>
                <div className="flex flex-wrap gap-2">
                  {staples.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => selectFood(s)}
                      className="px-3.5 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform hover:bg-primary/20"
                    >
                      <Star size={12} />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Palette */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="food-search"
                  placeholder="Search foods... e.g. chicken breast"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="pl-11 pr-24 h-14 text-base"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="h-6 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsGlobalSearch(!isGlobalSearch);
                      setSearchResults([]);
                    }}
                    className={`text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                      isGlobalSearch
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {searchResults.map((food: any) => (
                    <button
                      key={food.id || food._id}
                      type="button"
                      onClick={() => !isGlobalSearch && selectFood(food)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left border-b last:border-b-0"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-bold text-sm truncate">{food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.calories_per_100g} kcal · {food.protein_per_100g}
                          g P · {food.carbs_per_100g}g C · {food.fat_per_100g}g F
                          <span className="text-muted-foreground/50">
                            {" "}
                            / 100g
                          </span>
                        </p>
                        {isGlobalSearch && food.brand && (
                          <span className="text-[10px] uppercase font-bold text-primary mt-1 inline-block bg-primary/10 px-1.5 py-0.5 rounded">
                            {food.brand}
                          </span>
                        )}
                      </div>
                      {isGlobalSearch ? (
                        <div
                          onClick={(e) => importAndSelectFood(food, e)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                          Import
                        </div>
                      ) : (
                        <Plus size={18} className="text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showResults &&
                searchQuery.trim() &&
                searchResults.length === 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-xl p-4 text-center animate-in fade-in">
                    <p className="text-sm text-muted-foreground">
                      No foods found for &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResults(false);
                        setShowAddFood(true);
                      }}
                      className="mt-3 w-full py-3 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add &ldquo;{searchQuery}&rdquo; to Library
                    </button>
                  </div>
                )}
            </div>

            {/* Selected Items List */}
            {items.length > 0 && (
              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-sm font-bold ml-1">
                  Items ({items.length})
                </h3>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-card border rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{item.food.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={item.weightExpr}
                          onChange={(e) =>
                            updateItemWeight(idx, e.target.value)
                          }
                          className="text-center font-bold pr-6"
                          placeholder="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          g
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Cal
                        </p>
                        <p className="text-sm font-extrabold">
                          {item.macros.calories}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Protein
                        </p>
                        <p className="text-sm font-extrabold text-blue-500">
                          {item.macros.protein}g
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Carbs
                        </p>
                        <p className="text-sm font-extrabold text-amber-500">
                          {item.macros.carbs}g
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Fat
                        </p>
                        <p className="text-sm font-extrabold text-rose-400">
                          {item.macros.fat}g
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totals Bar */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                    Total
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-extrabold">
                        {totals.calories}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        kcal
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-blue-500">
                        {totals.protein}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        g prot
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-amber-500">
                        {totals.carbs}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        g carb
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-rose-400">
                        {totals.fat}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        g fat
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Manual Mode */
          <section className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
              <label htmlFor="diet-meal" className="text-sm font-bold ml-1">
                Meal Name
              </label>
              <Input
                id="diet-meal"
                placeholder="e.g. Chicken & Rice"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                required={manualMode}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="diet-calories"
                className="text-sm font-bold ml-1"
              >
                Total Calories (kcal)
              </label>
              <Input
                id="diet-calories"
                type="number"
                placeholder="0"
                value={manualCalories}
                onChange={(e) => setManualCalories(e.target.value)}
                required={manualMode}
                className="text-lg font-bold"
              />
            </div>

            {/* Macros Toggle */}
            <button
              type="button"
              onClick={() => setShowMacros(!showMacros)}
              className="flex items-center gap-2 font-bold text-sm text-primary hover:underline py-2"
            >
              {showMacros ? "Hide" : "Add"} Macronutrients (Optional){" "}
              <ChevronDown
                size={16}
                className={`transition-transform ${showMacros ? "rotate-180" : ""}`}
              />
            </button>

            {showMacros && (
              <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label
                    htmlFor="diet-protein"
                    className="text-xs font-bold text-muted-foreground uppercase text-center block"
                  >
                    Protein
                  </label>
                  <div className="relative">
                    <Input
                      id="diet-protein"
                      type="number"
                      placeholder="0"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="text-center font-bold pr-6"
                    />
                    <span className="absolute right-3 top-[14px] text-xs font-bold text-muted-foreground">
                      g
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="diet-carbs"
                    className="text-xs font-bold text-muted-foreground uppercase text-center block"
                  >
                    Carbs
                  </label>
                  <div className="relative">
                    <Input
                      id="diet-carbs"
                      type="number"
                      placeholder="0"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      className="text-center font-bold pr-6"
                    />
                    <span className="absolute right-3 top-[14px] text-xs font-bold text-muted-foreground">
                      g
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="diet-fat"
                    className="text-xs font-bold text-muted-foreground uppercase text-center block"
                  >
                    Fats
                  </label>
                  <div className="relative">
                    <Input
                      id="diet-fat"
                      type="number"
                      placeholder="0"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      className="text-center font-bold pr-6"
                    />
                    <span className="absolute right-3 top-[14px] text-xs font-bold text-muted-foreground">
                      g
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="h-px bg-border w-full my-4" />

        {/* Supplements */}
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Supplements</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Creatine 5g"
                value={newSupplement}
                onChange={(e) => setNewSupplement(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter"
                    ? (e.preventDefault(), handleAddSupplement())
                    : null
                }
              />
              <Button
                type="button"
                onClick={handleAddSupplement}
                variant="secondary"
                size="icon"
                className="shrink-0 h-14 w-14"
              >
                <Plus size={20} />
              </Button>
            </div>

            {supplements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-2">
                {supplements.map((sup) => (
                  <div
                    key={sup}
                    className="px-4 py-2 bg-secondary text-sm font-bold rounded-xl flex items-center gap-2"
                  >
                    <Check size={14} className="text-primary" />
                    {sup}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sticky Save Button — no longer fixed, proper flow */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent -mx-6 px-6">
          <Button
            type="submit"
            className="w-full h-14 text-lg shadow-xl shadow-primary/20"
            disabled={
              isLoading ||
              (!manualMode && items.length === 0) ||
              (manualMode && !mealName)
            }
          >
            {isLoading
              ? "Saving..."
              : items.length > 0
                ? `Save Entry · ${totals.calories} kcal`
                : "Save Entry"}
          </Button>
        </div>
      </form>

      <AddFoodDialog
        open={showAddFood}
        onClose={() => setShowAddFood(false)}
        initialName={searchQuery}
        onCreated={(food) => {
          selectFood(food);
          setSearchQuery("");
        }}
      />
    </main>
  );
}
