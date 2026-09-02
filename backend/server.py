from fastapi import (FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException,
                     Depends, Header, UploadFile, File)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import csv
import io
import hmac
import jwt
from datetime import datetime, timezone, timedelta
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
# Admin authentication (single admin, JWT bearer token)
# --------------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "07626e42ad11facb2a96f503acdf41325fa36968b317e111658831b1def7f203")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "pzsuave")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "MXmedia007!")


def make_admin_token(username: str) -> str:
    payload = {
        "sub": username, "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def require_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "not_authenticated")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "token_expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "invalid_token")
    if payload.get("role") != "admin":
        raise HTTPException(403, "forbidden")
    return payload


# --------------------------------------------------------------------------
# Question CSV import/export helpers
# Columns match the master bank format:
# question_id, entity_type, entity_id, difficulty, language, question,
# option_a, option_b, option_c, option_d, correct_answer, bible_reference,
# explanation, active
# --------------------------------------------------------------------------
Q_CSV_COLUMNS = [
    "question_id", "entity_type", "entity_id", "difficulty", "language", "question",
    "option_a", "option_b", "option_c", "option_d", "correct_answer",
    "bible_reference", "explanation", "active",
]


def parse_question_row(row: dict):
    def g(*keys):
        for k in keys:
            v = row.get(k)
            if v is not None and str(v).strip() != "":
                return str(v).strip()
        return ""
    qid = g("question_id", "id")
    if not qid:
        return None, None, "falta question_id"
    lang = (g("language") or "es").lower()[:2]
    ca = (g("correct_answer") or "A").upper()[:1]
    if ca not in ("A", "B", "C", "D"):
        return None, None, f"correct_answer inválido: {ca}"
    tr = {
        "question": g("question"),
        "answer_a": g("option_a", "answer_a"), "answer_b": g("option_b", "answer_b"),
        "answer_c": g("option_c", "answer_c"), "answer_d": g("option_d", "answer_d"),
        "explanation": g("explanation"),
    }
    active_raw = g("active").lower()
    active = active_raw not in ("false", "0", "no")
    doc = {
        "id": qid,
        "category": g("entity_type", "category") or "character",
        "related_entity_id": g("entity_id", "related_entity_id"),
        "rank": g("difficulty", "rank") or "explorer",
        "correct_answer": ca,
        "bible_reference": g("bible_reference"),
        "active": active,
        "translations": {lang: tr},
    }
    return doc, lang, None


def question_to_rows(q: dict):
    rows = []
    for lang, tr in (q.get("translations") or {}).items():
        rows.append({
            "question_id": q.get("id", ""), "entity_type": q.get("category", ""),
            "entity_id": q.get("related_entity_id", ""), "difficulty": q.get("rank", ""),
            "language": lang, "question": tr.get("question", ""),
            "option_a": tr.get("answer_a", ""), "option_b": tr.get("answer_b", ""),
            "option_c": tr.get("answer_c", ""), "option_d": tr.get("answer_d", ""),
            "correct_answer": q.get("correct_answer", ""),
            "bible_reference": q.get("bible_reference", ""),
            "explanation": tr.get("explanation", ""),
            "active": str(q.get("active", True)),
        })
    return rows


