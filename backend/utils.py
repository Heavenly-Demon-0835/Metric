"""Shared helpers for ID parsing and sync-compatible timestamps.

Every document carries `created_at` / `updated_at` / `deleted_at` as integer
epoch milliseconds, because that is what WatermelonDB requires on the client.
Domain `date` fields stay BSON datetimes so Mongo range queries keep working —
the sync layer converts those at its boundary.
"""

from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def now_ms() -> int:
    """Current UTC time as integer epoch milliseconds."""
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def to_ms(value) -> int:
    """Coerce a datetime or numeric timestamp into epoch milliseconds."""
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return int(value.timestamp() * 1000)
    if isinstance(value, (int, float)):
        return int(value)
    return 0


def to_datetime(value) -> datetime:
    """Coerce epoch milliseconds (or a datetime) into an aware datetime."""
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    return datetime.now(timezone.utc)


def oid(value: str) -> ObjectId:
    """Parse a path parameter into an ObjectId.

    Malformed IDs are a 404 rather than an unhandled InvalidId (which would
    surface as a 500) — from the caller's perspective the entry does not exist.
    """
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Entry not found")


def stamp_created(data: dict) -> dict:
    """Add sync timestamps to a new document."""
    ts = now_ms()
    data["created_at"] = ts
    data["updated_at"] = ts
    return data


def stamp_updated(data: dict) -> dict:
    """Bump `updated_at` so the change is picked up by the next sync pull."""
    data["updated_at"] = now_ms()
    return data


def active_filter() -> dict:
    """Filter fragment excluding soft-deleted documents.

    Returns a fresh dict each call so callers can safely mutate it.
    """
    return {"deleted_at": {"$exists": False}}
