<div align="center">
  <h1>Metric Fitness Logger</h1>
  <p>A modular, offline-first Progressive Web App (PWA) designed to replace traditional fitness logbooks with a robust, tactile ecosystem.</p>
</div>

---

## 📌 Project Overview
**Metric** is an engineering-first fitness and lifestyle tracking application. Built to eliminate the friction of traditional data entry, Metric combines a highly responsive, mobile-first interface with an offline-first data layer. This architecture ensures immediate UI updates and seamless resilience against network volatility, synchronizing seamlessly with a distributed backend logic when connectivity is established.

## ⚙️ Technical Specifications

### Frontend
*   **Framework:** Next.js 16 (React 19)
*   **Styling:** Tailwind CSS v4
*   **Typography & Iconography:** Poppins font family, Lucide Icons.
*   **Offline Data Layer:** `@nozbe/watermelondb` utilizing experimental TypeScript decorators and the LokiJS adapter for reactive local IndexedDB synchronization.

### Backend
*   **Framework:** Python 3.12, FastAPI, Uvicorn
*   **Database:** MongoDB Atlas
*   **Driver:** Asynchronous Motor driver for robust non-blocking operations.
*   **Optimization:** Strategic compound indexing on `(user_id, date)` across domain collections to guarantee sub-millisecond query performance for aggregated daily timelines.

---

## 🚀 Core Features

### Workout Logger
Engineered for granular tracking, the logbook supports comprehensive multi-set data entry. It includes nuanced effort indicators such as Reps in Reserve (RIR) to track progressive overload effectively without cognitive overhead.

### Cardio Tracker
A bi-modal tracking system built for both indoor and outdoor utility:
*   **Manual Log:** Direct data entry for treadmill or stationary metrics.
*   **Live GPS Tracking:** Integrates Leaflet mapping and continuous coordinate polling, utilizing the Haversine formula to accurately calculate real-time distance and pacing.

### Diet & Hydration
*   **Nutrition:** Real-time macro-nutrient aggregation. 
*   **Water Tracking:** Visualized via a dynamic, SVGs-based circular progress ring tracking against a baseline 3L goal.

### Timeline Diary
An aggregated chronological view of a user's day. A custom calendar interface allows users to seamlessly scrub through their history, displaying contextual, slide-up detail panels containing data unified across the Workouts, Diet, Sleep, and Cardio domains.

---

## 🏗 Architecture Deep-Dive

### Offline-First Synchronization
Metric prioritizes UI responsiveness and data availability. We implemented **WatermelonDB** to serve as the local source of truth. The application subscribes to local database observables resulting in zero-latency UI updates. 

A background synchronization engine acts as a reconciliation layer between the local IndexedDB state and the remote server. This decouples the user experience from network latency and guarantees high availability—users can log a workout in a cellular dead zone and trust the system to achieve eventual consistency.

### FastAPI Ecosystem
The backend scales on **FastAPI**. Chosen for its native asynchronous capabilities and inherent Pydantic-driven data validation, the backend provides strict schema enforcement and high throughput. The auto-generated OpenAPI schemas tightly couple the frontend API clients to the backend contracts, fundamentally eliminating a wide class of integration regressions.

---

## 🎨 UI/UX Philosophy

*   **Minimal Cognitive Load:** The design system avoids visual clutter. By employing a monochromatic base with a strategic **vivid lavender primary accent** (`hsl(255, 100%, 68%)`), the interface directs user focus entirely to the data. Borders and shadows have been stripped away in favor of generous, deliberate whitespace.
*   **Tactile Feedback:** The interface uses micro-interactions (e.g., `active:scale-95`, `active:opacity-80`) combined with pill-shaped components to provide immediate, satisfying visual confirmation of user intent, mimicking the tactile satisfaction of physical logbooks.
*   **Mobile-First Constraint:** Forced into a maximum width constraint (`max-w-md`), the layout explicitly targets single-handed mobile usability as a first-class citizen.

---

## 🗄 Database Schema

The system relies on a denormalized document structure optimized for heavy read/write specific aggregates.

*   **Users:** `_id`, `email`, `password_hash`, `name`, `height_cm`, `weight_kg`, `dob`
*   **Workouts:** `_id`, `user_id`, `date`, `exercises` *(Array of embedded documents including name, sets, reps, weight, rir)*
*   **Cardio Logs:** `_id`, `user_id`, `date`, `activity_type`, `duration_minutes`, `distance_km`, `route_coords` *(GeoJSON LineString data)*
*   **Diet Logs:** `_id`, `user_id`, `date`, `meal_name`, `calories`, `protein_g`, `carbs_g`, `fat_g`
*   **Sleep Logs:** `_id`, `user_id`, `date`, `duration_hours`, `quality`

---

## 🛠 Engineering Highlights

*   **Stateless Authentication:** Implements secure JWT-based authentication for persistent sessions without requiring backend session state management.
*   **Pydantic Data Validation:** Ensures strict type safety at the API boundary. The backend aggressively rejects malformed payloads before they reach the controller logic, ensuring absolute data integrity within MongoDB.
*   **Eventual Consistency Model:** The client and server sync processes natively handle timestamps and deleted flags to gracefully resolve merge conflicts on sync.

---

## 💻 Installation & Setup

### Requirements
*   Node.js 20+
*   Python 3.12+
*   MongoDB Atlas URI

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env`:
   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
   DATABASE_NAME=metric_db
   JWT_SECRET=your_secret_key
   ```
5. Run the server:
   ```bash
   python -m uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
*The web app will be available at `http://localhost:3000`.*
