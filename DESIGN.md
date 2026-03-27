# Metric — Mobile-First Fitness Logger

> The ultimate mobile-first fitness logger and diary.

---

## Overview

**Metric** is a progressive web application built to help fitness enthusiasts log, track, and review their daily health activities — workouts, nutrition, sleep, cardio, and hydration — all in one place.

| Attribute | Detail |
|---|---|
| **Stack** | Next.js 16 (React 19) · FastAPI · MongoDB Atlas |
| **Hosting** | Frontend: Vercel · Backend: Railway |
| **Auth** | JWT-based with persistent login |
| **Design System** | Tailwind CSS v4, Inter typeface |

---

## Core Features

### 🏋️ Log Workout
Structured exercise logging with per-set tracking (reps + effort level: Reps in Reserve, Near Failure, Failure). Supports multiple exercises per session. Each workout is timestamped and tied to the user's diary.

### 🍎 Add Meal
Nutrition logging with meal name, calorie count, and optional macronutrient breakdown (protein, carbs, fat). Supplements are tracked as tagged items. The interface uses progressive disclosure — macros are hidden behind a toggle to keep the default view clean.

### 💧 Water Intake
Dedicated hydration tracker with a circular SVG progress ring (3L daily goal). Quick-add presets (100ml – 1L) and a custom input field. Today's log is displayed inline with per-entry delete. Designed for rapid, one-tap logging throughout the day.

### 😴 Sleep Tracker
Dual-mode sleep logging:
- **Auto Toggle:** Tap the moon to start; tap again to wake — elapsed time is calculated automatically.
- **Manual Log:** Enter hours directly when you forget to toggle.

### 🏃 Log Cardio
Two input modes:
- **Manual:** Enter duration and distance for quick logging.
- **GPS Tracking:** Real-time Leaflet map with `navigator.geolocation.watchPosition`, live timer, haversine-based distance calculation, and noise-filtered coordinate tracking (>3m threshold).

Activity presets: **Walking** and **Running**.

### 📅 Timeline Diary
Calendar-based diary that aggregates all logged data (workouts, meals, sleep, cardio) by date. Entries are grouped by type with count badges. Each entry has:
- **View:** Sliding bottom-sheet detail panel showing all logged information.
- **Edit:** Inline editing for sleep, diet, and cardio entries.
- **Delete:** Confirmation dialog before permanent removal.

### 👤 Profile
Displays and manages user information: name, email, age, weight, height, gender.

---

## UI/UX Design Philosophy

### 1. Mobile-First, Always
Every layout, interaction, and touch target is designed for a phone-sized viewport (`max-w-md`). The app renders at the center of wider screens with `sm:shadow-2xl` to simulate a device frame. Bottom navigation uses generous padding and `pb-safe` for notch-aware devices.

### 2. Minimal Cognitive Load
- The dashboard shows **only actionable cards** — no summary widgets, no charts, no noise.
- Progressive disclosure: optional fields (macros, supplements) hide behind toggles.
- One primary action per screen. Save buttons are fixed at the bottom for thumb-reachable access.

### 3. Tactile & Responsive
- All interactive cards use `active:scale-95` for instant press feedback.
- Transitions on every state change: `transition-all`, `transition-transform`, `transition-colors`.
- Animated entrances: `animate-in`, `slide-in-from-*`, `fade-in` for panels and toasts.
- The sleep toggle uses a large 64×64 circular button with `scale-105` and `shadow-primary/30` glow when active.

### 4. Soft, Rounded Aesthetic
- Border radius is consistently generous: `rounded-2xl` (cards), `rounded-3xl` (panels), `rounded-full` (avatars, toggles).
- Shadows are subtle: `shadow-sm` on cards, `shadow-xl shadow-primary/20` on primary CTAs.
- Borders use `border-input` and `border-primary/20` for soft definition without harshness.

### 5. Color System
The app uses HSL-based colors registered as CSS variables for light/dark mode compatibility:

