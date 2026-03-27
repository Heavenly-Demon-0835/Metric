from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from database import db
from models import FoodItem
from routers.auth import get_current_user
import re

router = APIRouter(prefix="/food-library", tags=["food_library"])


@router.post("/", response_model=str)
async def create_food(food: FoodItem, user=Depends(get_current_user)):
    food.user_id = str(user["_id"])
    # Duplicate check (case-insensitive)
    existing = await db.food_items.find_one({
        "user_id": food.user_id,
        "name": {"$regex": f"^{re.escape(food.name)}$", "$options": "i"},
        "deleted_at": {"$exists": False},
    })
    if existing:
        raise HTTPException(status_code=409, detail=f"'{food.name}' already exists in your library")
    result = await db.food_items.insert_one(food.model_dump())
    return str(result.inserted_id)


@router.get("/")
async def list_foods(user=Depends(get_current_user)):
    uid = str(user["_id"])
    items = []
    async for doc in db.food_items.find({"user_id": uid, "deleted_at": {"$exists": False}}).sort("name", 1):
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/search")
async def search_foods(q: str = Query(..., min_length=1), user=Depends(get_current_user)):
    uid = str(user["_id"])
    pattern = re.compile(re.escape(q), re.IGNORECASE)
    items = []
    async for doc in db.food_items.find({
        "user_id": uid,
        "name": {"$regex": pattern},
        "deleted_at": {"$exists": False},
    }).limit(20):
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/staples")
async def get_staples(context: str = Query(None), user=Depends(get_current_user)):
    uid = str(user["_id"])
    query: dict = {"user_id": uid, "is_staple": True, "deleted_at": {"$exists": False}}
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
    existing = await db.food_items.find_one({"_id": ObjectId(item_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Food item not found")
    data = food.model_dump()
    data["user_id"] = uid
    await db.food_items.replace_one({"_id": ObjectId(item_id)}, data)
    return {"status": "updated"}


@router.delete("/{item_id}")
async def delete_food(item_id: str, user=Depends(get_current_user)):
    uid = str(user["_id"])
    result = await db.food_items.find_one({"_id": ObjectId(item_id), "user_id": uid})
    if not result:
        raise HTTPException(status_code=404, detail="Food item not found")
    # Soft delete for sync compatibility
    from datetime import datetime
    await db.food_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {
            "deleted_at": int(datetime.utcnow().timestamp() * 1000),
            "updated_at": int(datetime.utcnow().timestamp() * 1000),
        }}
    )
    return {"status": "deleted"}
