from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime, timezone
from database import db
from models import CardioSession, SleepLog, WaterLog, WorkoutSession, DietLog
from routers.auth import get_current_user

router = APIRouter(tags=["activities"])


def _date_filter(user_id: str, month: str | None = None):
    """Build a MongoDB query filter. If month is 'YYYY-MM', restrict to that month."""
    q: dict = {"user_id": user_id}
    if month:
        try:
            year, mon = month.split("-")
            start = datetime(int(year), int(mon), 1, tzinfo=timezone.utc)
            # Next month boundary
            if int(mon) == 12:
                end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end = datetime(int(year), int(mon) + 1, 1, tzinfo=timezone.utc)
            q["date"] = {"$gte": start, "$lt": end}
        except (ValueError, IndexError):
            pass  # Ignore malformed month param — return all
    return q


# --- CARDIO ---
@router.post("/cardio", response_model=str)
@router.post("/cardio/", response_model=str, include_in_schema=False)
async def create_cardio(cardio: CardioSession, user=Depends(get_current_user)):
    cardio.user_id = str(user["_id"])
    result = await db.cardio.insert_one(cardio.model_dump())
    return str(result.inserted_id)

@router.get("/cardio")
@router.get("/cardio/", include_in_schema=False)
async def get_cardio(user=Depends(get_current_user), month: str | None = Query(None)):
    sessions = []
    cursor = db.cardio.find(_date_filter(str(user["_id"]), month)).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        sessions.append(document)
    return sessions

@router.put("/cardio/{entry_id}")
async def update_cardio(entry_id: str, cardio: CardioSession, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.cardio.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = cardio.model_dump()
    data["user_id"] = uid
    await db.cardio.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}

@router.delete("/cardio/{entry_id}")
async def delete_cardio(entry_id: str, user=Depends(get_current_user)):
    result = await db.cardio.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}

# --- SLEEP ---
@router.post("/sleep", response_model=str)
@router.post("/sleep/", response_model=str, include_in_schema=False)
async def create_sleep(sleep_log: SleepLog, user=Depends(get_current_user)):
    sleep_log.user_id = str(user["_id"])
    result = await db.sleep.insert_one(sleep_log.model_dump())
    return str(result.inserted_id)

@router.get("/sleep")
@router.get("/sleep/", include_in_schema=False)
async def get_sleep(user=Depends(get_current_user), month: str | None = Query(None)):
    logs = []
    cursor = db.sleep.find(_date_filter(str(user["_id"]), month)).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        logs.append(document)
    return logs

@router.put("/sleep/{entry_id}")
async def update_sleep(entry_id: str, sleep_log: SleepLog, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.sleep.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = sleep_log.model_dump()
    data["user_id"] = uid
    await db.sleep.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}

@router.delete("/sleep/{entry_id}")
async def delete_sleep(entry_id: str, user=Depends(get_current_user)):
    result = await db.sleep.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}

# --- WATER ---
@router.post("/water", response_model=str)
@router.post("/water/", response_model=str, include_in_schema=False)
async def create_water(water_log: WaterLog, user=Depends(get_current_user)):
    water_log.user_id = str(user["_id"])
    result = await db.water.insert_one(water_log.model_dump())
    return str(result.inserted_id)

@router.get("/water")
@router.get("/water/", include_in_schema=False)
async def get_water(user=Depends(get_current_user), month: str | None = Query(None)):
    logs = []
    cursor = db.water.find(_date_filter(str(user["_id"]), month)).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        logs.append(document)
    return logs

@router.delete("/water/{entry_id}")
async def delete_water(entry_id: str, user=Depends(get_current_user)):
    result = await db.water.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}

# --- WORKOUTS ---
@router.post("/workouts", response_model=str)
@router.post("/workouts/", response_model=str, include_in_schema=False)
async def create_workout(workout: WorkoutSession, user=Depends(get_current_user)):
    workout.user_id = str(user["_id"])
    result = await db.workouts.insert_one(workout.model_dump())
    return str(result.inserted_id)

@router.get("/workouts")
@router.get("/workouts/", include_in_schema=False)
async def get_workouts(user=Depends(get_current_user), month: str | None = Query(None)):
    workouts = []
    cursor = db.workouts.find(_date_filter(str(user["_id"]), month)).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        workouts.append(document)
    return workouts

@router.put("/workouts/{entry_id}")
async def update_workout(entry_id: str, workout: WorkoutSession, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.workouts.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = workout.model_dump()
    data["user_id"] = uid
    await db.workouts.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}

@router.delete("/workouts/{entry_id}")
async def delete_workout(entry_id: str, user=Depends(get_current_user)):
    result = await db.workouts.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}

# --- DIET ---
@router.post("/diet", response_model=str)
@router.post("/diet/", response_model=str, include_in_schema=False)
async def create_diet(diet_log: DietLog, user=Depends(get_current_user)):
    diet_log.user_id = str(user["_id"])
    result = await db.diet.insert_one(diet_log.model_dump())
    return str(result.inserted_id)

@router.get("/diet")
@router.get("/diet/", include_in_schema=False)
async def get_diet(user=Depends(get_current_user), month: str | None = Query(None)):
    logs = []
    cursor = db.diet.find(_date_filter(str(user["_id"]), month)).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        logs.append(document)
    return logs

@router.put("/diet/{entry_id}")
async def update_diet(entry_id: str, diet_log: DietLog, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.diet.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = diet_log.model_dump()
    data["user_id"] = uid
    await db.diet.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}

@router.delete("/diet/{entry_id}")
async def delete_diet(entry_id: str, user=Depends(get_current_user)):
    result = await db.diet.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}
