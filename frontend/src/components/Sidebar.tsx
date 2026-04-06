"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Activity,
  CalendarCheck,
  Database,
  User,
  BookOpen,
} from "lucide-react";

const SidebarContext = createContext<{
  open: boolean;
  toggle: () => void;
}>({ open: false, toggle: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/planner", label: "Daily Planner", icon: CalendarCheck },
  { href: "/food-library", label: "Food Library", icon: Database },
  { href: "/diary", label: "Diary", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

const HIDDEN_ROUTES = ["/auth", "/auth/login", "/auth/register"];

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(!open) }}>
      {children}
      {!isHidden && <Sidebar open={open} onClose={() => setOpen(false)} />}
    </SidebarContext.Provider>
  );
}

export function HamburgerButton() {
  const { toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
      aria-label="Open menu"
    >
      <Menu size={22} strokeWidth={1.5} />
    </button>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-background flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-7 py-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Metric</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Fitness Logger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "text-primary bg-primary/6"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-7 py-6" />
      </div>
    </>
  );
}
