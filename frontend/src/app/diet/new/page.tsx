"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Apple, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewDietEntry() {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  
  // Macros
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  // Supplements & Hydration
  const [water, setWater] = useState("");
  const [supplements, setSupplements] = useState<string[]>([]);
  const [newSupplement, setNewSupplement] = useState("");

  const handleAddSupplement = () => {
    if (newSupplement.trim() && !supplements.includes(newSupplement)) {
      setSupplements([...supplements, newSupplement.trim()]);
    }
    setNewSupplement("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation
  };

  return (
    <main className="flex flex-col min-h-screen pb-32">
      <div className="bg-primary/10 p-6 pb-8 rounded-b-[2rem]">
        <header className="flex items-center justify-between mt-2 mb-6">
          <Link href="/dashboard" className="p-2 -ml-2 text-primary hover:bg-primary/20 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-10 text-primary text-sm font-bold flex justify-end">Diary</div>
        </header>

        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform rotate-[-8deg] mb-2">
            <Apple size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Log a Meal</h1>
          <p className="text-muted-foreground font-medium text-sm text-center max-w-[280px]">
            Keep track of your fuel, hydration, and supplements.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 mt-4">
        
        {/* Core Meal */}
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Meal Name</label>
            <Input 
              placeholder="e.g. Chicken & Rice" 
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Total Calories (kcal)</label>
            <Input 
              type="number" 
              placeholder="0" 
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required 
              className="text-lg font-bold"
            />
          </div>
        </section>

        {/* Macros Toggle */}
        <section>
          <button 
            type="button" 
            onClick={() => setShowMacros(!showMacros)}
            className="flex items-center gap-2 font-bold text-sm text-primary hover:underline py-2"
          >
            {showMacros ? "Hide" : "Add"} Macronutrients (Optional) <ChevronDown size={16} className={`transition-transform ${showMacros ? "rotate-180" : ""}`} />
          </button>
          
          {showMacros && (
            <div className="grid grid-cols-3 gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase text-center block">Protein</label>
                <div className="relative">
                  <Input type="number" placeholder="0" value={protein} onChange={e => setProtein(e.target.value)} className="text-center font-bold pr-6" />
                  <span className="absolute right-3 top-[14px] text-xs font-bold text-muted-foreground">g</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase text-center block">Carbs</label>
                <div className="relative">
                  <Input type="number" placeholder="0" value={carbs} onChange={e => setCarbs(e.target.value)} className="text-center font-bold pr-6" />
                  <span className="absolute right-3 top-[14px] text-xs font-bold text-muted-foreground">g</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase text-center block">Fats</label>
                <div className="relative">
                  <Input type="number" placeholder="0" value={fat} onChange={e => setFat(e.target.value)} className="text-center font-bold pr-6" />
                  <span className="absolute right-3 top-[14px] text-xs font-bold text-muted-foreground">g</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-border w-full my-4" />

        {/* Hydration & Supps */}
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Water Intake (ml)</label>
            <Input 
              type="number" 
              step="100"
              placeholder="e.g. 500" 
              value={water}
              onChange={(e) => setWater(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Supplements</label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Creatine 5g" 
                value={newSupplement}
                onChange={(e) => setNewSupplement(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' ? (e.preventDefault(), handleAddSupplement()) : null}
              />
              <Button type="button" onClick={handleAddSupplement} variant="secondary" size="icon" className="shrink-0 h-14 w-14">
                <Plus size={20} />
              </Button>
            </div>
            
            {supplements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-2">
                {supplements.map(sup => (
                  <div key={sup} className="px-4 py-2 bg-secondary text-sm font-bold rounded-xl flex items-center gap-2">
                    <Check size={14} className="text-primary" />
                    {sup}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Fixed Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 max-w-md mx-auto bg-gradient-to-t from-background via-background to-transparent pt-12">
          <Button type="submit" className="w-full h-14 text-lg shadow-xl shadow-primary/20">
            Save Entry
          </Button>
        </div>
      </form>
    </main>
  );
}
