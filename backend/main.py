import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, workouts, cardio, sleep, diet, user, sync, water, food_library, goals, discovery

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
app.include_router(workouts.router)
app.include_router(cardio.router)
app.include_router(sleep.router)
app.include_router(diet.router)
app.include_router(user.router)
app.include_router(sync.router)
app.include_router(water.router)
app.include_router(food_library.router)
app.include_router(goals.router)
app.include_router(discovery.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Metric API"}
