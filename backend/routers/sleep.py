from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import db
from models import SleepLog
from routers.auth import get_current_user

router = APIRouter(prefix="/sleep", tags=["sleep"])


@router.post("/", response_model=str)
async def create_sleep(sleep_log: SleepLog, user=Depends(get_current_user)):
    sleep_log.user_id = str(user["_id"])
    result = await db.sleep.insert_one(sleep_log.model_dump(exclude_none=True))
    return str(result.inserted_id)


@router.get("/")
async def get_sleep(user=Depends(get_current_user)):
    logs = []
    cursor = db.sleep.find({"user_id": str(user["_id"])}).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        logs.append(document)
    return logs


@router.put("/{entry_id}")
async def update_sleep(entry_id: str, sleep_log: SleepLog, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.sleep.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = sleep_log.model_dump(exclude_none=True)
    data["user_id"] = uid
    await db.sleep.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}


@router.delete("/{entry_id}")
async def delete_sleep(entry_id: str, user=Depends(get_current_user)):
    result = await db.sleep.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}
