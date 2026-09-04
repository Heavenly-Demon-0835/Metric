"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import { getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center min-h-screen">
      <div className="flex flex-col items-center gap-3 mt-auto animate-fade-up">
        <div className="grad-violet w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30 mb-5">
          <Activity size={40} strokeWidth={2} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Metric
        </h1>
        <p className="text-muted-foreground text-base mt-1 max-w-[260px] leading-relaxed">
          The ultimate mobile-first fitness logger.
        </p>
      </div>

      <div className="flex flex-col w-full gap-3 mt-auto mb-12 px-2">
        <Link
          href="/auth/register"
          className="grad-violet w-full flex items-center justify-center py-4 text-white rounded-full font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          Get Started
        </Link>
        <Link 
          href="/auth/login" 
          className="w-full flex items-center justify-center py-4 border border-border text-foreground rounded-full font-semibold text-base active:opacity-80 transition-all"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
