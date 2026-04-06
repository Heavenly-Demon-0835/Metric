"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        gender: gender || null
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Registration failed";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-8 py-6">
      <header className="flex items-center justify-between mb-12 mt-2">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.5} />
        </button>
        {/* Step dots */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step ? "bg-primary w-6" : s < step ? "bg-primary/40" : "bg-border"
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col pb-20">
        
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Create Account</h1>
            <p className="text-muted-foreground mb-10 text-sm">Let&apos;s get your basics down</p>

            <form onSubmit={handleNext} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="reg-name" className="text-xs font-medium text-muted-foreground ml-1">Full Name</label>
                <Input 
                  id="reg-name"
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-email" className="text-xs font-medium text-muted-foreground ml-1">Email</label>
                <Input 
                  id="reg-email"
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-password" className="text-xs font-medium text-muted-foreground ml-1">Password</label>
                <div className="relative">
                  <Input 
                    id="reg-password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    minLength={6}
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
                <Button type="submit" className="w-full h-13">
                  Continue <ArrowRight className="ml-2" size={18} strokeWidth={1.5} />
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">About You</h1>
            <p className="text-muted-foreground mb-10 text-sm">This helps us personalize your metrics</p>

            <form onSubmit={handleNext} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="reg-age" className="text-xs font-medium text-muted-foreground ml-1">Age</label>
                <Input 
                  id="reg-age"
                  type="number" 
                  placeholder="e.g. 25" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`h-13 rounded-full border text-sm font-medium transition-all ${
                        gender === g 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-transparent text-foreground border-border hover:border-muted-foreground'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-8">
                <Button type="submit" className="w-full h-13" disabled={!age || !gender}>
                  Continue <ArrowRight className="ml-2" size={18} strokeWidth={1.5} />
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Your Body</h1>
            <p className="text-muted-foreground mb-10 text-sm">Final step before we begin</p>

            <form onSubmit={handleRegister} className="space-y-5">
              {error && <div className="p-3 bg-destructive/8 text-destructive text-sm font-medium rounded-xl">{error}</div>}
              
              <div className="space-y-2">
                <label htmlFor="reg-weight" className="text-xs font-medium text-muted-foreground ml-1">Weight (kg)</label>
                <Input 
                  id="reg-weight"
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 70.5" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-height" className="text-xs font-medium text-muted-foreground ml-1">Height (cm)</label>
                <Input 
                  id="reg-height"
                  type="number" 
                  placeholder="e.g. 175" 
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required 
                />
              </div>
              
              <div className="pt-8">
                <Button type="submit" className="w-full h-13" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Complete"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 1 && (
          <p className="text-center text-muted-foreground mt-8 text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
