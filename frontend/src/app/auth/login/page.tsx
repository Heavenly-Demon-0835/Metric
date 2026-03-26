"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";

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

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = "Failed to log in";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch {
          // Response body was not JSON — use status text
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col p-6">
      <header className="flex items-center justify-between mb-8 mt-2">
        <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <Activity size={24} className="text-primary" />
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col justify-center pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h1>
        <p className="text-muted-foreground mb-8 text-lg">Sign in to resume tracking</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-red-100 text-red-600 text-sm font-bold rounded-lg animate-in fade-in slide-in-from-top-2">{error}</div>}
          
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-semibold text-foreground ml-1">Email</label>
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
            <label htmlFor="login-password" className="text-sm font-semibold text-foreground ml-1">Password</label>
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
                className="absolute right-4 top-[14px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </div>
        </form>

        <p className="text-center text-muted-foreground mt-8 text-base">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Get Started
          </Link>
        </p>
      </div>
    </main>
  );
}