| Role | Value | Usage |
|---|---|---|
| **Primary** | `hsl(262, 83%, 58%)` | Purple — CTAs, active states, accents |
| **Success/Diet** | `hsl(142, 71%, 45%)` | Green — meal cards, nutrition |
| **Cardio/Warning** | `hsl(38, 92%, 50%)` | Amber — cardio cards |
| **Sleep** | Indigo-500 | Purple-blue — sleep tracker |
| **Water** | Sky-500 | Blue — hydration tracking |
| **Destructive** | Red — delete confirmations |

Each feature area has a consistent color identity across the dashboard card, the logging page header, and the diary entry icon.

### 6. Typography
- **Font:** Inter (Google Fonts), loaded via `next/font` for zero layout shift.
- **Weights:** `font-bold` for labels, `font-extrabold` for headings and key values, `font-medium` for secondary text.
- **Sizes:** Headings at `text-2xl`–`text-3xl`, body at `text-sm`, micro-labels at `text-xs` with `uppercase tracking-widest`.

### 7. Component Patterns

| Pattern | Implementation |
|---|---|
| **Tab Switcher** | Segmented control with `bg-secondary` track and `bg-background shadow-sm` active indicator |
| **Toast Notifications** | Fixed top-center, `animate-in slide-in-from-top-4`, auto-dismiss after 2–5s |
| **Detail Panel** | Bottom sheet with `backdrop-blur-sm`, `slide-in-from-bottom-8`, max-height scroll |
| **Confirmation Dialog** | Inline red banner within the detail panel, not a modal |
| **Progress Ring** | SVG circle with `strokeDashoffset` animation for water intake |
| **Quick Action Grid** | `grid-cols-2` card layout with icon, label, and press animation |

### 8. Navigation
- **Bottom Nav Bar:** Fixed, backdrop-blurred (`bg-background/80 backdrop-blur-md`), two primary destinations — Home and Diary.
- **Back Arrows:** Consistent `ArrowLeft` icon in page headers, always linking to `/dashboard`.
- **History Management:** `router.replace` everywhere after auth actions to prevent involuntary logout via back button.

### 9. Data Architecture
- Each feature (workout, cardio, sleep, diet, water) has its own MongoDB collection with `user_id` foreign key.
- Full CRUD via REST: `POST /`, `GET /`, `PUT /{id}`, `DELETE /{id}` on each router.
- JWT tokens stored in `localStorage` for persistent sessions across browser restarts.
- All API calls use a centralized `API_BASE` + `getAuthHeaders()` pattern from `@/lib/api.ts`.

### 10. Accessibility
- All form inputs have `htmlFor`-linked labels.
- Icon-only buttons have `aria-label` attributes.
- Password fields have show/hide toggle with clear aria labels.
- Color alone is never the sole indicator — icons and text always accompany colored elements.

---

## Tech Stack Detail

```
frontend/
├── src/app/           # Next.js App Router pages
│   ├── auth/          # Login & Register (3-step)
│   ├── cardio/new/    # GPS + Manual cardio logging
│   ├── dashboard/     # Home with quick action grid
│   ├── diary/         # Calendar diary + detail panel
│   ├── diet/new/      # Meal + macro logging
│   ├── profile/       # User profile
│   ├── sleep/         # Toggle + manual sleep tracker
│   ├── water/         # Hydration tracker
│   └── workouts/new/  # Exercise + set logging
├── src/components/
│   ├── ui/            # Button, Input primitives
│   └── LeafletMap.tsx # Dynamic SSR-safe map component
└── src/lib/api.ts     # API_BASE + auth header utility

backend/
├── main.py            # FastAPI app + CORS + router registration
├── database.py        # Motor async MongoDB client
├── models.py          # Pydantic models (User, Workout, Cardio, Sleep, Diet, Water)
└── routers/
    ├── auth.py        # Register, Login, JWT, /users/me
    ├── workouts.py    # CRUD for workout sessions
    ├── cardio.py      # CRUD for cardio sessions
    ├── sleep.py       # CRUD for sleep logs
    ├── diet.py        # CRUD for diet logs
    ├── water.py       # CRUD for water logs
    ├── user.py        # Profile management
    └── sync.py        # WatermelonDB sync endpoint
```

---

*Built with care for people who take their fitness seriously.*
