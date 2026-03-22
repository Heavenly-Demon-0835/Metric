from fastapi import APIRouter, Depends, Request
from routers.auth import get_current_user
from database import db
from datetime import datetime

router = APIRouter(prefix="/sync", tags=["sync"])

@router.get("/")
async def pull_changes(last_pulled_at: int = 0, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    tables = ["workouts", "cardio", "sleep", "diet"]
    changes = {}
    
    for table_name in tables:
        cursor = db[table_name].find({
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
        "timestamp": int(datetime.utcnow().timestamp() * 1000)
    }

@router.post("/")
async def push_changes(request: Request, user=Depends(get_current_user)):
    data = await request.json()
    changes = data.get("changes", {})
    last_pulled_at = data.get("lastPulledAt", 0)
    user_id = str(user["_id"])
    
    tables = ["workouts", "cardio", "sleep", "diet"]
    
    for table_name in tables:
        table_changes = changes.get(table_name, {})
        
        # Process created
        for record in table_changes.get("created", []):
            record["_id"] = record.get("id")
            if "id" in record:
                del record["id"]
            record["user_id"] = user_id
            await db[table_name].insert_one(record)
            
        # Process updated
        for record in table_changes.get("updated", []):
            record_id = record.get("id")
            if "id" in record:
                del record["id"]
            record["user_id"] = user_id
            await db[table_name].update_one(
                {"_id": record_id, "user_id": user_id},
                {"$set": record}
            )
            
        # Process deleted
        for record_id in table_changes.get("deleted", []):
            await db[table_name].update_one(
                {"_id": record_id, "user_id": user_id},
                {"$set": {
                    "deleted_at": int(datetime.utcnow().timestamp() * 1000),
                    "updated_at": int(datetime.utcnow().timestamp() * 1000)
                }}
            )

    return {"success": True}
