from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
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


@router.put("/{entry_id}")
async def update_cardio(entry_id: str, cardio: CardioSession, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.cardio.find_one({"_id": ObjectId(entry_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = cardio.model_dump(exclude_none=True)
    data["user_id"] = uid
    await db.cardio.replace_one({"_id": ObjectId(entry_id)}, data)
    return {"status": "updated"}


@router.delete("/{entry_id}")
async def delete_cardio(entry_id: str, user=Depends(get_current_user)):
    result = await db.cardio.delete_one({"_id": ObjectId(entry_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}
