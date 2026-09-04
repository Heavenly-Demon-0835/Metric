"""CRUD endpoints for the activity domains.

All five domains share one implementation: they differ only in their path,
collection and Pydantic model. Keeping the behaviour in one place is what makes
the sync contract (timestamps on write, soft deletes) provably consistent
across them.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from database import db
from models import CardioSession, DietLog, SleepLog, WaterLog, WorkoutSession
from routers.auth import get_current_user
from utils import active_filter, now_ms, oid, stamp_created, stamp_updated

router = APIRouter(tags=["activities"])


def _date_filter(user_id: str, month: str | None = None) -> dict:
    """Build a MongoDB query filter. If month is 'YYYY-MM', restrict to that month."""
    q = active_filter()
    q["user_id"] = user_id
    if month:
        try:
            year, mon = month.split("-")
            start = datetime(int(year), int(mon), 1, tzinfo=timezone.utc)
            # Next month boundary
            if int(mon) == 12:
                end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end = datetime(int(year), int(mon) + 1, 1, tzinfo=timezone.utc)
            q["date"] = {"$gte": start, "$lt": end}
        except (ValueError, IndexError):
            pass  # Ignore malformed month param — return all
    return q


def _register(path: str, collection: str, model: type[BaseModel], *, updatable: bool = True) -> None:
    """Register the standard CRUD surface for one activity domain.

    Both the bare and trailing-slash paths are registered so the frontend never
    hits a 307 redirect, which browsers handle poorly on cross-origin POSTs.
    """

    async def create(payload: model, user=Depends(get_current_user)):
        data = payload.model_dump()
        data["user_id"] = str(user["_id"])
        result = await db[collection].insert_one(stamp_created(data))
        return str(result.inserted_id)

    async def list_entries(user=Depends(get_current_user), month: str | None = Query(None)):
        entries = []
        cursor = db[collection].find(_date_filter(str(user["_id"]), month)).sort("date", -1)
        async for document in cursor:
            document["_id"] = str(document["_id"])
            entries.append(document)
        return entries

    async def update(entry_id: str, payload: model, user=Depends(get_current_user)):
        uid = str(user["_id"])
        key = {"_id": oid(entry_id), "user_id": uid}
        existing = await db[collection].find_one({**key, **active_filter()})
        if not existing:
            raise HTTPException(status_code=404, detail="Entry not found")
        data = payload.model_dump()
        data["user_id"] = uid
        # replace_one drops anything absent from the model, so carry the
        # creation time forward or the record looks new to the next sync pull.
        data["created_at"] = existing.get("created_at", now_ms())
        await db[collection].replace_one(key, stamp_updated(data))
        return {"status": "updated"}

    async def delete(entry_id: str, user=Depends(get_current_user)):
        # Soft delete: the tombstone is what tells other devices the row is
        # gone. A hard delete lets an offline client resurrect it on next push.
        ts = now_ms()
        result = await db[collection].update_one(
            {"_id": oid(entry_id), "user_id": str(user["_id"]), **active_filter()},
            {"$set": {"deleted_at": ts, "updated_at": ts}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"status": "deleted"}

    for route, hidden in ((f"/{path}", False), (f"/{path}/", True)):
        router.add_api_route(
            route, create, methods=["POST"], response_model=str,
            name=f"create_{path}", include_in_schema=not hidden,
        )
        router.add_api_route(
            route, list_entries, methods=["GET"],
            name=f"list_{path}", include_in_schema=not hidden,
        )

    if updatable:
        router.add_api_route(
            f"/{path}/{{entry_id}}", update, methods=["PUT"], name=f"update_{path}",
        )
    router.add_api_route(
        f"/{path}/{{entry_id}}", delete, methods=["DELETE"], name=f"delete_{path}",
    )


_register("cardio", "cardio", CardioSession)
_register("sleep", "sleep", SleepLog)
_register("water", "water", WaterLog, updatable=False)
_register("workouts", "workouts", WorkoutSession)
_register("diet", "diet", DietLog)
