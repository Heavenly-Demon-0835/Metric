import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

import database
from database import db
from routers import activities, auth, discovery, food_library, goals, sync

load_dotenv()

# Uvicorn configures its own loggers but leaves the root logger bare, so without
# this every logger.info below is discarded and a startup failure is invisible.
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

# Collections that participate in the WatermelonDB sync contract.
SYNCED_COLLECTIONS = (
    "workouts", "cardio", "sleep", "diet", "water", "food_items", "daily_goals",
)

# Rows written before timestamps were mandatory have no `updated_at`, so the
# sync pull filter never matches them and they stay invisible to every client.
# Derive one from whatever the row does have.
_TIMESTAMP_BACKFILL = [
    {"$set": {
        "created_at": {"$toLong": {"$ifNull": ["$created_at", "$date", "$$NOW"]}},
        "updated_at": {"$toLong": {"$ifNull": ["$created_at", "$date", "$$NOW"]}},
    }}
]


async def _prepare_database() -> None:
    for collection in SYNCED_COLLECTIONS:
        # (user_id, date) serves the month-filtered list endpoints;
        # (user_id, updated_at) serves every sync pull.
        await db[collection].create_index([("user_id", 1), ("date", -1)], background=True)
        await db[collection].create_index([("user_id", 1), ("updated_at", -1)], background=True)

        result = await db[collection].update_many(
            {"updated_at": {"$exists": False}}, _TIMESTAMP_BACKFILL
        )
        if result.modified_count:
            logger.info(
                "Backfilled sync timestamps on %s rows in %s",
                result.modified_count, collection,
            )

    await db.users.create_index("email", unique=True, background=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await _prepare_database()
    except PyMongoError:
        # A cold database should not stop the process from booting — the health
        # endpoint will report the problem and requests will surface 503s.
        logger.exception("Database preparation failed at startup")
    yield
    database.close()


app = FastAPI(
    title="Metric API",
    description="Fitness Logger Backend",
    lifespan=lifespan,
)

# Origins must be listed explicitly: a wildcard would let any site on the web
# call this API with a token it has managed to obtain.
_extra_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _extra_origins.split(",") if o.strip()] or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Every router calls Mongo directly. Without this, an outage surfaces as an
# unhandled 500 and the client cannot tell "the server is broken" from "the
# database is down" — only the latter is worth retrying. Starlette resolves
# handlers by walking the exception MRO, so one registration covers every
# PyMongoError subclass raised anywhere in the app.
@app.exception_handler(PyMongoError)
async def database_error_handler(request: Request, exc: PyMongoError) -> JSONResponse:
    logger.exception("Database error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database unavailable, please retry shortly"},
    )


app.include_router(auth.router)
app.include_router(auth.users_router)
app.include_router(activities.router)
app.include_router(sync.router)
app.include_router(food_library.router)
app.include_router(goals.router)
app.include_router(discovery.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Metric API"}


@app.get("/health")
async def health(response: Response):
    """Readiness probe. Reports 503 when the database is unreachable so that
    platform health checks actually fail instead of reading a 200 body."""
    try:
        await db.command("ping")
    except PyMongoError:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "degraded", "database": "unreachable"}
    return {"status": "ok", "database": "ok"}
