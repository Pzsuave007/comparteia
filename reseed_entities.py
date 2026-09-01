import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import sys
sys.path.insert(0, "/app/backend")
load_dotenv(Path("/app/backend/.env"))
from seed_data import all_entities

async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = c[os.environ["DB_NAME"]]
    ents = all_entities()
    await db.game_entities.delete_many({})
    await db.game_entities.insert_many([dict(e) for e in ents])
    n = await db.game_entities.count_documents({})
    sample = await db.game_entities.find_one({"id": "jesus"}, {"_id": 0, "image": 1})
    print("entities", n, "jesus img", sample["image"][-30:])
    c.close()

asyncio.run(main())
