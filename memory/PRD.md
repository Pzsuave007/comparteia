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
- ✅ Live interactions (2026-06): emoji reactions floating on TV; "¡Yo sí lo sé!" predictions with TV reveal; "Consejo de exploradores" council voting (A/B/C/D) shown on TV + active phone; expedition sand-timer (30s, auto-timeout ends turn); honor scoreboard (correct answers) on winner screen.
- ✅ Board game mode (2026-06): dice now MOVES a pawn on a shared map (24 exploration tiles + secret path + Temple). Tile types: character/location/event (choose candidate → verify), trap (answer to pass; wrong = move back 3), clue (free private clue), rest. Recovering all 3 pieces opens the secret path (anonymous vault 3/3); first pawn to reach the Temple wins → race. TV shows the live board with pawns; ambient music, sparkles, streak multiplier and vault preserved.
- ✅ Seed: 10 characters, 10 locations, 10 events (AI illustrations), 41 bilingual questions.
- ✅ Adventure map redesign (2026-06): replaced the grid-of-squares board (`BigBoard`) with a
  full-screen illustrated parchment adventure map (`AdventureMap` in `Host.jsx`). Winding serpentine
  trail (SVG dashed route) around an oval circuit; themed waypoint pins (character/location/event/trap/clue);
  hidden Temple (golden token) at center, locked & greyed until 3 pieces found; secret branch path with
  "❔" mystery tiles that reveal when secret_open. Players are explorer-medallion pawns with per-player
  color + name; the pawn WALKS tile-by-tile along the trail (forward on dice, backward on trap) via a
  stepping animation (`walkPath`/`loopSeq`) with CSS transitions. Roll/moving/clue/rest phases now use a
  compact bottom-right HUD instead of a full-screen overlay so the walk stays visible.
  Assets: AI-generated map background, explorer coin token, temple token.
- ✅ Winding board + "choose where to stop" (2026-06): board is now a dense serpentine closed-loop
  trail (~130 tiles) that winds through the map INTERIOR with lobes (computeGeometry in Host.jsx,
  arc-length spaced dots) — mostly small step dots with spaced situation tiles (4 char/4 loc/4 event,
  3 trap, 3 clue, 4 surprise; 4-6 step tiles between situations; explore_end/temple_index are per-room
  dynamic). Start is bottom-center. When a roll makes the pawn pass over situation tiles, the player CHOOSES
  on the phone to stop at any passed situation (loses remaining steps) or advance the full roll
  (`choose_stop` phase; TV highlights the reachable option tiles in gold). Traps are AVOIDED if merely
  passed (only trigger when landed/stopped on). Surprise 🎁 tiles (on landing) give a random mini-event
  (advance/retreat 1-2 / +2 honor). Secret path tiles + trail to the Temple stay HIDDEN until a player
  recovers all 3 pieces, then appear (gold). Backend: `roll_dice` builds stop options, `choose_stop`,
  `_resolve_surprise`, `surprise_tile` phase (game.py). Validated via engine simulation + TV/phone screenshots.
- ✅ Secrecy hardening (2026-06): removed the distinct "recovered" TV sound (feedback audio is neutral,
  identical whether or not a piece was found) and the phone verify sound no longer differs by outcome.
  The TV vault counter ("ALGUIEN X/3") reveals with a randomized 6-13s delay decoupled from the current
  turn (shownProgress in HostScreen), so players can't infer who found a piece or when. Reaching 3/3
  still opens the secret path immediately (endgame race trigger).
- ✅ Steal mechanic + readability (2026-06): during the last 5s of a VERIFY question a steal window
  opens — any spectator can race to answer (`steal` action, game.py `steal_answer`); first CORRECT
  answer wins +3 honor and the current player LOSES the turn (no reward), a wrong steal costs the
  attempter -1 honor (one attempt each), and stealing gives POINTS ONLY (never the piece). TV shows a
  "¡ROBO ABIERTO!" banner + a "¡ROBO!" feedback with the thief; phones show a red steal panel
  (SpectatorQuestion), "te robaron" for the victim. Also darkened the TV question overlay to
  rgba(9,15,26,0.97) so questions/answers are fully legible over the map. Engine-tested.
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

