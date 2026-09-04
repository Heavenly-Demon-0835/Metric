"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarCheck, Apple, BookOpen, User } from "lucide-react";

/**
 * iOS-style floating pill tab bar.
 *
 * Replaces the old hamburger + slide-out drawer: on a mobile-first layout the
 * five top-level destinations are better as always-visible tabs than as a menu
 * hidden behind a tap.
 */
const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/planner", label: "Planner", icon: CalendarCheck },
  { href: "/food-library", label: "Food", icon: Apple },
  { href: "/diary", label: "Diary", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // The bar belongs to the tab roots only. Entry forms (/workouts/new, /water,
  // …) are pushed screens with their own sticky save button, which would
  // collide with a tab bar — iOS hides the bar on those too.
  const isTabRoot = TABS.some((t) => t.href === pathname);
  if (!isTabRoot) return null;

  return (
    <nav
      aria-label="Primary"
      // z-40 keeps the pill above page content (the food-library FAB is z-30)
      // but below every modal and bottom sheet in the app, which are all z-50.
      // Without that gap the pill paints over open dialogs.
      className="fixed inset-x-0 z-40 mx-auto w-[calc(100%-2rem)] max-w-[26rem] rounded-full border border-border bg-background/80 shadow-lg shadow-black/10 backdrop-blur-xl"
      // Floats clear of the screen edge and the iPhone home indicator.
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <ul className="flex items-stretch px-1 py-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-full py-1.5 active:scale-95 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  aria-hidden="true"
                />
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
