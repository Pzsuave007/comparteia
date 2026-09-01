from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import json

import game as G
from seed_data import all_entities, QUESTIONS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("archivo")

CONTENT: Optional[G.Content] = None


# --------------------------------------------------------------------------
# Content loading / seeding
# --------------------------------------------------------------------------
async def load_content():
    global CONTENT
    entities = await db.game_entities.find({"active": True}, {"_id": 0}).to_list(1000)
    questions = await db.game_questions.find({"active": True}, {"_id": 0}).to_list(5000)
    CONTENT = G.Content(entities, questions)
    return CONTENT


async def seed_if_empty():
    if await db.game_entities.count_documents({}) == 0:
        await db.game_entities.insert_many([dict(e) for e in all_entities()])
        logger.info("Seeded entities")
    if await db.game_questions.count_documents({}) == 0:
        await db.game_questions.insert_many([dict(q) for q in QUESTIONS])
        logger.info("Seeded questions")


@app.on_event("startup")
async def startup():
    await seed_if_empty()
    await load_content()


@app.on_event("shutdown")
async def shutdown():
    client.close()


# --------------------------------------------------------------------------
# WebSocket connection manager
# --------------------------------------------------------------------------
CONNS: dict = {}  # code -> list of {ws, role, pid}


async def _send(ws, payload):
    try:
        await ws.send_text(json.dumps(payload))
    except Exception:
        pass


async def broadcast(code):
    room = G.ROOMS.get(code)
    if not room or code not in CONNS:
        return
    pub = {"type": "state", "state": G.public_state(room, CONTENT)}
    for c in list(CONNS[code]):
        await _send(c["ws"], pub)
        if c["role"] == "player" and c["pid"]:
            priv = G.private_state(room, c["pid"])
            if priv:
                await _send(c["ws"], {"type": "private", "private": priv})


async def broadcast_reaction(code, name, emoji):
    if not emoji or code not in CONNS:
        return
    payload = {"type": "reaction", "emoji": str(emoji)[:8], "name": name}
    for c in list(CONNS[code]):
        await _send(c["ws"], payload)


@api_router.websocket("/ws/{code}")
async def ws_endpoint(websocket: WebSocket, code: str):
    await websocket.accept()
    role = websocket.query_params.get("role", "host")
    pid = websocket.query_params.get("pid")
    room = G.ROOMS.get(code)
    if not room:
        await _send(websocket, {"type": "error", "message": "room_not_found"})
        await websocket.close()
        return
    conn = {"ws": websocket, "role": role, "pid": pid}
    CONNS.setdefault(code, []).append(conn)
    if role == "player" and pid and pid in room["players"]:
        room["players"][pid]["connected"] = True
    await broadcast(code)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            await handle_action(room, role, pid, msg)
            await broadcast(code)
    except WebSocketDisconnect:
        pass
    finally:
        if code in CONNS and conn in CONNS[code]:
            CONNS[code].remove(conn)
        if role == "player" and pid and pid in room["players"]:
            still = any(c["pid"] == pid for c in CONNS.get(code, []))
            if not still:
                room["players"][pid]["connected"] = False
        await broadcast(code)


async def handle_action(room, role, pid, msg):
    action = msg.get("action")
    global CONTENT
    if role == "host":
        if action == "start" and room["status"] == "lobby" and len(room["players"]) >= 1:
            await load_content()
            G.start_game(room, CONTENT)
        elif action == "newgame":
            await load_content()
            G.new_game(room, CONTENT)
            room["status"] = "playing"
        elif action == "skip":
            G.skip_player(room)
        elif action == "remove":
            G.remove_player(room, msg.get("pid"))
        elif action == "pause":
            G.set_pause(room, True)
        elif action == "resume":
            G.set_pause(room, False)
        elif action == "sound":
            G.set_sound(room, bool(msg.get("on", True)))
        elif action == "settings":
            if "host_language" in msg:
                room["host_language"] = msg["host_language"]
            if "show_translation" in msg:
                room["show_translation"] = bool(msg["show_translation"])
        return
    if not pid:
        return
    if action == "roll":
        G.roll_dice(room, CONTENT, pid)
    elif action == "choose_stop":
        G.choose_stop(room, CONTENT, pid, msg.get("step"))
    elif action == "continue":
        G.continue_turn(room, CONTENT, pid)
    elif action == "choose_category":
        G.choose_category(room, CONTENT, pid, msg.get("category"))
    elif action == "choose_candidate":
        G.choose_candidate(room, CONTENT, pid, msg.get("candidate_id"))
    elif action == "choose_location":
        G.choose_location(room, CONTENT, pid, msg.get("location_id"))
    elif action == "answer":
        G.submit_answer(room, CONTENT, pid, msg.get("answer"))
    elif action == "predict":
        G.predict(room, CONTENT, pid, msg.get("value"))
    elif action == "request_help":
        G.request_help(room, CONTENT, pid)
    elif action == "vote":
        G.vote_help(room, CONTENT, pid, msg.get("letter"))
    elif action == "emoji":
        name = room["players"].get(pid, {}).get("name", "?")
        await broadcast_reaction(room["code"], name, msg.get("emoji"))
    elif action == "pass":
        G.pass_turn(room, CONTENT, pid)
    elif action == "claim_win":
        G.claim_win(room, CONTENT, pid)


