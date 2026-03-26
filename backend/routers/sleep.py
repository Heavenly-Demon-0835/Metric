from fastapi import APIRouter, Depends
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
