"""In-memory game engine + state machine for ARCHIVO BÍBLICO PERDIDO.

The server is authoritative: it holds the three secret pieces and every
player's private notebook. Public state never leaks secrets or private data.
"""
import random
import string

CATEGORIES = ["character", "location", "event"]

# --------------------------------------------------------------------------
# Content store (loaded from Mongo at game start)
# --------------------------------------------------------------------------
class Content:
    def __init__(self, entities, questions):
        self.entities = {e["id"] + ":" + e["category"]: e for e in entities}
        self.by_cat = {c: [e for e in entities if e["category"] == c] for c in CATEGORIES}
        self.questions = questions

    def entity(self, category, eid):
        return self.entities.get(eid + ":" + category)

    def public_entity(self, category, eid):
        e = self.entity(category, eid)
        if not e:
            return None
        out = {"id": e["id"], "category": e["category"], "image": e.get("image"),
               "translations": e["translations"], "references": e.get("references", [])}
        if category == "location":
            out["map_position"] = e.get("map_position")
        return out

    def pick_question(self, category, entity_id, rank, seen):
        q = self.questions
        def f(pred):
            return [x for x in q if pred(x) and x["id"] not in seen]
        tiers = []
        if category == "general" or entity_id is None:
            tiers = [f(lambda x: x["category"] == "general" and x["rank"] == rank),
                     f(lambda x: x["category"] == "general"),
                     f(lambda x: x["rank"] == rank),
                     f(lambda x: True)]
        else:
            tiers = [f(lambda x: x["related_entity_id"] == entity_id and x["category"] == category and x["rank"] == rank),
                     f(lambda x: x["related_entity_id"] == entity_id and x["category"] == category),
                     f(lambda x: x["category"] == category and x["rank"] == rank),
                     f(lambda x: x["category"] == category),
                     f(lambda x: x["rank"] == rank),
                     f(lambda x: True)]
        for t in tiers:
            if t:
                return random.choice(t)
        # everything seen -> allow repeats
        pool = [x for x in q if x["related_entity_id"] == entity_id] or q
        return random.choice(pool)


# --------------------------------------------------------------------------
# Rooms (in memory)
# --------------------------------------------------------------------------
ROOMS = {}


def gen_code():
    while True:
        code = "".join(random.choices(string.digits, k=4))
        if code not in ROOMS:
            return code


def new_private():
    return {
        "discovered": {c: False for c in CATEGORIES},
        "recovered_ids": {c: None for c in CATEGORIES},
        "discarded": {c: [] for c in CATEGORIES},
        "clues": [],           # list of {category, es, en}
        "clue_keys": [],       # dedupe keys
        "seen_questions": [],
        "can_win": False,
    }


def create_room(host_language="bilingual", show_translation=True):
    code = gen_code()
    room = {
        "code": code,
        "status": "lobby",              # lobby / playing / finished
        "host_language": host_language, # es / en / bilingual
        "show_translation": show_translation,
        "sound": True,
        "paused": False,
        "players": {},                  # id -> player
        "order": [],                    # player ids in turn order
        "turn_index": 0,
        "phase": "lobby",
        "current": {},                  # action data for current turn
        "secret": {},                   # SERVER ONLY
        "pools": {},                    # category -> [entity ids]
        "private": {},                  # player id -> private state
        "winner_id": None,
    }
    ROOMS[code] = room
    return room


def add_player(room, name, language="es", rank="explorer"):
    pid = "p_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    room["players"][pid] = {
        "id": pid, "name": name, "language": language, "rank": rank,
        "connected": True, "ready": True,
    }
    room["private"][pid] = new_private()
    if room["status"] == "playing" and pid not in room["order"]:
        room["order"].append(pid)
    return pid


def current_player_id(room):
    if not room["order"]:
        return None
    return room["order"][room["turn_index"] % len(room["order"])]


# --------------------------------------------------------------------------
# Game lifecycle
# --------------------------------------------------------------------------
def start_game(room, content):
    ids = list(room["players"].keys())
    random.shuffle(ids)
    room["order"] = ids
    room["turn_index"] = 0
    room["status"] = "playing"
    room["winner_id"] = None
    for pid in ids:
        room["private"][pid] = new_private()
    # build pools (8-10 per category) + secrets
    room["pools"] = {}
    room["secret"] = {}
    for c in CATEGORIES:
        pool = content.by_cat[c][:]
        random.shuffle(pool)
        n = min(len(pool), random.randint(8, 10))
        pool = pool[:n]
        room["pools"][c] = [e["id"] for e in pool]
        room["secret"][c] = random.choice(pool)["id"]
    room["phase"] = "roll"
    room["current"] = {}


