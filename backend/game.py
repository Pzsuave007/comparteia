"""In-memory board-game engine for ARCHIVO BÍBLICO PERDIDO.

Shared map: players move a pawn with the die. Tiles trigger investigations
(character/location/event), traps (answer to pass or move back), clues, or rest.
Recovering the 3 secret pieces opens the secret path to the Temple; first pawn
to reach the Temple wins. Server is authoritative; secrets stay private.
"""
import random
import string
import time

CATEGORIES = ["character", "location", "event"]
QUESTION_SECONDS = 30

EXPLORE_END = 40     # legacy default (per-room value stored in room["explore_end"])
SECRET_LEN = 5       # hidden tiles on the secret path before the Temple
BACK_STEPS = 3       # trap penalty
STEAL_WINDOW = 5     # seconds before deadline when stealing opens
STEAL_REWARD = 3     # honor gained on a successful steal
STEAL_PENALTY = 1    # honor lost on a failed steal
DUEL_REWARD = 3      # honor for the duel winner
STOP_TYPES = {"character", "location", "event", "clue"}  # tiles worth stopping at


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
        pool = [x for x in q if x["related_entity_id"] == entity_id] or q
        return random.choice(pool)


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
        "clues": [],
        "clue_keys": [],
        "seen_questions": [],
        "can_win": False,
    }


def create_room(host_language="bilingual", show_translation=True):
    code = gen_code()
    room = {
        "code": code, "status": "lobby",
        "host_language": host_language, "show_translation": show_translation,
        "sound": True, "paused": False,
        "players": {}, "order": [], "turn_index": 0,
        "phase": "lobby", "current": {}, "secret": {}, "pools": {},
        "private": {}, "winner_id": None, "board": [],
        "explore_end": 0, "temple_index": 0,
    }
    ROOMS[code] = room
    return room


def add_player(room, name, language="es", rank="explorer"):
    pid = "p_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    room["players"][pid] = {
        "id": pid, "name": name, "language": language, "rank": rank,
        "connected": True, "ready": True, "honor": 0, "streak": 0, "pos": 0,
    }
    room["private"][pid] = new_private()
    if room["status"] == "playing" and pid not in room["order"]:
        room["order"].append(pid)
    return pid


def current_player_id(room):
    if not room["order"]:
        return None
    return room["order"][room["turn_index"] % len(room["order"])]


def _gen_board():
    """Winding loop packed with step tiles; situations spaced 4-6 tiles apart (~130 tiles)."""
    specials = (["character"] * 4 + ["location"] * 4 + ["event"] * 4
                + ["trap"] * 3 + ["clue"] * 3 + ["surprise"] * 4)  # 22 spaced situations
    random.shuffle(specials)
    tiles = []
    for s in specials:
        tiles.append(s)
        for _ in range(random.randint(4, 6)):
            tiles.append("path")
    explore_end = len(tiles)                                    # loop tiles = board 1..explore_end
    board = [{"type": "start"}] + [{"type": t} for t in tiles]  # index 0 = start
    board += [{"type": "path"} for _ in range(SECRET_LEN)]      # hidden secret path
    board.append({"type": "temple"})
    temple_index = len(board) - 1
    return board, explore_end, temple_index


def has_three(room, pid):
    return all(room["private"][pid]["discovered"].values())


def _move(pos, steps, has3, explore_end, temple):
    if has3:
        return min(pos + steps, temple)
    return ((pos - 1 + steps) % explore_end) + 1


def _traversal(pos, steps, has3, explore_end, temple):
    """Ordered list of tile indices stepped over (1..steps)."""
    return [_move(pos, k, has3, explore_end, temple) for k in range(1, steps + 1)]


