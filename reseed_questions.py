import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import sys
sys.path.insert(0, "/app/backend")
load_dotenv(Path("/app/backend/.env"))
from seed_data import QUESTIONS

async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = c[os.environ["DB_NAME"]]
    await db.game_questions.delete_many({})
    await db.game_questions.insert_many([dict(q) for q in QUESTIONS])
    n = await db.game_questions.count_documents({})
    arch = await db.game_questions.count_documents({"rank": "archaeologist"})
    loc = await db.game_questions.count_documents({"category": "location"})
    print("total", n, "archaeologist", arch, "location", loc)
    c.close()

asyncio.run(main())
