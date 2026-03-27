from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import db
from models import DailyGoal
from routers.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("/", response_model=str)
async def create_goal(goal: DailyGoal, user=Depends(get_current_user)):
    goal.user_id = str(user["_id"])
    result = await db.daily_goals.insert_one(goal.model_dump())
    return str(result.inserted_id)


@router.get("/")
async def list_goals(user=Depends(get_current_user)):
    uid = str(user["_id"])
    goals = []
    async for doc in db.daily_goals.find({"user_id": uid}):
        doc["_id"] = str(doc["_id"])
        goals.append(doc)
    return goals


@router.put("/{goal_id}")
async def update_goal(goal_id: str, goal: DailyGoal, user=Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await db.daily_goals.find_one({"_id": ObjectId(goal_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    data = goal.model_dump()
    data["user_id"] = uid
    await db.daily_goals.replace_one({"_id": ObjectId(goal_id)}, data)
    return {"status": "updated"}


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(get_current_user)):
    result = await db.daily_goals.delete_one({
        "_id": ObjectId(goal_id),
        "user_id": str(user["_id"]),
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"status": "deleted"}