# --------------------------------------------------------------------------
# Lifecycle
# --------------------------------------------------------------------------
def start_game(room, content):
    ids = list(room["players"].keys())
    random.shuffle(ids)
    room["order"] = ids
    room["turn_index"] = 0
    room["status"] = "playing"
    room["winner_id"] = None
    board, explore_end, temple_index = _gen_board()
    room["board"] = board
    room["explore_end"] = explore_end
    room["temple_index"] = temple_index
    for pid in ids:
        room["private"][pid] = new_private()
        room["players"][pid]["honor"] = 0
        room["players"][pid]["streak"] = 0
        room["players"][pid]["pos"] = 0
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
    d1 = random.randint(1, 6)
    d2 = random.randint(1, 6)
    value = d1 + d2
    p = room["players"][pid]
    frm = p["pos"]
    has3 = has_three(room, pid)
    seq = _traversal(frm, value, has3, room["explore_end"], room["temple_index"])
    final = seq[-1]
    options = []
    for i, idx in enumerate(seq):
        t = room["board"][idx]["type"]
        is_final = (i + 1 == value)
        if t in STOP_TYPES or is_final:
            options.append({"index": idx, "step": i + 1, "type": t, "final": is_final})
    room["current"] = {"dice_value": value, "dice_values": [d1, d2], "from": frm, "final": final, "options": options}
    # a real choice exists only if some situation can be reached before the final tile
    non_final_sit = [o for o in options if not o["final"] and o["type"] in STOP_TYPES]
    if non_final_sit:
        room["phase"] = "choose_stop"
    else:
        room["current"]["to"] = final
        room["current"]["tile"] = room["board"][final]["type"]
        room["phase"] = "moving"


def choose_stop(room, content, pid, step):
    if room["phase"] != "choose_stop" or pid != current_player_id(room):
        return
    opts = room["current"].get("options", [])
    chosen = next((o for o in opts if o["step"] == step), None)
    if not chosen:
        chosen = next((o for o in opts if o["final"]), opts[-1] if opts else None)
    if not chosen:
        return
    room["current"]["to"] = chosen["index"]
    room["current"]["tile"] = room["board"][chosen["index"]]["type"]
    room["phase"] = "moving"


def _start_question(room, content, category, entity_id, purpose):
    player = room["players"][current_player_id(room)]
    priv = room["private"][player["id"]]
    q = content.pick_question(category, entity_id, player["rank"], priv["seen_questions"])
    priv["seen_questions"].append(q["id"])
    room["current"].update({
        "phase_purpose": purpose, "category": category, "candidate_id": entity_id,
        "question": {"id": q["id"], "category": q["category"], "translations": q["translations"]},
        "correct_answer": q["correct_answer"], "bible_reference": q["bible_reference"],
        "predictions": {}, "help_requested": False, "votes": {},
        "steal_attempts": {}, "stolen_by": None, "steal_failed": [],
        "deadline": time.time() + QUESTION_SECONDS,
    })
    room["phase"] = "question"


def continue_turn(room, content, pid):
    if pid != current_player_id(room):
        return
    phase = room["phase"]
    p = room["players"][pid]
    if phase == "moving":
        to = room["current"]["to"]
        p["pos"] = to
        tile = room["board"][to]["type"]
        if tile == "temple":
            room["status"] = "finished"
            room["winner_id"] = pid
            room["phase"] = "winner"
        elif tile in CATEGORIES:
            room["current"]["category"] = tile
            room["phase"] = "choose_candidate"
        elif tile == "trap":
            _start_question(room, content, "general", None, "trap")
        elif tile == "clue":
            clue = _grant_clue(room, content, room["private"][pid])
            room["current"]["private_result"] = {"type": "clue", "clue": clue, "granted": clue is not None}
            room["phase"] = "clue_tile"
        elif tile == "surprise":
            res = _resolve_surprise(room, p)
            room["current"]["surprise"] = res
            room["phase"] = "surprise_tile"
        else:  # rest / path / start  -> try a 1v1 duel, else rest
            if not _start_duel(room, content, pid):
                room["phase"] = "rest_tile"
    elif phase in ("feedback", "clue_tile", "rest_tile", "surprise_tile", "duel_result"):
        _advance_player(room)
    elif phase == "duel":
        _resolve_duel(room)


def _start_duel(room, content, pid):
    order = room["order"]
    connected = [q for q in order if room["players"].get(q, {}).get("connected", True)]
    if len(connected) < 3:
        return False  # need challenger + opponent + at least one voter
    others = [q for q in connected if q != pid]
    opp = random.choice(others)
    challenger = room["players"][pid]
    opponent = room["players"][opp]
    priv = room["private"][pid]
    q = content.pick_question("general", None, challenger["rank"], priv["seen_questions"])
    priv["seen_questions"].append(q["id"])
    room["current"] = {
        "phase_purpose": "duel",
        "challenger": pid, "challenger_name": challenger["name"],
        "opponent": opp, "opponent_name": opponent["name"],
        "question": {"id": q["id"], "category": q["category"], "translations": q["translations"]},
        "correct_answer": q["correct_answer"], "bible_reference": q["bible_reference"],
        "duel_answers": {}, "duel_votes": {}, "deadline": time.time() + QUESTION_SECONDS,
    }
    room["phase"] = "duel"
    return True


