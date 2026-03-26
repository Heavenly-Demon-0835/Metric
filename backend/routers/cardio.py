from fastapi import APIRouter, Depends
from database import db
from models import CardioSession
from routers.auth import get_current_user

router = APIRouter(prefix="/cardio", tags=["cardio"])


@router.post("/", response_model=str)
async def create_cardio(cardio: CardioSession, user=Depends(get_current_user)):
    cardio.user_id = str(user["_id"])
    result = await db.cardio.insert_one(cardio.model_dump(exclude_none=True))
    return str(result.inserted_id)


@router.get("/")
async def get_cardio(user=Depends(get_current_user)):
    sessions = []
    cursor = db.cardio.find({"user_id": str(user["_id"])}).sort("date", -1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        sessions.append(document)
    return sessions
