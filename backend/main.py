from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, workouts, cardio, sleep, diet, user, sync

app = FastAPI(title="Metric API", description="Fitness Logger Backend")
app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(cardio.router)
app.include_router(sleep.router)
app.include_router(diet.router)
app.include_router(user.router)
app.include_router(sync.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Metric API"}