def duel_answer(room, content, pid, answer):
    if room["phase"] != "duel":
        return
    cur = room["current"]
    if pid not in (cur.get("challenger"), cur.get("opponent")):
        return
    if answer in ("A", "B", "C", "D"):
        cur.setdefault("duel_answers", {})[pid] = answer


def duel_vote(room, content, pid, target):
    if room["phase"] != "duel":
        return
    cur = room["current"]
    if pid in (cur.get("challenger"), cur.get("opponent")):
        return
    if target not in (cur.get("challenger"), cur.get("opponent")):
        return
    cur.setdefault("duel_votes", {})[pid] = target
    eligible = [q for q in room["order"]
                if q not in (cur["challenger"], cur["opponent"])
                and room["players"].get(q, {}).get("connected", True)]
    if eligible and len(cur["duel_votes"]) >= len(eligible):
        _resolve_duel(room)


def _resolve_duel(room):
    cur = room["current"]
    ch, op = cur["challenger"], cur["opponent"]
    counts = {ch: 0, op: 0}
    for t in cur.get("duel_votes", {}).values():
        if t in counts:
            counts[t] += 1
    winner = ch if counts[ch] > counts[op] else (op if counts[op] > counts[ch] else None)
    if winner:
        room["players"][winner]["honor"] = room["players"][winner].get("honor", 0) + DUEL_REWARD
    cur["duel_winner"] = winner
    cur["duel_winner_name"] = room["players"][winner]["name"] if winner else None
    cur["duel_counts"] = {"challenger": counts[ch], "opponent": counts[op]}
    cur["duel_reward"] = DUEL_REWARD
    room["phase"] = "duel_result"


def choose_candidate(room, content, pid, candidate_id):
    if room["phase"] != "choose_candidate" or pid != current_player_id(room):
        return
    category = room["current"]["category"]
    _start_question(room, content, category, candidate_id, "verify")


def submit_answer(room, content, pid, answer):
    if room["phase"] != "question" or pid != current_player_id(room):
        return
    cur = room["current"]
    if cur.get("stolen_by"):
        return  # question already stolen by another player
    correct = (answer == cur["correct_answer"])
    cur["answer_given"] = answer
    cur["was_correct"] = correct
    p = room["players"][pid]
    priv = room["private"][pid]
    if correct:
        p["streak"] = p.get("streak", 0) + 1
        cur["streak"] = p["streak"]
        cur["honor_gain"] = p["streak"]
        p["honor"] = p.get("honor", 0) + p["streak"]
    else:
        p["streak"] = 0
        cur["streak"] = 0
        cur["honor_gain"] = 0
    result = {"type": None}
    purpose = cur["phase_purpose"]
    if purpose == "verify" and correct:
        category = cur["category"]
        eid = cur["candidate_id"]
        if room["secret"].get(category) == eid:
            priv["discovered"][category] = True
            priv["recovered_ids"][category] = eid
            result = {"type": "verify", "recovered": True, "category": category, "entity_id": eid}
            if all(priv["discovered"].values()):
                priv["can_win"] = True
        else:
            if eid not in priv["discarded"][category]:
                priv["discarded"][category].append(eid)
            result = {"type": "verify", "recovered": False, "category": category, "entity_id": eid}
    elif purpose == "trap":
        if correct:
            result = {"type": "trap", "passed": True}
        else:
            newpos = max(1, p["pos"] - BACK_STEPS)
            p["pos"] = newpos
            result = {"type": "trap", "passed": False, "back": BACK_STEPS, "new_pos": newpos}
    cur["private_result"] = result
    room["phase"] = "feedback"


def steal_answer(room, content, pid, answer):
    """Spectators race to steal a verify question in the final seconds (points only)."""
    if room["phase"] != "question":
        return
    cur = room["current"]
    if cur.get("phase_purpose") != "verify":
        return
    if pid == current_player_id(room) or cur.get("stolen_by") or "answer_given" in cur:
        return
    deadline = cur.get("deadline")
    if deadline and time.time() < deadline - STEAL_WINDOW:
        return  # steal window not open yet
    attempts = cur.setdefault("steal_attempts", {})
    if pid in attempts:
        return  # one attempt per player
    p = room["players"].get(pid)
    if not p:
        return
    attempts[pid] = answer
    if answer == cur["correct_answer"]:
        cur["stolen_by"] = pid
        p["honor"] = p.get("honor", 0) + STEAL_REWARD
        p["streak"] = 0
        curp = room["players"].get(current_player_id(room))
        if curp:
            curp["streak"] = 0
        cur["was_correct"] = False
        cur["answer_given"] = "STOLEN"
        cur["steal_reward"] = STEAL_REWARD
        cur["private_result"] = {"type": "stolen", "by": pid, "by_name": p["name"]}
        room["phase"] = "feedback"
    else:
        p["honor"] = max(0, p.get("honor", 0) - STEAL_PENALTY)
        cur.setdefault("steal_failed", []).append(pid)


