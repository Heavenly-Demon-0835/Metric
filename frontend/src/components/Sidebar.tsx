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

// Auth routes that should not show the sidebar
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
      className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
      aria-label="Open menu"
    >
      <Menu size={24} />
    </button>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Metric</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Fitness Logger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 pt-4 border-t">
          <p className="text-[10px] text-muted-foreground font-medium text-center">
            Built for people who take fitness seriously.
          </p>
        </div>
      </div>
    </>
  );
}
