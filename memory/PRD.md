# PRD — ARCHIVO BÍBLICO PERDIDO (The Lost Bible Archive)

## Original Problem Statement
Polished, highly visual, real-time multiplayer Bible family INVESTIGATION game (not a trivia quiz).
Server secretly selects 3 missing pieces (1 Character, 1 Location, 1 Event). Players privately
investigate via Bible questions; first to recover all 3 wins. Party-game architecture: one TV/host
shared screen + phones as personal field notebooks. Turn-based dice mechanic, private clues/notebooks,
secret server-side verification, dramatic winner reveal. Bilingual (ES/EN) PER PLAYER; 3 ranks
(Explorador/Investigador/Arqueólogo). Indiana-Jones archaeological adventure aesthetic.

## Architecture
- **Backend**: FastAPI + WebSockets, in-memory rooms (server-authoritative secrets/private state),
  MongoDB for expandable localized content. Files: `server.py` (REST + WS + admin CRUD),
  `game.py` (Content store + state machine + serialization), `seed_data.py` (bilingual seed).
- **Frontend**: React + Tailwind. Routes: `/` Landing, `/host` cinematic TV, `/play` phone device,
  `/admin` content CRUD. `useRoom.js` (WS hook), `i18n.js` (centralized ES/EN keys), `sounds.js`
  (Web Audio synth SFX), `components/Dice.jsx` (3D die).

## User Personas
- Kids (11-13) → Explorador rank; Teens (14-17) → Investigador; Adults → Arqueólogo.
- Bilingual families (mixed ES/EN players in the same room).

## Core Requirements (static)
- Server-secret 3 pieces; private per-player notebooks; never leak secrets/other players' progress.
- Dice 1-6 (clue / character / choose / location+travel / setback / event) → question → verify/clue.
- Per-player language; TV follows active player's question language + optional bilingual translation.
- 3 ranks change only question difficulty, never rewards. Bluffing allowed (categories never removed).
- Expandable content model (admin CRUD), no repeated questions per player per game.

## Implemented (2026-06)
- ✅ Multiplayer rooms + WebSocket realtime sync (TV + phones), reconnection via stored session.
- ✅ Full join flow (code → name → language → rank → ready) with live UI language switch.
- ✅ Cinematic TV: lobby w/ room code, current-player banner, 3D dice, travel map animation,
  question presentation, correct/incorrect, "Verificando archivo", setbacks, sequential winner reveal + confetti.
- ✅ Phone device: roll die, category/candidate/location selection (illustrated cards w/ states),
  question answering, feedback + private result, private notebook (4 tabs), win button.
- ✅ Secret server-side verification; discarded/recovered card states; localized private clues.
- ✅ 3 ranks + rank-adapted question selection w/ fallback; bilingual content (ES/EN).
- ✅ Sound design (Web Audio synth) w/ host mute; host controls (sound/skip/restart).
- ✅ Admin panel CRUD for characters/locations/events/questions.
- ✅ Seed: 10 characters, 10 locations, 10 events (AI illustrations), 41 bilingual questions.
- ✅ Engine validated via deterministic tests (all dice branches, win, security/privacy, clues).

## Backlog / Remaining
- P1: Host controls for pause/resume UI surfacing, remove disconnected player button on TV.
- P1: More questions per entity/rank for richer variety (currently fallback covers gaps).
- P2: Persistent player profiles (cross-game seen-question memory) — MVP keeps per-game only.
- P2: Additional languages (PT/FR) via existing localization structure.
- P2: More entities/locations map coordinates fine-tuning.

## Next Tasks
- Run live multi-device UI test (host + 2 phones, one ES one EN) end-to-end.
- Expand question bank via admin as content grows.
