"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center min-h-screen">
      <div className="flex flex-col items-center gap-3 mt-auto">
        <Activity size={44} strokeWidth={1.5} className="text-muted-foreground mb-4" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Metric
        </h1>
        <p className="text-muted-foreground text-base mt-1 max-w-[260px] leading-relaxed">
          The ultimate mobile-first fitness logger.
        </p>
      </div>

      <div className="flex flex-col w-full gap-3 mt-auto mb-12 px-2">
        <Link 
          href="/auth/register" 
          className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-full font-semibold text-base active:opacity-80 transition-all"
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
