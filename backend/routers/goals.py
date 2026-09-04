from fastapi import APIRouter, Depends, HTTPException

from database import db
from models import DailyGoal
from routers.auth import get_current_user
from utils import active_filter, now_ms, oid, stamp_created, stamp_updated

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("/", response_model=str)
async def create_goal(goal: DailyGoal, user=Depends(get_current_user)):
    data = goal.model_dump()
    data["user_id"] = str(user["_id"])
    result = await db.daily_goals.insert_one(stamp_created(data))
    return str(result.inserted_id)


@router.get("/")
async def list_goals(user=Depends(get_current_user)):
    query = active_filter()
    query["user_id"] = str(user["_id"])
    goals = []
    async for doc in db.daily_goals.find(query):
        doc["_id"] = str(doc["_id"])
        goals.append(doc)
    return goals


@router.put("/{goal_id}")
async def update_goal(goal_id: str, goal: DailyGoal, user=Depends(get_current_user)):
    uid = str(user["_id"])
    key = {"_id": oid(goal_id), "user_id": uid}
    existing = await db.daily_goals.find_one({**key, **active_filter()})
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    data = goal.model_dump()
    data["user_id"] = uid
    data["created_at"] = existing.get("created_at", now_ms())
    await db.daily_goals.replace_one(key, stamp_updated(data))
    return {"status": "updated"}


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(get_current_user)):
    # Soft delete so the removal propagates to offline clients on next sync.
    ts = now_ms()
    result = await db.daily_goals.update_one(
        {"_id": oid(goal_id), "user_id": str(user["_id"]), **active_filter()},
        {"$set": {"deleted_at": ts, "updated_at": ts}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"status": "deleted"}
