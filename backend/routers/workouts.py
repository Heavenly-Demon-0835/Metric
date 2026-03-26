from fastapi import APIRouter, Depends
from typing import List
from database import db
from models import WorkoutSession
from routers.auth import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("/", response_model=str)
async def create_workout(workout: WorkoutSession, user=Depends(get_current_user)):
    workout.user_id = str(user["_id"])
    result = await db.workouts.insert_one(workout.model_dump(exclude_none=True))
    return str(result.inserted_id)


@router.get("/")
async def get_workouts(user=Depends(get_current_user)):
    workouts = []
    cursor = db.workouts.find({"user_id": str(user["_id"])}).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        workouts.append(document)
    return workouts