def _resolve_surprise(room, p):
    has3 = has_three(room, p["id"])
    ee, ti = room["explore_end"], room["temple_index"]
    r = random.random()
    if r < 0.4:
        amt = random.randint(1, 2)
        p["pos"] = _move(p["pos"], amt, has3, ee, ti)
        return {"kind": "forward", "amount": amt}
    elif r < 0.7:
        amt = random.randint(1, 2)
        p["pos"] = max(1, p["pos"] - amt)
        return {"kind": "back", "amount": amt}
    else:
        p["honor"] = p.get("honor", 0) + 2
        return {"kind": "honor", "amount": 2}


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
    n = len(room["order"])
    for _ in range(n):
        room["turn_index"] = (room["turn_index"] + 1) % n
        pid = room["order"][room["turn_index"]]
        if room["players"].get(pid, {}).get("connected", True):
            break
    room["phase"] = "roll"
    room["current"] = {}


def handle_disconnect(room, pid):
    """Keep the game moving when someone leaves so it never freezes."""
    if room.get("status") != "playing":
        return
    phase = room.get("phase")
    if phase == "duel":
        cur = room["current"]
        if pid in (cur.get("challenger"), cur.get("opponent")):
            _resolve_duel(room)          # a contender left -> resolve now
            return
        eligible = [q for q in room["order"]
                    if q not in (cur.get("challenger"), cur.get("opponent"))
                    and room["players"].get(q, {}).get("connected", True)]
        if not eligible:                 # no voters left -> resolve
            _resolve_duel(room)
        return
    if current_player_id(room) == pid and not room["players"].get(pid, {}).get("connected", True):
        _advance_player(room)


def pass_turn(room, content, pid):
    if pid != current_player_id(room):
        return
    if room["phase"] in ("moving", "choose_candidate", "clue_tile", "rest_tile", "surprise_tile", "choose_stop"):
        _advance_player(room)


def predict(room, content, pid, value):
    if room["phase"] != "question" or pid == current_player_id(room):
        return
    if value in ("yes", "no"):
        room["current"].setdefault("predictions", {})[pid] = value


def request_help(room, content, pid):
    if room["phase"] == "question" and pid == current_player_id(room):
        room["current"]["help_requested"] = True


def vote_help(room, content, pid, letter):
    if room["phase"] != "question" or pid == current_player_id(room):
        return
    if not room["current"].get("help_requested"):
        return
    if letter in ("A", "B", "C", "D"):
        room["current"].setdefault("votes", {})[pid] = letter


def claim_win(room, content, pid):
    return  # winning now happens by reaching the Temple on the board


# --------------------------------------------------------------------------
# Host controls
# --------------------------------------------------------------------------
def skip_player(room):
    if room["status"] == "playing":
        _advance_player(room)


def remove_player(room, pid):
    was_current = (room.get("status") == "playing" and current_player_id(room) == pid)
    room["players"].pop(pid, None)
    room["private"].pop(pid, None)
    if pid in room["order"]:
        idx = room["order"].index(pid)
        room["order"].remove(pid)
        if idx < room["turn_index"]:
            room["turn_index"] -= 1
        if room["order"]:
            room["turn_index"] %= len(room["order"])
    if was_current and room["order"]:
        # the removed player was mid-turn -> reset to a clean roll for the next one
        room["turn_index"] %= len(room["order"])
        room["phase"] = "roll"
        room["current"] = {}


def set_pause(room, paused):
    room["paused"] = paused


def set_sound(room, on):
    room["sound"] = on


# --------------------------------------------------------------------------
# Serialization
# --------------------------------------------------------------------------
def _tally_votes(votes):
    t = {"A": 0, "B": 0, "C": 0, "D": 0}
    for v in votes.values():
        if v in t:
            t[v] += 1
    return t