def new_game(room, content):
    start_game(room, content)


def roll_dice(room, content, pid):
    if room["phase"] != "roll" or pid != current_player_id(room):
        return
    value = random.randint(1, 6)
    room["current"] = {"dice_value": value}
    room["phase"] = "dice"


def _start_question(room, content, category, entity_id, purpose):
    player = room["players"][current_player_id(room)]
    priv = room["private"][player["id"]]
    q = content.pick_question(category, entity_id, player["rank"], priv["seen_questions"])
    priv["seen_questions"].append(q["id"])
    room["current"].update({
        "phase_purpose": purpose,          # 'clue' or 'verify'
        "category": category,
        "candidate_id": entity_id,
        "question": {"id": q["id"], "category": q["category"],
                     "translations": q["translations"]},
        "correct_answer": q["correct_answer"],
        "bible_reference": q["bible_reference"],
    })
    room["phase"] = "question"


def continue_turn(room, content, pid):
    """Advance transient phases driven by the active player pressing Continue."""
    if pid != current_player_id(room):
        return
    phase = room["phase"]
    if phase == "dice":
        v = room["current"]["dice_value"]
        if v == 1:
            _start_question(room, content, "general", None, "clue")
        elif v == 2:
            room["current"]["category"] = "character"
            room["phase"] = "choose_candidate"
        elif v == 3:
            room["phase"] = "choose_category"
        elif v == 4:
            room["phase"] = "choose_location"
        elif v == 5:
            room["current"]["setback"] = random.choice(
                ["sandstorm", "caravan", "lostmap", "blocked", "scroll"])
            room["phase"] = "setback"
        elif v == 6:
            room["current"]["category"] = "event"
            room["phase"] = "choose_candidate"
    elif phase == "travel":
        _start_question(room, content, "location", room["current"]["candidate_id"], "verify")
    elif phase in ("feedback", "setback"):
        _advance_player(room)


def choose_category(room, content, pid, category):
    if room["phase"] != "choose_category" or pid != current_player_id(room):
        return
    if category == "location":
        room["current"]["category"] = "location"
        room["phase"] = "choose_location"
    elif category in ("character", "event"):
        room["current"]["category"] = category
        room["phase"] = "choose_candidate"


def choose_candidate(room, content, pid, candidate_id):
    if room["phase"] != "choose_candidate" or pid != current_player_id(room):
        return
    category = room["current"]["category"]
    _start_question(room, content, category, candidate_id, "verify")


def choose_location(room, content, pid, location_id):
    if room["phase"] != "choose_location" or pid != current_player_id(room):
        return
    room["current"]["category"] = "location"
    room["current"]["candidate_id"] = location_id
    room["phase"] = "travel"


def submit_answer(room, content, pid, answer):
    if room["phase"] != "question" or pid != current_player_id(room):
        return
    cur = room["current"]
    correct = (answer == cur["correct_answer"])
    cur["answer_given"] = answer
    cur["was_correct"] = correct
    priv = room["private"][pid]
    result = {"type": None}
    if correct:
        if cur["phase_purpose"] == "clue":
            clue = _grant_clue(room, content, priv)
            result = {"type": "clue", "clue": clue, "granted": clue is not None}
        else:  # verify
            category = cur["category"]
            eid = cur["candidate_id"]
            is_secret = (room["secret"].get(category) == eid)
            if is_secret:
                priv["discovered"][category] = True
                priv["recovered_ids"][category] = eid
                result = {"type": "verify", "recovered": True, "category": category, "entity_id": eid}
                if all(priv["discovered"].values()):
                    priv["can_win"] = True
            else:
                if eid not in priv["discarded"][category]:
                    priv["discarded"][category].append(eid)
                result = {"type": "verify", "recovered": False, "category": category, "entity_id": eid}
    cur["private_result"] = result
    room["phase"] = "feedback"


def _grant_clue(room, content, priv):
    cats = CATEGORIES[:]
    random.shuffle(cats)
    for c in cats:
        eid = room["secret"][c]
        e = content.entity(c, eid)
        if not e:
            continue
        clues_es = e.get("clues", {}).get("es", [])
        clues_en = e.get("clues", {}).get("en", [])
        idxs = list(range(len(clues_es)))
        random.shuffle(idxs)
        for i in idxs:
            key = f"{c}:{eid}:{i}"
            if key not in priv["clue_keys"]:
                priv["clue_keys"].append(key)
                clue = {"category": c, "es": clues_es[i],
                        "en": clues_en[i] if i < len(clues_en) else clues_es[i]}
                priv["clues"].append(clue)
                return clue
    return None