## 2026-06 · Fix congelamiento + Reto 1v1
- FIX: si el jugador en turno se desconecta, `handle_disconnect`/`_advance_player` auto-saltan al
  siguiente conectado (antes se congelaba). Cubre también: contendiente/único-votante que se va en
  un duelo (se resuelve), y `remove_player` del jugador en turno (reinicia a 'roll').
- FEATURE Reto 1v1: al caer en casilla vacía con >=3 jugadores conectados, `_start_duel` enfrenta al
  jugador en turno con otro al azar; ambos responden (duel_answer) y el resto vota (duel_vote); el
  ganador +3 honor (DUEL_REWARD); fases 'duel'/'duel_result'. UI: DuelStage (TV), DuelView (teléfono).
- Verificado por testing_agent (iteration_1: 9/9 core) + pruebas de motor. Cosmético pendiente:
  el banner de la TV muestra "TURNO DE <retador>" durante duel_result (no bloqueante).

## 2026-06 · Ocultar respuesta en TV + dos dados + banco CSV + login admin
- FIX secrecy: en la TV (`Host.jsx` FeedbackStage) cuando la respuesta es INCORRECTA ya NO se muestra la
  respuesta correcta/explicación/cita — muestra "🔐 enviada en privado" (data-testid `tv-answer-hidden`).
  La pantalla de ROBO también la oculta (`tv-answer-hidden-stolen`). Si es CORRECTA la TV sigue mostrándola.
  El teléfono del jugador activo (`Play.jsx` FeedbackView) siempre ve la respuesta. Verificado por curl+screenshot.
- FEATURE dos dados: `roll_dice` (game.py) tira 2×d6 → `dice_value`=suma(2-12), `dice_values`=[d1,d2];
  `public_current` expone `dice_values`. Frontend: nuevo `DicePair` en `Dice.jsx`; Host y Play muestran 2 dados.
- FEATURE banco de preguntas por CSV (admin): formato maestro
  `question_id, entity_type, entity_id, difficulty, language, question, option_a..d, correct_answer, bible_reference, explanation, active`.
  Endpoints (server.py): `GET /admin/questions/template`, `GET /admin/questions/export?category=`,
  `POST /admin/questions/import_csv?replace_category=`. Import hace merge por `question_id` y por idioma
  (una fila `es` y otra `en` con el mismo id se combinan). `replace_category` borra la categoría antes de importar.
  UI: `CsvPanel` en Admin.jsx (Subir CSV / Descargar plantilla / Exportar actual + resumen y errores por fila).
- IMPORT (2026-06): banco maestro de PERSONAJES en español = 150 preguntas (10 personajes × 5/5/5
  explorer/investigator/archaeologist). Se eliminaron 25 preguntas de personaje del seed antiguo (duplicados).
  DB ahora: 150 character + 20 location + 19 event + 10 general = 199. Inglés se adjuntará luego por question_id.
- AUTH admin: login JWT (username/password de backend/.env: ADMIN_USERNAME/ADMIN_PASSWORD, JWT_SECRET).
  Todos los `/api/admin/*` requieren Bearer token (excepto `/admin/login`). Front guarda token en localStorage `abp_admin_token`.
  Credenciales en /app/memory/test_credentials.md.
- ⚠️ NOTA DESPLIEGUE: `seed_data.py` todavía tiene las 25 preguntas antiguas de personaje. En un servidor
  con DB vacía, `seed_if_empty` reinsertará el seed viejo (no las 150). Tras desplegar, re-subir el CSV maestro
  desde /admin (o actualizar seed_data.py). Añadidos a requirements.prod.txt: pyjwt, python-multipart.
