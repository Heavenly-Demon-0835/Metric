from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import db
from models import WaterLog
from routers.auth import get_current_user

router = APIRouter(prefix="/water", tags=["water"])


@router.post("/", response_model=str)
async def create_water(water_log: WaterLog, user=Depends(get_current_user)):
    water_log.user_id = str(user["_id"])
    result = await db.water.insert_one(water_log.model_dump(exclude_none=True))
    return str(result.inserted_id)


@router.get("/")
async def get_water(user=Depends(get_current_user)):
    logs = []
    cursor = db.water.find({"user_id": str(user["_id"])}).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        logs.append(document)
    return logs


@router.delete("/{entry_id}")
async def delete_water(entry_id: str, user=Depends(get_current_user)):
    result = await db.water.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}
