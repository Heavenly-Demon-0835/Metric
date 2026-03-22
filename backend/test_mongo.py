import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_server_info():
    client = AsyncIOMotorClient("mongodb+srv://jaydave0835_db_user:Jayu%402005@linkfluence.vnmfke9.mongodb.net/metric_app?appName=Linkfluence", serverSelectionTimeoutMS=5000)
    try:
        info = await client.server_info()
        print("SUCCESS! Connected to:", info.get('version'))
    except Exception as e:
        print("FAIL (Atlas Connection Failed):", e)

if __name__ == "__main__":
    asyncio.run(get_server_info())
