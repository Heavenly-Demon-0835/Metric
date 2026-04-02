from fastapi import APIRouter, Depends, Request
from routers.auth import get_current_user
from database import db
from datetime import datetime, timezone

router = APIRouter(prefix="/sync", tags=["sync"])

# Mapping: WatermelonDB table name → MongoDB collection name
# Frontend uses 'water_logs', backend collection is 'water'
TABLE_MAP = {
    "workouts": "workouts",
    "cardio": "cardio",
    "sleep": "sleep",
    "diet": "diet",
    "food_items": "food_items",
    "daily_goals": "daily_goals",
    "water_logs": "water",
}

@router.get("/")
async def pull_changes(last_pulled_at: int = 0, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    changes = {}
    
    for table_name, collection_name in TABLE_MAP.items():
        cursor = db[collection_name].find({
            "user_id": user_id,
            "updated_at": {"$gt": last_pulled_at}
        })
        
        created = []
        updated = []
        deleted = []
        
        async for doc in cursor:
            # Format doc for WatermelonDB
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            
            if doc.get("deleted_at"):
                deleted.append(doc["id"])
            elif doc.get("created_at", 0) > last_pulled_at:
                created.append(doc)
            else:
                updated.append(doc)
                
        changes[table_name] = {
            "created": created,
            "updated": updated,
            "deleted": deleted
        }
    
    return {
        "changes": changes,
        "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)
    }

@router.post("/")
async def push_changes(request: Request, user=Depends(get_current_user)):
    data = await request.json()
    changes = data.get("changes", {})
    last_pulled_at = data.get("lastPulledAt", 0)
    user_id = str(user["_id"])
    
    for table_name, collection_name in TABLE_MAP.items():
        table_changes = changes.get(table_name, {})
        
        # Process created
        for record in table_changes.get("created", []):
            record["_id"] = record.get("id")
            if "id" in record:
                del record["id"]
            record["user_id"] = user_id
            await db[collection_name].insert_one(record)
            
        # Process updated
        for record in table_changes.get("updated", []):
            record_id = record.get("id")
            if "id" in record:
                del record["id"]
            record["user_id"] = user_id
            await db[collection_name].update_one(
                {"_id": record_id, "user_id": user_id},
                {"$set": record}
            )
            
        # Process deleted
        for record_id in table_changes.get("deleted", []):
            now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
            await db[collection_name].update_one(
                {"_id": record_id, "user_id": user_id},
                {"$set": {
                    "deleted_at": now_ms,
                    "updated_at": now_ms,
                }}
            )

    return {"success": True}
