from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import db
from models import DietLog
from routers.auth import get_current_user

router = APIRouter(prefix="/diet", tags=["diet"])


@router.post("/", response_model=str)
async def create_diet(diet_log: DietLog, user=Depends(get_current_user)):
    diet_log.user_id = str(user["_id"])
    result = await db.diet.insert_one(diet_log.model_dump(exclude_none=True))
    return str(result.inserted_id)


@router.get("/")
async def get_diet(user=Depends(get_current_user)):
    logs = []
    cursor = db.diet.find({"user_id": str(user["_id"])}).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        logs.append(document)
    return logs


@router.put("/{entry_id}")
async def update_diet(entry_id: str, diet_log: DietLog, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.diet.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = diet_log.model_dump(exclude_none=True)
    data["user_id"] = uid
    await db.diet.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}


@router.delete("/{entry_id}")
async def delete_diet(entry_id: str, user=Depends(get_current_user)):
    result = await db.diet.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}
