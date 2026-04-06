"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAuthHeaders } from "@/lib/api";

interface GoalSetterProps {
  onCreated: () => void;
}

const PRESETS = [
  { metric_type: "calories", label: "Calorie Target", unit: "kcal", defaultValue: 2000, icon: "🔥" },
  { metric_type: "protein", label: "Protein Target", unit: "g", defaultValue: 150, icon: "💪" },
  { metric_type: "water", label: "Water Target", unit: "ml", defaultValue: 3000, icon: "💧" },
  { metric_type: "workout", label: "Workouts", unit: "sessions", defaultValue: 1, icon: "🏋️" },
];

export default function GoalSetter({ onCreated }: GoalSetterProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [targetValue, setTargetValue] = useState("");
  const [saving, setSaving] = useState(false);

  const preset = PRESETS.find((p) => p.metric_type === selected);

  const handleSave = async () => {
    if (!selected || !targetValue) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/goals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          metric_type: selected,
          target_value: parseFloat(targetValue),
          frequency: "daily",
        }),
      });
      if (res.ok) {
        try {
          const insertedId = await res.json();
          const { database } = await import("@/db");
          if (database) {
            await database.write(async () => {
              await database.get("daily_goals").create((record: any) => {
                record._raw.id = insertedId;
                record.metricType = selected;
                record.targetValue = parseFloat(targetValue);
                record.frequency = "daily";
                record.userId = "auth-user";
              });
            });
          }
        } catch (err) {
          console.error("Local DB insert skipped:", err);
        }

        onCreated();
        setOpen(false);
        setSelected(null);
        setTargetValue("");
      }
    } catch (err) {
      console.error("Failed to save goal:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border border-dashed border-border rounded-xl text-muted-foreground font-medium text-sm flex items-center justify-center gap-2 hover:border-muted-foreground transition-colors"
      >
        <Plus size={16} strokeWidth={1.5} />
        Add Goal
      </button>
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Set a Target</h3>
        <button
          onClick={() => {
            setOpen(false);
            setSelected(null);
          }}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.metric_type}
              onClick={() => {
                setSelected(p.metric_type);
                setTargetValue(String(p.defaultValue));
              }}
              className="p-4 bg-secondary/50 rounded-xl text-left hover:bg-secondary active:opacity-80 transition-all"
            >
              <span className="text-lg mb-1 block">{p.icon}</span>
              <p className="text-sm font-medium">{p.label}</p>
              <p className="text-xs text-muted-foreground">
                {p.defaultValue} {p.unit}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-4">
            <span className="text-xl">{preset?.icon}</span>
            <div>
              <p className="font-medium text-sm">{preset?.label}</p>
              <p className="text-xs text-muted-foreground">Daily target</p>
            </div>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="text-center font-medium pr-16"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              {preset?.unit}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelected(null)}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !targetValue}
            >
              {saving ? "Saving..." : "Set Goal"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
