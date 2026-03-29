"use client";

import dynamic from "next/dynamic";

// Dynamically import the PlannerCardInner which uses WatermelonDB decorators/observables
// This prevents Next.js SSR from crashing when `database` is not yet initialized.
const PlannerCardDynamic = dynamic(() => import("./PlannerCardInner"), {
  ssr: false,
  loading: () => (
    <div className="bg-card rounded-3xl border p-6 animate-pulse">
      <div className="h-28 bg-secondary rounded-2xl" />
    </div>
  ),
});

export default function PlannerCard() {
  return <PlannerCardDynamic />;
}
