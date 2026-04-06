"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItemData[]>([]);
  const [staples, setStaples] = useState<FoodItemData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);

  const [items, setItems] = useState<SelectedItem[]>([]);

  const [manualMode, setManualMode] = useState(false);
  const [mealName, setMealName] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [supplements, setSupplements] = useState<string[]>([]);
  const [newSupplement, setNewSupplement] = useState("");

  useEffect(() => {
    const ctx = getMealContext();
    fetch(`${API_BASE}/food-library/staples?context=${ctx}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then(setStaples)
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        selectFood(food);
      }
    } catch {
      selectFood(food);
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
        payload.meal_name = mealName || "Manual Entry";
        payload.calories = parseInt(manualCalories) || 0;
        if (protein) payload.protein_g = parseFloat(protein);
        if (carbs) payload.carbs_g = parseFloat(carbs);
        if (fat) payload.fat_g = parseFloat(fat);
      } else {
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
      <header className="flex items-center justify-between px-8 py-6 mt-2">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Log a Meal</h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSave} className="px-8 space-y-5 flex-1 mt-2">
        {error && (
          <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              !manualMode
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <Search size={14} strokeWidth={1.5} />
            Food Search
          </button>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              manualMode
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <Calculator size={14} strokeWidth={1.5} />
            Manual
          </button>
        </div>

        {!manualMode ? (
          <>
            {/* Staple Chips */}
            {staples.length > 0 && items.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground ml-1">
                  {getMealContext()} staples
                </p>
                <div className="flex flex-wrap gap-2">
                  {staples.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => selectFood(s)}
                      className="px-3 py-2 border border-border text-sm font-medium rounded-full flex items-center gap-1.5 active:opacity-80 transition-all hover:border-primary"
                    >
                      <Star size={12} strokeWidth={1.5} className="text-muted-foreground" />
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
                  size={16}
                  strokeWidth={1.5}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="food-search"
                  placeholder="Search foods..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="pl-11 pr-24 h-13 text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGlobalSearch(!isGlobalSearch);
                      setSearchResults([]);
                    }}
                    className={`text-xs font-medium px-2 py-1.5 rounded-lg transition-colors ${
                      isGlobalSearch
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Global
                  </button>
                </div>
              </div>

              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl max-h-64 overflow-y-auto">
                  {searchResults.map((food: any) => (
                    <button
                      key={food.id || food._id}
                      type="button"
                      onClick={() => !isGlobalSearch && selectFood(food)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-b-0"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-medium text-sm truncate">{food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.calories_per_100g} kcal · {food.protein_per_100g}
                          g P · {food.carbs_per_100g}g C · {food.fat_per_100g}g F
                          <span className="text-muted-foreground/50">
                            {" "}
                            / 100g
                          </span>
                        </p>
                        {isGlobalSearch && food.brand && (
                          <span className="text-[10px] font-medium text-primary mt-1 inline-block bg-primary/8 px-1.5 py-0.5 rounded">
                            {food.brand}
                          </span>
                        )}
                      </div>
                      {isGlobalSearch ? (
                        <div
                          onClick={(e) => importAndSelectFood(food, e)}
                          className="bg-primary/8 hover:bg-primary/15 text-primary text-xs font-medium px-3 py-1.5 rounded-full transition-colors shrink-0"
                        >
                          Import
                        </div>
                      ) : (
                        <Plus size={16} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {showResults &&
                searchQuery.trim() &&
                searchResults.length === 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No foods found for &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResults(false);
                        setShowAddFood(true);
                      }}
                      className="mt-3 w-full py-3 border border-border text-foreground font-medium text-sm rounded-full hover:bg-secondary active:opacity-80 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} strokeWidth={1.5} />
                      Add &ldquo;{searchQuery}&rdquo; to Library
                    </button>
                  </div>
                )}
            </div>

            {/* Selected Items List */}
            {items.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground ml-1">
                  Items ({items.length})
                </h3>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-b border-border pb-4 last:border-b-0 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{item.food.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={14} strokeWidth={1.5} />
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
                          className="text-center font-medium pr-6 h-11"
                          placeholder="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          g
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "Cal", value: item.macros.calories, unit: "" },
                        { label: "Protein", value: item.macros.protein, unit: "g" },
                        { label: "Carbs", value: item.macros.carbs, unit: "g" },
                        { label: "Fat", value: item.macros.fat, unit: "g" },
                      ].map((m) => (
                        <div key={m.label}>
                          <p className="text-[10px] font-medium text-muted-foreground">
                            {m.label}
                          </p>
                          <p className="text-sm font-semibold">
                            {m.value}{m.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Totals Bar */}
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Total
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { value: totals.calories, unit: "kcal" },
                      { value: totals.protein, unit: "g prot" },
                      { value: totals.carbs, unit: "g carb" },
                      { value: totals.fat, unit: "g fat" },
                    ].map((t, i) => (
                      <div key={i}>
                        <p className="text-base font-semibold">{t.value}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{t.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Manual Mode */
          <section className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="diet-meal" className="text-xs font-medium text-muted-foreground ml-1">
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
                className="text-xs font-medium text-muted-foreground ml-1"
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
                className="font-medium"
              />
            </div>

            {/* Macros Toggle */}
            <button
              type="button"
              onClick={() => setShowMacros(!showMacros)}
              className="flex items-center gap-2 font-medium text-sm text-primary py-2"
            >
              {showMacros ? "Hide" : "Add"} Macros{" "}
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`transition-transform ${showMacros ? "rotate-180" : ""}`}
              />
            </button>

            {showMacros && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "diet-protein", label: "Protein", value: protein, set: setProtein },
                  { id: "diet-carbs", label: "Carbs", value: carbs, set: setCarbs },
                  { id: "diet-fat", label: "Fat", value: fat, set: setFat },
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label
                      htmlFor={field.id}
                      className="text-[10px] font-medium text-muted-foreground text-center block"
                    >
                      {field.label}
                    </label>
                    <div className="relative">
                      <Input
                        id={field.id}
                        type="number"
                        placeholder="0"
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        className="text-center font-medium pr-6"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                        g
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="h-px bg-border w-full" />

        {/* Supplements */}
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">Supplements</label>
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
                <Plus size={18} strokeWidth={1.5} />
              </Button>
            </div>

            {supplements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {supplements.map((sup) => (
                  <div
                    key={sup}
                    className="px-3 py-1.5 bg-secondary text-sm font-medium rounded-full flex items-center gap-1.5"
                  >
                    <Check size={12} strokeWidth={1.5} className="text-primary" />
                    {sup}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Save Button */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-background -mx-8 px-8">
          <Button
            type="submit"
            className="w-full h-13"
            disabled={
              isLoading ||
              (!manualMode && items.length === 0) ||
              (manualMode && !mealName)
            }
          >
            {isLoading
              ? "Saving..."
              : items.length > 0
                ? `Save · ${totals.calories} kcal`
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
