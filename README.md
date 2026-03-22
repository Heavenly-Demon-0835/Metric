# Metric Fitness Logger

Metric is a mobile-first Progressive Web App (PWA) designed to gracefully replace traditional fitness logbooks. It features a complete manual tracking interface, a calendar-based diary, and dedicated modules for tracking workouts, cardio, sleep, and diet.

## Features
- **Real-time Authentication**: Secure JWT-based login and registration flows.
- **Dynamic Dashboard**: Quick-access tracking modules, personalized greetings, and live daily summaries.
- **Workout Logger**: Deep exercise tracking with detailed sets, reps, and effort indicators.
- **Cardio Tracker**: Log running durations and distance mapping.
- **Sleep & Diet**: Strict daily tracking modules for holistic health reporting.
- **Live Profile Integration**: Dynamically pulled user metrics and editable demographic stats.
- **Offline Sync Architecture**: Deeply configured WatermelonDB schemas mapped directly to a local offline IndexedDB database using LokiJS.

## Tech Stack
- **Frontend**: Next.js 15, React Web, Tailwind CSS, Lucide Icons.
- **Offline Database**: `@nozbe/watermelondb` with experimental TypeScript decorators enabled via SWC.
- **Backend**: Python 3.12, FastAPI, Uvicorn, Motor (Async MongoDB Driver).
- **Primary Database**: MongoDB Atlas.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- A bare MongoDB Atlas Cluster

### Backend Setup (Native)
1. Navigate to the `backend` directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file using your Atlas `MONGO_URI` (ensure your password is URL-encoded if applicable).
6. Start the development server: `uvicorn main:app --reload --port 8000`

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install --legacy-peer-deps`
3. Start the Next.js fast-refresh app: `npm run dev`
4. Access the application running seamlessly on `http://localhost:3000`.

### Docker Daemon (Optional)
A complete `docker-compose.yml` is internally provided for the backend API. Simply insert your `.env` connection string into the backend directory and run:
`docker compose up --build`
This will compile the Python image natively and expose port 8000 safely to your localhost host.
