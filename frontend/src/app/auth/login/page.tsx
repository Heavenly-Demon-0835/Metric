"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, setToken } from "@/lib/api";
import { syncDatabase } from "@/db/sync";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await apiFetch(`/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        skipAuthRedirect: true,
      });

      if (!res.ok) {
        let errorMsg = "Failed to log in";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch {
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setToken(data.access_token);
      // Pull the account's server-side data into the local store before the
      // reactive views mount, so a returning user isn't briefly shown nothing.
      await syncDatabase();
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-8 py-6">
      <header className="flex items-center mb-12 mt-2">
        <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors rounded-full">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center pb-20">
        <div className="grad-violet w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6 animate-fade-up">
          <Activity size={28} strokeWidth={2} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 animate-fade-up" style={{ animationDelay: "60ms" }}>Welcome back</h1>
        <p className="text-muted-foreground mb-10 text-sm animate-fade-up" style={{ animationDelay: "100ms" }}>Sign in to resume tracking</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl">{error}</div>}
          
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground ml-1">Email</label>
            <Input 
              id="login-email"
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground ml-1">Password</label>
            <div className="relative">
              <Input 
                id="login-password"
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          
          <div className="pt-6">
            <Button type="submit" className="w-full h-13" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </div>
        </form>

        <p className="text-center text-muted-foreground mt-8 text-sm">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">
            Get Started
          </Link>
        </p>
      </div>
    </main>
  );
}
