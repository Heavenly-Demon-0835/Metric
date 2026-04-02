import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, activities, sync, food_library, goals, discovery
from database import db

load_dotenv()

app = FastAPI(title="Metric API", description="Fitness Logger Backend")

# Build allowed origins list from environment (comma-separated) + defaults
_extra_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _extra_origins.split(",") if o.strip()] if _extra_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(auth.users_router)
app.include_router(activities.router)
app.include_router(sync.router)
app.include_router(food_library.router)
app.include_router(goals.router)
app.include_router(discovery.router)


@app.on_event("startup")
async def create_indexes():
    """Create compound indexes on (user_id, date) for all activity collections.
    Prevents full collection scans on every list/filter query."""
    for col in ["workouts", "cardio", "sleep", "diet", "water", "food_items", "daily_goals"]:
        await db[col].create_index([("user_id", 1), ("date", -1)], background=True)
    await db.users.create_index("email", unique=True, background=True)


@app.get("/")
async def root():
    return {"message": "Welcome to Metric API"}