def _csv_response(header, rows, filename):
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=header, quoting=csv.QUOTE_ALL)
    w.writeheader()
    for r in rows:
        w.writerow(r)
    return Response(
        content="\ufeff" + out.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
                G.handle_disconnect(room, pid)
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
    elif action == "choose_candidate":
        G.choose_candidate(room, CONTENT, pid, msg.get("candidate_id"))
    elif action == "answer":
        G.submit_answer(room, CONTENT, pid, msg.get("answer"))
    elif action == "steal":
        G.steal_answer(room, CONTENT, pid, msg.get("answer"))
    elif action == "duel_answer":
        G.duel_answer(room, CONTENT, pid, msg.get("answer"))
    elif action == "duel_vote":
        G.duel_vote(room, CONTENT, pid, msg.get("target"))
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
    avatar: str = ""


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
    pid = G.add_player(room, body.name.strip()[:20] or "Jugador", body.language, body.rank, body.avatar)
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
@api_router.post("/admin/login")
async def admin_login(body: dict):
    u = str(body.get("username", ""))
    p = str(body.get("password", ""))
    ok = hmac.compare_digest(u, ADMIN_USERNAME) and hmac.compare_digest(p, ADMIN_PASSWORD)
    if not ok:
        raise HTTPException(401, "invalid_credentials")
    return {"token": make_admin_token(u), "username": u}


@api_router.get("/admin/me")
async def admin_me(admin=Depends(require_admin)):
    return {"username": admin.get("sub"), "role": admin.get("role")}


@api_router.get("/admin/entities")
async def admin_entities(category: Optional[str] = None, admin=Depends(require_admin)):
    q = {"category": category} if category else {}
    return await db.game_entities.find(q, {"_id": 0}).to_list(1000)


@api_router.post("/admin/entities")
async def admin_save_entity(body: dict, admin=Depends(require_admin)):
    if not body.get("id") or not body.get("category"):
        raise HTTPException(400, "id_and_category_required")
    body.setdefault("active", True)
    await db.game_entities.update_one(
        {"id": body["id"], "category": body["category"]}, {"$set": body}, upsert=True)
    await load_content()
    return {"ok": True}


@api_router.delete("/admin/entities/{category}/{eid}")
async def admin_delete_entity(category: str, eid: str, admin=Depends(require_admin)):
    await db.game_entities.delete_one({"id": eid, "category": category})
    await load_content()
    return {"ok": True}


@api_router.get("/admin/questions")
async def admin_questions(admin=Depends(require_admin)):
    return await db.game_questions.find({}, {"_id": 0}).to_list(5000)


@api_router.post("/admin/questions")
async def admin_save_question(body: dict, admin=Depends(require_admin)):
    if not body.get("id"):
        raise HTTPException(400, "id_required")
    body.setdefault("active", True)
    await db.game_questions.update_one({"id": body["id"]}, {"$set": body}, upsert=True)
    await load_content()
    return {"ok": True}


@api_router.delete("/admin/questions/{qid}")
async def admin_delete_question(qid: str, admin=Depends(require_admin)):
    await db.game_questions.delete_one({"id": qid})
    await load_content()
    return {"ok": True}


@api_router.get("/admin/questions/template")
async def admin_questions_template(admin=Depends(require_admin)):
    sample = [{
        "question_id": "david_explorer_001", "entity_type": "character", "entity_id": "david",
        "difficulty": "explorer", "language": "es", "question": "¿A quién derrotó David?",
        "option_a": "Goliat", "option_b": "Saúl", "option_c": "Faraón", "option_d": "Nabucodonosor",
        "correct_answer": "A", "bible_reference": "1 Samuel 17:49",
        "explanation": "David venció al gigante Goliat con una honda y una piedra.", "active": "True",
    }]
    return _csv_response(Q_CSV_COLUMNS, sample, "plantilla_preguntas.csv")


@api_router.get("/admin/questions/export")
async def admin_questions_export(category: Optional[str] = None, admin=Depends(require_admin)):
    q = {"category": category} if category else {}
    docs = await db.game_questions.find(q, {"_id": 0}).to_list(5000)
    rows = []
    for d in docs:
        rows.extend(question_to_rows(d))
    fname = f"preguntas_{category or 'todas'}.csv"
    return _csv_response(Q_CSV_COLUMNS, rows, fname)


@api_router.post("/admin/questions/import_csv")
async def admin_questions_import_csv(
    file: UploadFile = File(...),
    replace_category: Optional[str] = None,
    admin=Depends(require_admin),
):
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    parsed, errors = [], []
    for i, row in enumerate(reader, start=2):
        doc, lang, err = parse_question_row(row)
        if err:
            errors.append(f"fila {i}: {err}")
            continue
        parsed.append((doc, lang))
    if not parsed:
        raise HTTPException(400, "no_valid_rows")

    deleted = 0
    if replace_category:
        res = await db.game_questions.delete_many({"category": replace_category})
        deleted = res.deleted_count

    added = updated = 0
    for doc, lang in parsed:
        existing = None if replace_category else await db.game_questions.find_one({"id": doc["id"]})
        setfields = {k: v for k, v in doc.items() if k != "translations"}
        setfields[f"translations.{lang}"] = doc["translations"][lang]
        await db.game_questions.update_one({"id": doc["id"]}, {"$set": setfields}, upsert=True)
        if existing:
            updated += 1
        else:
            added += 1
    await load_content()
    return {"added": added, "updated": updated, "deleted": deleted,
            "rows": len(parsed), "errors": errors}





app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Serve the built React frontend (single-port self-hosting).
# Only active when a build exists; the Emergent preview (no build dir) is
# unaffected because the frontend runs separately there.
# --------------------------------------------------------------------------
FRONTEND_BUILD = os.environ.get("FRONTEND_BUILD_DIR", str(ROOT_DIR.parent / "frontend" / "build"))
if os.path.isdir(FRONTEND_BUILD):
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_BUILD, "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = os.path.join(FRONTEND_BUILD, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_BUILD, "index.html"))