def _advance_player(room):
    if not room["order"]:
        return
    room["turn_index"] = (room["turn_index"] + 1) % len(room["order"])
    room["phase"] = "roll"
    room["current"] = {}


def claim_win(room, content, pid):
    priv = room["private"].get(pid)
    if not priv or not priv["can_win"]:
        return
    room["status"] = "finished"
    room["winner_id"] = pid
    room["phase"] = "winner"


# --------------------------------------------------------------------------
# Host controls
# --------------------------------------------------------------------------
def skip_player(room):
    if room["status"] == "playing":
        _advance_player(room)


def remove_player(room, pid):
    room["players"].pop(pid, None)
    room["private"].pop(pid, None)
    if pid in room["order"]:
        idx = room["order"].index(pid)
        room["order"].remove(pid)
        if idx < room["turn_index"]:
            room["turn_index"] -= 1
        if room["order"]:
            room["turn_index"] %= len(room["order"])


def set_pause(room, paused):
    room["paused"] = paused


def set_sound(room, on):
    room["sound"] = on


# --------------------------------------------------------------------------
# Serialization
# --------------------------------------------------------------------------
def public_current(room, content):
    """Public view of the current action (no correct answer, no secret)."""
    cur = room.get("current", {})
    phase = room["phase"]
    out = {}
    if "dice_value" in cur:
        out["dice_value"] = cur["dice_value"]
    if "setback" in cur:
        out["setback"] = cur["setback"]
    if cur.get("category"):
        out["category"] = cur["category"]
    if cur.get("candidate_id") and cur["category"] in CATEGORIES:
        out["candidate"] = content.public_entity(cur["category"], cur["candidate_id"])
    if "question" in cur and phase in ("question", "feedback"):
        out["question"] = cur["question"]
    if phase == "feedback":
        out["was_correct"] = cur.get("was_correct")
        out["correct_answer"] = cur.get("correct_answer")
        out["bible_reference"] = cur.get("bible_reference")
        out["phase_purpose"] = cur.get("phase_purpose")
        # only public-safe part of the private result
        pr = cur.get("private_result", {})
        out["result_type"] = pr.get("type")
    return out


def public_state(room, content):
    players = []
    for pid in (room["order"] if room["order"] else list(room["players"].keys())):
        p = room["players"].get(pid)
        if not p:
            continue
        players.append({"id": p["id"], "name": p["name"], "rank": p["rank"],
                        "language": p["language"], "connected": p["connected"]})
    cpid = current_player_id(room) if room["status"] == "playing" else None
    cur_player = room["players"].get(cpid) if cpid else None
    state = {
        "code": room["code"],
        "status": room["status"],
        "host_language": room["host_language"],
        "show_translation": room["show_translation"],
        "sound": room["sound"],
        "paused": room["paused"],
        "phase": room["phase"],
        "players": players,
        "current_player": ({"id": cur_player["id"], "name": cur_player["name"],
                            "rank": cur_player["rank"], "language": cur_player["language"]}
                           if cur_player else None),
        "current": public_current(room, content) if room["status"] == "playing" else {},
        "pools": ({c: [content.public_entity(c, eid) for eid in room["pools"].get(c, [])]
                   for c in CATEGORIES} if room["status"] != "lobby" else {}),
    }
    if room["status"] == "finished" and room["winner_id"]:
        w = room["players"].get(room["winner_id"])
        state["winner"] = {"id": room["winner_id"], "name": w["name"] if w else "?"}
        state["reveal"] = {c: content.public_entity(c, room["secret"][c]) for c in CATEGORIES}
    return state


def private_state(room, pid):
    priv = room["private"].get(pid)
    if not priv:
        return None
    return {
        "player_id": pid,
        "discovered": priv["discovered"],
        "recovered_ids": priv["recovered_ids"],
        "discarded": priv["discarded"],
        "clues": priv["clues"],
        "can_win": priv["can_win"],
        "is_current": current_player_id(room) == pid,
        # private result for the active player only (contains verify outcome / clue)
        "last_result": (room["current"].get("private_result")
                        if current_player_id(room) == pid and room["phase"] == "feedback" else None),
    }
