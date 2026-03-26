import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 space-y-8 text-center h-full">
      <div className="flex flex-col items-center gap-4 mt-auto">
        <div className="p-5 bg-primary/10 rounded-[2rem] text-primary shadow-sm mb-2">
          <Activity size={56} strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Metric
        </h1>
        <p className="text-muted-foreground text-lg mt-2 max-w-[280px]">
          The ultimate mobile-first fitness logger.
        </p>
      </div>

      <div className="flex flex-col w-full gap-4 mt-auto mb-10 px-2">
        <Link 
          href="/auth/register" 
          className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-sm active:scale-[0.98] transition-all"
        >
          Get Started
        </Link>
        <Link 
          href="/auth/login" 
          className="w-full flex items-center justify-center py-4 bg-secondary text-secondary-foreground rounded-2xl font-bold text-lg shadow-sm active:scale-[0.98] transition-all"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
