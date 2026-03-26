from fastapi import APIRouter, Depends
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
