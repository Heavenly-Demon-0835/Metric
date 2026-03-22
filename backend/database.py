import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Initialize MongoDB Client
client = AsyncIOMotorClient(MONGO_URI)
db = client.metrics_app

async def get_db():
    return db
