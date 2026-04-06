"use client";

import dynamic from "next/dynamic";

const FoodLibraryDynamic = dynamic(() => import("./FoodLibraryInner"), {
  ssr: false,
  loading: () => (
    <main className="flex flex-col min-h-screen pb-6">
      <div className="px-8 py-6 mt-2">
        <div className="h-6 w-32 bg-secondary rounded animate-pulse mx-auto" />
      </div>
      <div className="px-8 space-y-4">
        <div className="h-12 bg-secondary rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  ),
});

export default function FoodLibraryPage() {
  return <FoodLibraryDynamic />;
}
