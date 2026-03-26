from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
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


@router.put("/{entry_id}")
async def update_workout(entry_id: str, workout: WorkoutSession, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.workouts.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = workout.model_dump(exclude_none=True)
    data["user_id"] = uid
    await db.workouts.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}


@router.delete("/{entry_id}")
async def delete_workout(entry_id: str, user=Depends(get_current_user)):
    result = await db.workouts.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}