# --------------------------------------------------------------------------
# REST: room lifecycle
# --------------------------------------------------------------------------
class CreateRoom(BaseModel):
    host_language: str = "bilingual"
    show_translation: bool = True


class JoinRoom(BaseModel):
    code: str
    name: str
    language: str = "es"
    rank: str = "explorer"


@api_router.get("/")
async def root():
    return {"message": "Archivo Biblico Perdido API"}


@api_router.post("/rooms")
async def create_room(body: CreateRoom):
    room = G.create_room(body.host_language, body.show_translation)
    return {"code": room["code"]}


@api_router.get("/rooms/{code}")
async def get_room(code: str):
    room = G.ROOMS.get(code)
    if not room:
        raise HTTPException(404, "room_not_found")
    return G.public_state(room, CONTENT)


@api_router.post("/rooms/join")
async def join_room(body: JoinRoom):
    room = G.ROOMS.get(body.code)
    if not room:
        raise HTTPException(404, "room_not_found")
    pid = G.add_player(room, body.name.strip()[:20] or "Jugador", body.language, body.rank)
    await broadcast(body.code)
    return {"code": body.code, "player_id": pid}


@api_router.post("/rooms/{code}/player/{pid}")
async def update_player(code: str, pid: str, body: dict):
    room = G.ROOMS.get(code)
    if not room or pid not in room["players"]:
        raise HTTPException(404, "not_found")
    p = room["players"][pid]
    if "language" in body:
        p["language"] = body["language"]
    if "rank" in body:
        p["rank"] = body["rank"]
    if "name" in body:
        p["name"] = str(body["name"]).strip()[:20] or p["name"]
    await broadcast(code)
    return {"ok": True}


# --------------------------------------------------------------------------
# REST: admin content CRUD
# --------------------------------------------------------------------------
@api_router.get("/admin/entities")
async def admin_entities(category: Optional[str] = None):
    q = {"category": category} if category else {}
    return await db.game_entities.find(q, {"_id": 0}).to_list(1000)


@api_router.post("/admin/entities")
async def admin_save_entity(body: dict):
    if not body.get("id") or not body.get("category"):
        raise HTTPException(400, "id_and_category_required")
    body.setdefault("active", True)
    await db.game_entities.update_one(
        {"id": body["id"], "category": body["category"]}, {"$set": body}, upsert=True)
    await load_content()
    return {"ok": True}


@api_router.delete("/admin/entities/{category}/{eid}")
async def admin_delete_entity(category: str, eid: str):
    await db.game_entities.delete_one({"id": eid, "category": category})
    await load_content()
    return {"ok": True}


@api_router.get("/admin/questions")
async def admin_questions():
    return await db.game_questions.find({}, {"_id": 0}).to_list(5000)


@api_router.post("/admin/questions")
async def admin_save_question(body: dict):
    if not body.get("id"):
        raise HTTPException(400, "id_required")
    body.setdefault("active", True)
    await db.game_questions.update_one({"id": body["id"]}, {"$set": body}, upsert=True)
    await load_content()
    return {"ok": True}


@api_router.delete("/admin/questions/{qid}")
async def admin_delete_question(qid: str):
    await db.game_questions.delete_one({"id": qid})
    await load_content()
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
