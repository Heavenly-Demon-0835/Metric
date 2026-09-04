import re

from fastapi import APIRouter, Depends, HTTPException, Query

from database import db
from models import FoodItem
from routers.auth import get_current_user
from utils import active_filter, now_ms, oid, stamp_created, stamp_updated

router = APIRouter(prefix="/food-library", tags=["food_library"])


@router.post("/", response_model=str)
async def create_food(food: FoodItem, user=Depends(get_current_user)):
    uid = str(user["_id"])
    # Duplicate check (case-insensitive)
    duplicate_query = active_filter()
    duplicate_query["user_id"] = uid
    duplicate_query["name"] = {"$regex": f"^{re.escape(food.name)}$", "$options": "i"}
    if await db.food_items.find_one(duplicate_query):
        raise HTTPException(status_code=409, detail=f"'{food.name}' already exists in your library")

    data = food.model_dump()
    data["user_id"] = uid
    result = await db.food_items.insert_one(stamp_created(data))
    return str(result.inserted_id)


@router.get("/")
async def list_foods(user=Depends(get_current_user)):
    query = active_filter()
    query["user_id"] = str(user["_id"])
    items = []
    async for doc in db.food_items.find(query).sort("name", 1):
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/search")
async def search_foods(q: str = Query(..., min_length=1), user=Depends(get_current_user)):
    query = active_filter()
    query["user_id"] = str(user["_id"])
    query["name"] = {"$regex": re.escape(q), "$options": "i"}
    items = []
    async for doc in db.food_items.find(query).limit(20):
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/staples")
async def get_staples(context: str = Query(None), user=Depends(get_current_user)):
    query = active_filter()
    query["user_id"] = str(user["_id"])
    query["is_staple"] = True
    if context:
        query["meal_context"] = context
    items = []
    async for doc in db.food_items.find(query).sort("name", 1):
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.put("/{item_id}")
async def update_food(item_id: str, food: FoodItem, user=Depends(get_current_user)):
    uid = str(user["_id"])
    key = {"_id": oid(item_id), "user_id": uid}
    existing = await db.food_items.find_one({**key, **active_filter()})
    if not existing:
        raise HTTPException(status_code=404, detail="Food item not found")
    data = food.model_dump()
    data["user_id"] = uid
    data["created_at"] = existing.get("created_at", now_ms())
    await db.food_items.replace_one(key, stamp_updated(data))
    return {"status": "updated"}


@router.delete("/{item_id}")
async def delete_food(item_id: str, user=Depends(get_current_user)):
    # Soft delete for sync compatibility
    ts = now_ms()
    result = await db.food_items.update_one(
        {"_id": oid(item_id), "user_id": str(user["_id"]), **active_filter()},
        {"$set": {"deleted_at": ts, "updated_at": ts}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Food item not found")
    return {"status": "deleted"}
