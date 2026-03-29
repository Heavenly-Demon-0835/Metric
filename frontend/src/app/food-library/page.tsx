"use client";

import dynamic from "next/dynamic";
import { Database } from "lucide-react";

const FoodLibraryDynamic = dynamic(() => import("./FoodLibraryInner"), {
  ssr: false,
  loading: () => (
    <main className="flex flex-col min-h-screen pb-6">
      <div className="bg-primary/10 p-6 pb-8 rounded-b-[2rem]">
        <div className="flex flex-col items-center gap-2 mt-10">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform rotate-[-8deg] mb-2">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Food Library</h1>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-12 bg-secondary rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  ),
});

export default function FoodLibraryPage() {
  return <FoodLibraryDynamic />;
}
