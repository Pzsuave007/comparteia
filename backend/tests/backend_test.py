"""E2E backend tests for ARCHIVO BIBLICO PERDIDO over the real public URL.

Covers:
  * REST room lifecycle (create / join / get)
  * BUG FIX: current-player disconnect must auto-advance the turn (no freeze)
  * BUG FIX: player leaves + new player joins mid-game -> game keeps going
  * FEATURE: 1v1 duel on empty tile with >=3 connected players (answers, votes,
    duel_result, +3 honor, continue -> next turn)
  * FEATURE: with only 2 connected players an empty tile must yield 'rest_tile'
"""
import asyncio
import json
import os

import pytest
import requests
import websockets
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base.rstrip("/")
WS_BASE = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")

EMPTY_TILES = {"path", "start", "rest"}


# ------------------------------------------------------------------ helpers
def create_room():
    r = requests.post(f"{BASE_URL}/api/rooms", json={"host_language": "bilingual", "show_translation": True}, timeout=30)
    assert r.status_code == 200, r.text
    code = r.json()["code"]
    assert isinstance(code, str) and len(code) == 4
    return code


def join(code, name):
    r = requests.post(f"{BASE_URL}/api/rooms/join",
                      json={"code": code, "name": name, "language": "es", "rank": "explorer"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["code"] == code
    assert isinstance(data["player_id"], str) and data["player_id"].startswith("p_")
    return data["player_id"]


def state(code):
    r = requests.get(f"{BASE_URL}/api/rooms/{code}", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


class Sock:
    """WS wrapper that drains incoming broadcasts in the background."""

    def __init__(self, ws):
        self.ws = ws
        self.states = []
        self._task = asyncio.create_task(self._drain())

    async def _drain(self):
        try:
            async for raw in self.ws:
                msg = json.loads(raw)
                if msg.get("type") == "state":
                    self.states.append(msg["state"])
        except Exception:
            pass

    async def send(self, payload):
        await self.ws.send(json.dumps(payload))
        await asyncio.sleep(0.35)

    async def close(self):
        await self.ws.close()
        self._task.cancel()
        await asyncio.sleep(0.6)


async def open_host(code):
    ws = await websockets.connect(f"{WS_BASE}/api/ws/{code}?role=host", open_timeout=30)
    return Sock(ws)


async def open_player(code, pid):
    ws = await websockets.connect(f"{WS_BASE}/api/ws/{code}?role=player&pid={pid}", open_timeout=30)
    return Sock(ws)


async def setup_game(n_players):
    code = create_room()
    pids = [join(code, f"TEST_P{i+1}") for i in range(n_players)]
    host = await open_host(code)
    socks = {}
    for pid in pids:
        socks[pid] = await open_player(code, pid)
    await host.send({"action": "start"})
    st = state(code)
    assert st["status"] == "playing", st
    assert st["phase"] == "roll"
    return code, pids, host, socks


async def step_towards_empty_tile(code, socks, max_turns=60):
    """Drive the game turn by turn until an empty tile is landed on.

    Returns the state whose phase is 'duel' or 'rest_tile'.
    """
    for _ in range(max_turns):
        st = state(code)
        phase = st["phase"]
        if phase in ("duel", "rest_tile"):
            return st
        cpid = (st.get("current_player") or {}).get("id")
        if cpid is None or cpid not in socks:
            return st
        s = socks[cpid]
        if phase == "roll":
            await s.send({"action": "roll"})
        elif phase == "choose_stop":
            opts = st["current"].get("options", [])
            final = next((o for o in opts if o.get("final")), None)
            await s.send({"action": "choose_stop", "step": final["step"] if final else 1})
        elif phase == "moving":
            await s.send({"action": "continue"})
        elif phase in ("feedback", "clue_tile", "surprise_tile", "duel_result"):
            await s.send({"action": "continue"})
        elif phase == "choose_candidate":
            cat = st["current"].get("category")
            pool = st.get("pools", {}).get(cat) or []
            if pool:
                await s.send({"action": "choose_candidate", "candidate_id": pool[0]["id"]})
            else:
                await s.send({"action": "pass"})
        elif phase == "question":
            await s.send({"action": "answer", "answer": "A"})
        elif phase == "winner":
            return st
        else:
            await asyncio.sleep(0.4)
    return state(code)


async def cleanup(host, socks):
    for s in list(socks.values()):
        try:
            await s.close()
        except Exception:
            pass
    try:
        await host.close()
    except Exception:
        pass


# ------------------------------------------------------------------ tests
class TestRestLifecycle:
    """REST endpoints: create / join / get / update / 404s"""

    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200
        assert "message" in r.json()

    def test_create_join_get_and_persist(self):
        code = create_room()
        st = state(code)
        assert st["status"] == "lobby"
        assert st["players"] == []
        pid = join(code, "TEST_Ana")
        st = state(code)
        assert len(st["players"]) == 1
        assert st["players"][0]["name"] == "TEST_Ana"
        assert st["players"][0]["connected"] is True
        assert st["players"][0]["honor"] == 0
        # update player persists
        r = requests.post(f"{BASE_URL}/api/rooms/{code}/player/{pid}", json={"name": "TEST_Ana2", "rank": "master"}, timeout=30)
        assert r.status_code == 200
        st = state(code)
        assert st["players"][0]["name"] == "TEST_Ana2"
        assert st["players"][0]["rank"] == "master"

    def test_unknown_room_404(self):
        assert requests.get(f"{BASE_URL}/api/rooms/0000ZZ", timeout=30).status_code == 404
        r = requests.post(f"{BASE_URL}/api/rooms/join", json={"code": "9999999", "name": "x"}, timeout=30)
        assert r.status_code == 404

    def test_join_validation(self):
        r = requests.post(f"{BASE_URL}/api/rooms/join", json={"code": create_room()}, timeout=30)
        assert r.status_code == 422


class TestDisconnectDoesNotFreeze:
    """BUG FIX: current player disconnecting must auto-advance the turn."""

    def test_current_player_disconnect_advances_turn(self):
        async def run():
            code, pids, host, socks = await setup_game(3)
            try:
                st = state(code)
                cpid = st["current_player"]["id"]
                assert st["phase"] == "roll"
                # current player leaves
                await socks[cpid].close()
                socks.pop(cpid)
                await asyncio.sleep(1.0)
                st2 = state(code)
                new_cpid = st2["current_player"]["id"]
                assert new_cpid != cpid, f"turn stayed with disconnected player {cpid}"
                assert st2["phase"] == "roll"
                gone = next(p for p in st2["players"] if p["id"] == cpid)
                assert gone["connected"] is False
                # remaining players can keep playing
                await socks[new_cpid].send({"action": "roll"})
                st3 = state(code)
                assert st3["phase"] in ("choose_stop", "moving"), st3["phase"]
                assert st3["current"].get("dice_value") in range(1, 7)
                return True
            finally:
                await cleanup(host, socks)

        assert asyncio.run(run())

    def test_disconnect_midturn_and_new_player_join(self):
        async def run():
            code, pids, host, socks = await setup_game(3)
            try:
                # advance the current player into a non-roll phase then drop them
                st = state(code)
                cpid = st["current_player"]["id"]
                await socks[cpid].send({"action": "roll"})
                await socks[cpid].close()
                socks.pop(cpid)
                await asyncio.sleep(1.0)
                st2 = state(code)
                assert st2["current_player"]["id"] != cpid
                assert st2["phase"] == "roll"
                # new player joins mid-game
                new_pid = join(code, "TEST_Late")
                socks[new_pid] = await open_player(code, new_pid)
                await asyncio.sleep(0.5)
                st3 = state(code)
                ids = [p["id"] for p in st3["players"]]
                assert new_pid in ids, "new mid-game player not in turn order"
                # game continues
                cur = st3["current_player"]["id"]
                if cur in socks:
                    await socks[cur].send({"action": "roll"})
                    assert state(code)["phase"] in ("choose_stop", "moving")
                return True
            finally:
                await cleanup(host, socks)

        assert asyncio.run(run())


class TestEdgeCases:
    """Related edge cases around leaving players / duel voters."""

    def test_host_remove_current_player_midquestion(self):
        """Host removing the current player must leave a playable state."""
        async def run():
            code, pids, host, socks = await setup_game(3)
            try:
                st = state(code)
                cpid = st["current_player"]["id"]
                await socks[cpid].send({"action": "roll"})
                await host.send({"action": "remove", "pid": cpid})
                await asyncio.sleep(0.6)
                st2 = state(code)
                ids = [p["id"] for p in st2["players"]]
                assert cpid not in ids
                new_cpid = st2["current_player"]["id"]
                return st2["phase"], new_cpid, socks, host, code
            finally:
                pass

        phase, new_cpid, socks, host, code = asyncio.run(run())
        # phase must be actionable for the new current player, not a stale one
        assert phase in ("roll",), f"stale phase '{phase}' after host removed the current player"

    def test_sole_duel_voter_disconnects(self):
        """If the only eligible voter leaves during a duel the game must not freeze."""
        async def run():
            code, pids, host, socks = await setup_game(3)
            try:
                st = await step_towards_empty_tile(code, socks)
                if st["phase"] != "duel":
                    pytest.skip(f"no duel reached (phase={st['phase']})")
                ch, op = st["current"]["challenger"], st["current"]["opponent"]
                voter = next(p for p in pids if p not in (ch, op))
                await socks[voter].close()
                socks.pop(voter)
                await asyncio.sleep(1.2)
                return state(code)["phase"]
            finally:
                await cleanup(host, socks)

        phase = asyncio.run(run())
        assert phase != "duel", "duel stuck after the only eligible voter disconnected"


class TestDuel:
    """FEATURE: 1v1 duel on empty tiles."""

    def test_duel_flow_three_players(self):
        async def run():
            code, pids, host, socks = await setup_game(3)
            try:
                st = await step_towards_empty_tile(code, socks)
                if st["phase"] != "duel":
                    pytest.fail(f"never reached a duel; last phase={st['phase']}")
                cur = st["current"]
                ch, op = cur["challenger"], cur["opponent"]
                assert ch != op
                assert ch in pids and op in pids
                assert cur["challenger_name"] and cur["opponent_name"]
                assert cur["question"] and cur["question"]["translations"]
                assert st["current_player"]["id"] == ch
                voters = [p for p in pids if p not in (ch, op)]
                assert len(voters) == 1
                honor_before = {p["id"]: p["honor"] for p in st["players"]}

                # both contenders answer
                await socks[ch].send({"action": "duel_answer", "answer": "A"})
                await socks[op].send({"action": "duel_answer", "answer": "B"})
                mid = state(code)
                assert mid["phase"] == "duel"
                assert set(mid["current"]["duel_answers"].keys()) == {ch, op}

                # a contender must not be able to vote
                await socks[ch].send({"action": "duel_vote", "target": op})
                assert state(code)["phase"] == "duel", "contender vote wrongly resolved duel"
                assert state(code)["current"]["duel_votes_count"] == 0

                # the single eligible voter votes -> duel resolves
                await socks[voters[0]].send({"action": "duel_vote", "target": op})
                await asyncio.sleep(0.5)
                res = state(code)
                assert res["phase"] == "duel_result", res["phase"]
                rc = res["current"]
                assert rc["duel_winner"] == op
                assert rc["duel_winner_name"] == rc["opponent_name"]
                assert rc["duel_counts"] == {"challenger": 0, "opponent": 1}
                assert rc["duel_reward"] == 3
                winner = next(p for p in res["players"] if p["id"] == op)
                assert winner["honor"] == honor_before[op] + 3, "duel winner did not get +3 honor"

                # challenger continues -> next turn
                await socks[ch].send({"action": "continue"})
                nxt = state(code)
                assert nxt["phase"] == "roll"
                assert nxt["current_player"]["id"] != ch
                return True
            finally:
                await cleanup(host, socks)

        assert asyncio.run(run())

    def test_no_duel_with_two_players(self):
        async def run():
            code, pids, host, socks = await setup_game(2)
            try:
                st = await step_towards_empty_tile(code, socks)
                assert st["phase"] != "duel", "duel started with only 2 connected players"
                if st["phase"] != "rest_tile":
                    pytest.fail(f"never landed on an empty tile; last phase={st['phase']}")
                assert st["current"].get("tile") in EMPTY_TILES
                # continue advances turn
                cpid = st["current_player"]["id"]
                await socks[cpid].send({"action": "continue"})
                nxt = state(code)
                assert nxt["phase"] == "roll"
                assert nxt["current_player"]["id"] != cpid
                return True
            finally:
                await cleanup(host, socks)

        assert asyncio.run(run())

    def test_challenger_can_force_resolve_duel(self):
        async def run():
            code, pids, host, socks = await setup_game(3)
            try:
                st = await step_towards_empty_tile(code, socks)
                if st["phase"] != "duel":
                    pytest.fail(f"never reached a duel; last phase={st['phase']}")
                ch = st["current"]["challenger"]
                await socks[ch].send({"action": "continue"})
                res = state(code)
                assert res["phase"] == "duel_result"
                # tie with no votes -> nobody wins
                assert res["current"]["duel_winner"] is None
                assert res["current"]["duel_winner_name"] is None
                return True
            finally:
                await cleanup(host, socks)

        assert asyncio.run(run())
