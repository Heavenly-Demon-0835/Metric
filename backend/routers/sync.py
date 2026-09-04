"""WatermelonDB synchronisation endpoints.

The client and the database deliberately store some fields differently:

* `date` is a BSON datetime in Mongo (so range queries work) but epoch
  milliseconds on the client.
* `exercises`, `supplements` and `items` are arrays in Mongo but JSON strings
  in WatermelonDB columns, and `items_json` is named differently on each side.

`TABLES` below is the single source of truth for that mapping. Every field the
client sends is projected through it, which also means a client cannot write
arbitrary keys into a collection — anything outside the contract is dropped.
"""

import json
import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo import UpdateMany, UpdateOne
from pymongo.errors import BulkWriteError

from database import db
from routers.auth import get_current_user
from utils import now_ms, to_datetime, to_ms

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])

# Timestamps are exchanged as epoch milliseconds on every table.
SYNC_TIMESTAMPS = ("created_at", "updated_at")

# table name (client) -> mapping to the Mongo collection.
#   columns: the WatermelonDB columns, excluding the implicit `id`
#   dates:   columns stored as BSON datetimes, exchanged as epoch ms
#   json:    client column -> Mongo field, stored as an array, sent as a string
TABLES: dict[str, dict] = {
    "workouts": {
        "collection": "workouts",
        "columns": ("user_id", "date", "exercises", "created_at", "updated_at"),
        "dates": ("date",),
        "json": {"exercises": "exercises"},
    },
    "cardio": {
        "collection": "cardio",
        "columns": (
            "user_id", "date", "duration_minutes", "distance_km",
            "created_at", "updated_at",
        ),
        "dates": ("date",),
        "json": {},
    },
    "sleep": {
        "collection": "sleep",
        "columns": (
            "user_id", "date", "duration_hours", "quality",
            "created_at", "updated_at",
        ),
        "dates": ("date",),
        "json": {},
    },
    "diet": {
        "collection": "diet",
        "columns": (
            "user_id", "date", "meal_name", "calories", "protein_g", "carbs_g",
            "fat_g", "water_ml", "supplements", "items_json",
            "created_at", "updated_at",
        ),
        "dates": ("date",),
        "json": {"supplements": "supplements", "items_json": "items"},
    },
    "water_logs": {
        "collection": "water",
        "columns": ("user_id", "date", "amount_ml", "created_at", "updated_at"),
        "dates": ("date",),
        "json": {},
    },
    "food_items": {
        "collection": "food_items",
        "columns": (
            "user_id", "name", "calories_per_100g", "protein_per_100g",
            "carbs_per_100g", "fat_per_100g", "is_staple", "meal_context",
            "created_at", "updated_at",
        ),
        "dates": (),
        "json": {},
    },
    "daily_goals": {
        "collection": "daily_goals",
        "columns": (
            "user_id", "metric_type", "target_value", "frequency",
            "created_at", "updated_at",
        ),
        "dates": (),
        "json": {},
    },
}


class PushPayload(BaseModel):
    changes: dict[str, dict[str, list]] = Field(default_factory=dict)
    lastPulledAt: int | None = None


def _parse_json_list(value) -> list:
    """Read a WatermelonDB JSON column, tolerating already-decoded values."""
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        return parsed if isinstance(parsed, list) else []
    return []


def _record_id(raw):
    """Resolve a client record id to the type used as `_id`.

    Rows created through the REST API have ObjectId keys, rows created offline
    have WatermelonDB's own string ids. Watermelon ids are 16 characters from a
    non-hex alphabet, so a valid 24-character hex string is unambiguously an
    ObjectId round-tripped through a pull.
    """
    if isinstance(raw, str) and ObjectId.is_valid(raw):
        return ObjectId(raw)
    return raw


def _to_client(doc: dict, spec: dict) -> dict:
    """Project a Mongo document into a WatermelonDB record."""
    record = {"id": str(doc["_id"])}
    for column in spec["columns"]:
        value = doc.get(spec["json"].get(column, column))
        if column in spec["dates"] or column in SYNC_TIMESTAMPS:
            record[column] = to_ms(value)
        elif column in spec["json"]:
            record[column] = json.dumps(_parse_json_list(value))
        else:
            record[column] = value
    return record


def _to_document(record: dict, spec: dict, user_id: str) -> dict:
    """Project a WatermelonDB record into a Mongo document.

    Iterating the contract rather than the payload is what keeps unknown client
    keys out of the database.
    """
    doc: dict = {}
    for column in spec["columns"]:
        if column not in record:
            continue
        value = record[column]
        target = spec["json"].get(column, column)
        if column in spec["dates"]:
            doc[target] = to_datetime(value)
        elif column in spec["json"]:
            doc[target] = _parse_json_list(value)
        elif column in SYNC_TIMESTAMPS:
            doc[target] = to_ms(value)
        else:
            doc[target] = value

    # Ownership and modification time are server-authoritative: a client may
    # not reassign a row, and a skewed device clock must not be able to write
    # an `updated_at` that hides the row from other devices' pulls.
    doc["user_id"] = user_id
    doc["updated_at"] = now_ms()
    doc.setdefault("created_at", doc["updated_at"])
    return doc


@router.get("")
@router.get("/", include_in_schema=False)
async def pull_changes(last_pulled_at: int = 0, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    changes = {}

    for table_name, spec in TABLES.items():
        cursor = db[spec["collection"]].find({
            "user_id": user_id,
            "updated_at": {"$gt": last_pulled_at},
        })

        created, updated, deleted = [], [], []

        async for doc in cursor:
            if doc.get("deleted_at"):
                deleted.append(str(doc["_id"]))
            elif to_ms(doc.get("created_at")) > last_pulled_at:
                created.append(_to_client(doc, spec))
            else:
                updated.append(_to_client(doc, spec))

        changes[table_name] = {
            "created": created,
            "updated": updated,
            "deleted": deleted,
        }

    return {"changes": changes, "timestamp": now_ms()}


@router.post("")
@router.post("/", include_in_schema=False)
async def push_changes(payload: PushPayload, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    for table_name, spec in TABLES.items():
        table_changes = payload.changes.get(table_name) or {}
        collection = db[spec["collection"]]

        # Upserts rather than inserts: a push that fails partway is retried in
        # full by the client, and re-inserting an existing id would abort it.
        operations = []
        for record in (table_changes.get("created") or []) + (table_changes.get("updated") or []):
            record_id = _record_id(record.get("id"))
            if record_id is None:
                continue
            operations.append(UpdateOne(
                {"_id": record_id, "user_id": user_id},
                {"$set": _to_document(record, spec, user_id)},
                upsert=True,
            ))

        deleted_ids = [_record_id(rid) for rid in (table_changes.get("deleted") or []) if rid]
        if deleted_ids:
            ts = now_ms()
            operations.append(UpdateMany(
                {"_id": {"$in": deleted_ids}, "user_id": user_id},
                {"$set": {"deleted_at": ts, "updated_at": ts}},
            ))

        if not operations:
            continue

        try:
            await collection.bulk_write(operations, ordered=False)
        except BulkWriteError as exc:
            # Reached when an id already exists under a different account, so
            # the ownership filter misses and the upsert collides on `_id`.
            logger.warning("Sync push conflict on %s: %s", table_name, exc.details)
            raise HTTPException(
                status_code=409,
                detail=f"Could not apply all changes to {table_name}",
            )

    return {"success": True}