def public_current(room, content):
    cur = room.get("current", {})
    phase = room["phase"]
    out = {}
    if "dice_value" in cur:
        out["dice_value"] = cur["dice_value"]
    if "dice_values" in cur:
        out["dice_values"] = cur["dice_values"]
    for k in ("from", "to", "tile"):
        if k in cur:
            out[k] = cur[k]
    if cur.get("category"):
        out["category"] = cur["category"]
    if cur.get("candidate_id") and cur.get("category") in CATEGORIES:
        out["candidate"] = content.public_entity(cur["category"], cur["candidate_id"])
    if "question" in cur and phase in ("question", "feedback"):
        out["question"] = cur["question"]
    if phase in ("duel", "duel_result"):
        for k in ("challenger", "challenger_name", "opponent", "opponent_name"):
            out[k] = cur.get(k)
        out["question"] = cur.get("question")
        out["duel_answers"] = cur.get("duel_answers", {})
        out["duel_votes_count"] = len(cur.get("duel_votes", {}))
        if cur.get("deadline"):
            out["time_left"] = max(0, round(cur["deadline"] - time.time()))
        if phase == "duel_result":
            out["duel_winner"] = cur.get("duel_winner")
            out["duel_winner_name"] = cur.get("duel_winner_name")
            out["duel_counts"] = cur.get("duel_counts")
            out["duel_reward"] = cur.get("duel_reward", DUEL_REWARD)
            out["correct_answer"] = cur.get("correct_answer")
            out["bible_reference"] = cur.get("bible_reference")
    if phase == "question":
        if cur.get("deadline"):
            out["time_left"] = max(0, round(cur["deadline"] - time.time()))
        out["help_requested"] = cur.get("help_requested", False)
        out["votes"] = _tally_votes(cur.get("votes", {}))
        out["steal_eligible"] = cur.get("phase_purpose") == "verify"
        out["steal_attempted"] = list(cur.get("steal_attempts", {}).keys())
        out["steal_failed"] = cur.get("steal_failed", [])
    if phase == "feedback":
        out["was_correct"] = cur.get("was_correct")
        out["correct_answer"] = cur.get("correct_answer")
        out["bible_reference"] = cur.get("bible_reference")
        out["phase_purpose"] = cur.get("phase_purpose")
        pr = cur.get("private_result", {})
        out["result_type"] = pr.get("type")
        if pr.get("type") == "trap":
            out["trap_passed"] = pr.get("passed")
            out["trap_back"] = pr.get("back")
        if pr.get("type") == "stolen":
            out["stolen_by_name"] = pr.get("by_name")
            out["steal_reward"] = cur.get("steal_reward", STEAL_REWARD)
        out["streak"] = cur.get("streak", 0)
        out["honor_gain"] = cur.get("honor_gain", 0)
        preds = cur.get("predictions", {})
        out["predictions"] = {"yes": sum(1 for v in preds.values() if v == "yes"),
                              "no": sum(1 for v in preds.values() if v == "no")}
        out["votes"] = _tally_votes(cur.get("votes", {}))
        out["help_requested"] = cur.get("help_requested", False)
    if phase in ("clue_tile",):
        out["result_type"] = "clue"
    if phase == "choose_stop":
        out["options"] = cur.get("options", [])
        out["final"] = cur.get("final")
    if phase == "surprise_tile":
        out["surprise"] = cur.get("surprise")
    return out


def public_state(room, content):
    players = []
    for pid in (room["order"] if room["order"] else list(room["players"].keys())):
        p = room["players"].get(pid)
        if not p:
            continue
        players.append({"id": p["id"], "name": p["name"], "rank": p["rank"],
                        "language": p["language"], "connected": p["connected"],
                        "honor": p.get("honor", 0), "pos": p.get("pos", 0)})
    cpid = current_player_id(room) if room["status"] == "playing" else None
    cur_player = room["players"].get(cpid) if cpid else None
    max_progress = 0
    if room["status"] == "playing":
        for pv in room["private"].values():
            max_progress = max(max_progress, sum(1 for v in pv["discovered"].values() if v))
    state = {
        "code": room["code"], "status": room["status"],
        "host_language": room["host_language"], "show_translation": room["show_translation"],
        "sound": room["sound"], "paused": room["paused"], "phase": room["phase"],
        "players": players, "max_progress": max_progress,
        "secret_open": max_progress >= 3,
        "board": [t["type"] for t in room["board"]],
        "temple_index": room.get("temple_index", 0), "explore_end": room.get("explore_end", 0),
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
        "last_result": (room["current"].get("private_result")
                        if current_player_id(room) == pid and room["phase"] in ("feedback", "clue_tile") else None),
    }
