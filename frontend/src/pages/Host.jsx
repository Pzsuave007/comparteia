import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Compass, Volume2, VolumeX, Pause, Play as PlayIcon, SkipForward,
  RotateCcw, Lock, User, MapPin, Scroll, Wind, Target, Loader2, Users, Tv, ScanLine,
} from "lucide-react";
import { tt, loc } from "@/i18n";
import { useRoom, BACKEND } from "@/useRoom";
import Dice from "@/components/Dice";
import { play } from "@/sounds";
import { QRCodeSVG } from "qrcode.react";
import { ReactionOverlay, TimerBar, useCountdown, ArchiveVault, SparkleBurst } from "@/components/interactions";
import { startAmbient, stopAmbient } from "@/sounds";

const API = `${BACKEND}/api`;
const RUINS = "https://images.unsplash.com/photo-1565799446045-5ba401561908";
const MAP = "https://images.unsplash.com/photo-1608924066819-930edc42986a";
const TEMPLE = "https://images.unsplash.com/photo-1767533427544-5f88d3fe4eed";

const DICE_META = {
  1: { icon: Lock, es: "PISTA PRIVADA", en: "PRIVATE CLUE" },
  2: { icon: User, es: "PERSONAJE", en: "CHARACTER" },
  3: { icon: Target, es: "ESCOGE UNO", en: "CHOOSE ONE" },
  4: { icon: MapPin, es: "LUGAR", en: "LOCATION" },
  5: { icon: Wind, es: "CONTRATIEMPO", en: "SETBACK" },
  6: { icon: Scroll, es: "ACONTECIMIENTO", en: "EVENT" },
};

const RANK_ICON = { explorer: "🧭", investigator: "🔎", archaeologist: "🏺" };
const TILE_EMOJI = { character: "👤", location: "📍", event: "📜", trap: "⚠️", clue: "🔐", rest: "🏕️", path: "✨", temple: "🏛️", start: "🚩" };

function BoardMap({ state }) {
  const board = state.board || [];
  const players = state.players || [];
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-midnight/90 border-t border-bronze/30 p-3 overflow-x-auto">
      <div className="flex gap-1.5 items-end min-w-max px-2">
        {board.map((type, i) => {
          const here = players.filter((p) => p.pos === i);
          const secret = i > (state.explore_end || 24);
          const locked = secret && !state.secret_open && type !== "temple";
          return (
            <div key={i} className={`relative rounded-lg flex items-center justify-center shrink-0 transition-all ${type === "temple" ? "w-16 h-14 bg-gold/25 border-2 border-gold animate-pulse-gold" : "w-10 h-12 border " + (locked ? "border-bronze/10 opacity-30" : secret ? "border-gold/60 bg-gold/10" : "border-bronze/30 bg-charcoal/60")}`}>
              <span className="text-lg">{locked ? "·" : (TILE_EMOJI[type] || "·")}</span>
              {here.length > 0 && (
                <div className="absolute -top-3 flex -space-x-1">
                  {here.map((p) => <span key={p.id} className="w-5 h-5 rounded-full bg-bronze border border-gold text-[9px] flex items-center justify-center text-midnight font-bold">{p.name[0]}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Host() {
  const [code, setCode] = useState(null);
  if (!code) return <CreateRoom onCreated={setCode} />;
  return <HostScreen code={code} />;
}

function CreateRoom({ onCreated }) {
  const nav = useNavigate();
  const [hostLang, setHostLang] = useState("bilingual");
  const [showTr, setShowTr] = useState(true);
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    const res = await axios.post(`${API}/rooms`, { host_language: hostLang, show_translation: showTr });
    onCreated(res.data.code);
  };

  return (
    <div className="relative min-h-screen grain tv-vignette overflow-hidden flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${RUINS})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/90 to-midnight/70" />
      <div className="relative z-10 glass rounded-3xl p-10 max-w-lg w-full border-bronze/40 animate-fade-up">
        <div className="flex items-center gap-2 text-bronze mb-6"><Tv className="w-6 h-6" /><span className="font-display tracking-widest">{tt("es", "appTitle")}</span></div>
        <h1 className="font-serif text-4xl text-parchment mb-8">{tt("es", "createExpedition")}</h1>

        <label className="block text-sand/80 text-sm uppercase tracking-widest mb-3">{tt("es", "tvLanguage")} / {tt("en", "tvLanguage")}</label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[{ id: "es", l: "🇪🇸 Español" }, { id: "en", l: "🇺🇸 English" }, { id: "bilingual", l: "🌎 Bilingüe" }].map((o) => (
            <button key={o.id} data-testid={`tv-lang-${o.id}`} onClick={() => setHostLang(o.id)}
              className={`btn-tactile rounded-xl py-4 text-sm font-semibold border ${hostLang === o.id ? "bg-bronze text-midnight border-bronze" : "glass text-parchment border-bronze/30"}`}>
              {o.l}
            </button>
          ))}
        </div>

        <button data-testid="tv-showtr-toggle" onClick={() => setShowTr(!showTr)} className="flex items-center justify-between w-full glass rounded-xl px-5 py-4 border-bronze/30 mb-8">
          <span className="text-parchment">{tt("es", "showTranslation")}</span>
          <span className={`w-12 h-6 rounded-full p-1 transition-colors ${showTr ? "bg-emerald" : "bg-charcoal"}`}>
            <span className={`block w-4 h-4 rounded-full bg-parchment transition-transform ${showTr ? "translate-x-6" : ""}`} />
          </span>
        </button>

        <button data-testid="tv-create-btn" onClick={create} disabled={loading}
          className="btn-tactile w-full bg-gold text-midnight border-[#a9822f] font-bold text-xl rounded-2xl py-5 hover:bg-bronze">
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : tt("es", "createExpedition")}
        </button>
        <button onClick={() => nav("/")} className="mt-4 w-full text-sand/60 hover:text-bronze text-sm">{tt("es", "back")}</button>
      </div>
    </div>
  );
}

/* ------------------------------ HOST SCREEN ------------------------------ */
function HostScreen({ code }) {
  const { state, send, reaction } = useRoom(code, "host");
  const prevPhase = useRef(null);
  const prevProgress = useRef(0);
  const [vaultPulse, setVaultPulse] = useState(false);

  useEffect(() => {
    const on = state?.sound && state?.status === "playing";
    if (on) startAmbient(true); else stopAmbient();
    return () => stopAmbient();
  }, [state?.sound, state?.status]);

  useEffect(() => {
    if (!state || state.status !== "playing") return;
    const mp = state.max_progress || 0;
    if (mp > prevProgress.current) {
      play("recovered", state.sound);
      setVaultPulse(true);
      setTimeout(() => setVaultPulse(false), 2600);
    }
    prevProgress.current = mp;
  }, [state?.max_progress, state?.status]);

  useEffect(() => {
    if (!state) return;
    if (state.phase !== prevPhase.current) {
      const s = state.sound;
      if (state.phase === "dice") play("dice", s);
      else if (state.phase === "travel") play("travel", s);
      else if (state.phase === "feedback") play(state.current?.was_correct ? "correct" : "incorrect", s);
      else if (state.phase === "winner") play("victory", s);
      prevPhase.current = state.phase;
    }
  }, [state]);

  if (!state) return <div className="min-h-screen bg-midnight flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-bronze" /></div>;

  const hostLang = state.host_language;

  return (
    <div className="relative min-h-screen overflow-hidden grain tv-vignette bg-midnight">
      {state.status === "lobby" && <Lobby state={state} send={send} />}
      {state.status === "playing" && <GameStage state={state} hostLang={hostLang} vaultPulse={vaultPulse} />}
      {state.status === "finished" && <WinnerReveal state={state} send={send} />}
      {state.status !== "lobby" && <ControlBar state={state} send={send} />}
      <ReactionOverlay reaction={reaction} />
    </div>
  );
}

function bi(hostLang, es, en, klass = "") {
  if (hostLang === "es") return <span className={klass}>{es}</span>;
  if (hostLang === "en") return <span className={klass}>{en}</span>;
  return (
    <span className={klass}>
      <span className="block">{es}</span>
      <span className="block text-[0.7em] opacity-80 font-sans">{en}</span>
    </span>
  );
}

/* --------------------------------- LOBBY --------------------------------- */
function Lobby({ state, send }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${RUINS})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/90 to-midnight/60" />
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2 gap-8 p-10 lg:p-16">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 text-bronze mb-4"><Compass className="w-8 h-8 animate-spin-slow" style={{ animationDuration: "14s" }} /><span className="uppercase tracking-[0.3em] text-sm text-sand">Expedición Bíblica</span></div>
          <h1 className="font-display font-800 text-5xl lg:text-6xl text-parchment leading-none text-shadow-lg">{tt("es", "appTitle")}</h1>
          <p className="font-serif italic text-2xl text-gold mt-4">{tt("es", "appSubtitle")}</p>

          <div className="mt-12 flex flex-wrap items-end gap-8">
            <div className="glass rounded-3xl p-10 border-gold/40 inline-block w-fit animate-pulse-gold">
              <p className="uppercase tracking-[0.3em] text-sand/80 text-sm mb-2">{tt("es", "roomCode")}</p>
              <div data-testid="tv-room-code" className="font-display font-800 text-8xl lg:text-9xl text-gold tracking-widest leading-none">{state.code}</div>
            </div>
            <div className="glass rounded-3xl p-5 border-bronze/40 flex flex-col items-center gap-2 animate-fade-up">
              <div className="bg-parchment p-3 rounded-2xl" data-testid="tv-join-qr">
                <QRCodeSVG value={`${window.location.origin}/play?code=${state.code}`} size={148} bgColor="#F4EEDC" fgColor="#0B1320" level="M" />
              </div>
              <p className="text-sand/80 text-sm font-semibold flex items-center gap-1"><ScanLine className="w-4 h-4 text-bronze" /> {bi(state.host_language, "Escanea para unirte", "Scan to join")}</p>
            </div>
          </div>
          <p className="mt-6 text-sand/80 text-lg">{tt("es", "joinAt")} · <span className="text-bronze font-semibold">{window.location.host}/play</span></p>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 text-parchment mb-4"><Users className="w-6 h-6 text-bronze" /><h2 className="font-serif text-2xl">{tt("es", "players")} ({state.players.length})</h2></div>
          <div className="glass rounded-3xl p-6 border-bronze/30 min-h-[280px]">
            {state.players.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sand/50 py-16">{tt("es", "noPlayers")}</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {state.players.map((p) => (
                  <div key={p.id} data-testid={`lobby-player-${p.id}`} className="flex items-center gap-3 bg-midnight2/60 rounded-2xl px-4 py-3 border border-bronze/20 animate-fade-up">
                    <span className="text-3xl">{RANK_ICON[p.rank]}</span>
                    <div className="min-w-0">
                      <div className="font-serif text-lg text-parchment truncate">{p.name}</div>
                      <div className="text-xs text-sand/60">{p.language === "es" ? "🇪🇸" : "🇺🇸"} {tt("es", p.rank)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button data-testid="tv-start-btn" onClick={() => send({ action: "start" })} disabled={state.players.length < 1}
            className="btn-tactile mt-6 bg-gold text-midnight border-[#a9822f] font-black text-2xl rounded-2xl py-6 hover:bg-bronze disabled:opacity-40">
            {tt("es", "startExpedition")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ GAME STAGE ------------------------------ */
function GameStage({ state, hostLang, vaultPulse }) {
  const cur = state.current || {};
  const phase = state.phase;
  const player = state.current_player;
  const pLang = player?.language || "es";

  const Banner = () => (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-3 py-4 bg-gradient-to-b from-midnight to-transparent">
      <span className="text-3xl">{RANK_ICON[player?.rank]}</span>
      <div className="font-serif text-2xl lg:text-3xl text-gold">{bi(hostLang, `TURNO DE ${player?.name?.toUpperCase()}`, `${player?.name?.toUpperCase()}'S TURN`)}</div>
    </div>
  );

  let body = null;

  if (phase === "moving") {
    body = (<StageWrap><Dice value={cur.dice_value} size={200} /><div className="text-7xl mt-8">{TILE_EMOJI[cur.tile] || "✨"}</div><div className="font-display font-800 text-4xl text-parchment mt-3 text-center">{bi(hostLang, "AVANZA…", "MOVING…")}</div></StageWrap>);
  }
  if (phase === "clue_tile") {
    body = (<StageWrap><Lock className="w-20 h-20 text-gold mb-4" /><h2 className="font-serif text-5xl text-gold">🔐 {bi(hostLang, "PISTA", "CLUE")}</h2><p className="text-sand/70 text-xl mt-4">{bi(hostLang, "Enviada al explorador", "Sent to the explorer")}</p></StageWrap>);
  }
  if (phase === "rest_tile") {
    body = (<StageWrap><div className="text-9xl mb-6 animate-float">🏕️</div><h2 className="font-display font-800 text-5xl text-sand">{bi(hostLang, "CAMPAMENTO", "CAMP")}</h2></StageWrap>);
  }

  if (phase === "roll") {
    body = (
      <StageWrap>
        <Dice value={null} size={200} />
        <h2 className="font-serif text-4xl text-parchment mt-10">{bi(hostLang, "Lanza el dado en tu teléfono", "Roll the die on your phone")}</h2>
      </StageWrap>
    );
  } else if (phase === "dice") {
    const meta = DICE_META[cur.dice_value] || DICE_META[1];
    const Icon = meta.icon;
    body = (
      <StageWrap>
        <Dice value={cur.dice_value} size={220} />
        <Icon className="w-16 h-16 text-gold mt-10 animate-scale-in" />
        <div className="font-display font-800 text-5xl lg:text-6xl text-parchment mt-4 text-center animate-fade-up">{bi(hostLang, meta.es, meta.en)}</div>
      </StageWrap>
    );
  } else if (phase === "choose_category") {
    body = <StageWrap><Target className="w-20 h-20 text-terracotta mb-6" /><h2 className="font-serif text-5xl text-parchment text-center">{bi(hostLang, "¡TÚ DECIDES!", "YOU DECIDE!")}</h2><p className="text-sand/70 text-xl mt-4">{bi(hostLang, "Elige en tu teléfono", "Choose on your phone")}</p></StageWrap>;
  } else if (phase === "choose_candidate" || phase === "choose_location") {
    const CatIcon = { character: User, location: MapPin, event: Scroll }[cur.category] || User;
    body = (
      <StageWrap>
        <CatIcon className="w-20 h-20 text-gold mb-6 animate-float" />
        <h2 className="font-serif text-4xl lg:text-5xl text-parchment text-center">
          {bi(hostLang, `${player?.name?.toUpperCase()} ESTÁ INVESTIGANDO…`, `${player?.name?.toUpperCase()} IS INVESTIGATING…`)}
        </h2>
      </StageWrap>
    );
  } else if (phase === "travel") {
    body = <TravelStage state={state} cur={cur} hostLang={hostLang} pLang={pLang} />;
  } else if (phase === "question") {
    body = <QuestionStage cur={cur} state={state} hostLang={hostLang} pLang={pLang} />;
  } else if (phase === "feedback") {
    body = <FeedbackStage cur={cur} state={state} hostLang={hostLang} pLang={pLang} />;
  } else if (phase === "setback") {
    body = <SetbackStage cur={cur} hostLang={hostLang} />;
  }

  const bg = phase === "travel" ? MAP : phase === "feedback" && cur.was_correct ? TEMPLE : RUINS;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${bg})` }} />
      <div className="absolute inset-0 bg-midnight/80" />
      <Banner />
      <div className="absolute top-4 right-6 z-30">
        <ArchiveVault progress={state.max_progress || 0} pulse={vaultPulse} hostLang={hostLang} />
      </div>
      {phase === "feedback" && cur.was_correct && <SparkleBurst key={cur.question?.id} />}
      <div className="relative z-10 pb-28">{body}</div>
      <BoardMap state={state} />
    </div>
  );
}

function StageWrap({ children }) {
  return <div className="min-h-screen flex flex-col items-center justify-center px-10 dice-scene animate-fade-in">{children}</div>;
}

function TravelStage({ cur, state, hostLang, pLang }) {
  const dest = cur.candidate;
  const pos = dest?.map_position || { x: 50, y: 50 };
  const start = { x: 50, y: 90 };
  const [marker, setMarker] = useState(start);
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    setMarker(start); setArrived(false);
    const id = setTimeout(() => setMarker(pos), 250);
    const id2 = setTimeout(() => setArrived(true), 1900);
    return () => { clearTimeout(id); clearTimeout(id2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest?.id]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-10 py-20">
      <div className="relative w-full max-w-4xl aspect-[16/9] rounded-3xl overflow-hidden border-2 border-bronze/50 shadow-2xl">
        <img src={MAP} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-midnight/30" />
        {/* dotted route */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <line x1={start.x} y1={start.y} x2={pos.x} y2={pos.y} stroke="#E5C05C" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.8" />
        </svg>
        {(state.pools.location || []).map((l) => (
          <div key={l.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${l.map_position?.x || 50}%`, top: `${l.map_position?.y || 50}%` }}>
            <div className="w-2.5 h-2.5 rounded-full bg-bronze/70" />
          </div>
        ))}
        {/* walking camel/explorer */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[1600ms] ease-in-out z-10" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
          <span className="text-4xl inline-block animate-float drop-shadow-lg">🐪</span>
        </div>
        {/* arrival wax seal */}
        {arrived && (
          <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20 animate-scale-in" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            <div className="w-16 h-16 rounded-full bg-terracotta/90 border-4 border-[#8f2f26] flex items-center justify-center shadow-xl rotate-[-12deg]">
              <span className="text-3xl">🏛️</span>
            </div>
          </div>
        )}
      </div>
      <h2 className="font-display font-800 text-6xl text-gold mt-10 animate-scale-in text-center">{loc(dest, pLang)}</h2>
      <p className="text-sand/80 text-xl mt-3 italic">{bi(hostLang, "Tu investigación comienza…", "Your investigation begins…")}</p>
    </div>
  );
}

function QuestionStage({ cur, state, hostLang, pLang }) {
  const q = cur.question;
  const primary = q?.translations?.[pLang] || q?.translations?.es;
  const otherLang = pLang === "es" ? "en" : "es";
  const secondary = state.show_translation ? q?.translations?.[otherLang] : null;
  const letters = ["A", "B", "C", "D"];
  const votes = cur.votes || {};
  const left = useCountdown(cur.time_left, q?.id);
  return (
    <div className="min-h-screen flex flex-col justify-center px-10 lg:px-24 py-24 max-w-6xl mx-auto animate-fade-up">
      {cur.time_left != null && (
        <div className="max-w-md mb-8"><TimerBar left={left} total={30} big /></div>
      )}
      {cur.candidate && (
        <div className="flex items-center gap-4 mb-6">
          <img src={cur.candidate.image} alt="" className="w-16 h-16 rounded-xl object-cover border border-bronze/40" />
          <span className="font-serif text-3xl text-gold">{loc(cur.candidate, pLang)}</span>
        </div>
      )}
      <h2 className="font-serif text-4xl lg:text-5xl text-parchment leading-tight text-shadow-lg">{primary?.question}</h2>
      {secondary && <p className="font-sans italic text-2xl text-sand/60 mt-3">{secondary.question}</p>}
      <div className="grid sm:grid-cols-2 gap-5 mt-10">
        {letters.map((L) => (
          <div key={L} className="glass rounded-2xl px-6 py-5 border-bronze/30 flex items-center gap-4">
            <span className="font-display font-bold text-2xl w-12 h-12 flex items-center justify-center rounded-full bg-bronze/20 text-gold shrink-0">{L}</span>
            <div className="flex-1">
              <span className="text-parchment text-2xl font-medium">{primary?.["answer_" + L.toLowerCase()]}</span>
              {secondary && <span className="block text-sand/50 italic text-lg">{secondary["answer_" + L.toLowerCase()]}</span>}
            </div>
            {cur.help_requested && votes[L] > 0 && (
              <span className="font-display font-bold text-gold bg-midnight/50 rounded-full px-3 py-1 text-lg shrink-0">🧭 {votes[L]}</span>
            )}
          </div>
        ))}
      </div>
      {cur.help_requested && (
        <p className="text-gold text-center mt-6 font-serif text-xl animate-fade-in">🧭 {bi(hostLang, "El consejo está votando…", "The council is voting…")}</p>
      )}
    </div>
  );
}

function FeedbackStage({ cur, state, hostLang, pLang }) {
  const q = cur.question;
  const primary = q?.translations?.[pLang] || q?.translations?.es;
  const correct = cur.was_correct;
  const isVerify = cur.phase_purpose === "verify";
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-10 py-24 text-center ${correct ? "animate-fade-in" : "animate-shake"}`}>
      <div className="font-display font-800 text-7xl lg:text-8xl mb-6" style={{ color: correct ? "#348C52" : "#B94034" }}>
        {bi(hostLang, correct ? "✅ ¡CORRECTO!" : "❌ CASI…", correct ? "CORRECT!" : "ALMOST…")}
      </div>
      <div className="glass rounded-3xl p-8 border-bronze/40 max-w-3xl">
        <p className="text-2xl text-parchment font-bold mb-2">{cur.correct_answer}. {primary?.["answer_" + cur.correct_answer.toLowerCase()]}</p>
        <p className="text-xl text-sand/90 mb-3">{primary?.explanation}</p>
        <p className="text-gold text-lg font-semibold">📖 {cur.bible_reference}</p>
      </div>
      {correct && isVerify && (
        <div className="mt-8 animate-fade-up">
          <p className="font-serif text-3xl text-bronze animate-pulse">🔎 {bi(hostLang, "Verificando archivo…", "Verifying archive…")}</p>
          <p className="font-display text-4xl text-gold mt-4">🔐 {bi(hostLang, "RESULTADO ENVIADO AL INVESTIGADOR", "RESULT SENT TO PLAYER")}</p>
        </div>
      )}
      {correct && cur.streak >= 2 && (
        <div className="mt-6 animate-scale-in">
          <span className="font-display font-800 text-5xl text-terracotta">🔥 {bi(hostLang, "RACHA", "STREAK")} x{cur.streak}</span>
          <span className="block text-gold text-2xl mt-1">+{cur.honor_gain} {bi(hostLang, "honor", "honor")}</span>
        </div>
      )}
      {correct && cur.phase_purpose === "clue" && (
        <p className="mt-8 font-display text-4xl text-gold animate-fade-up">🔐 {bi(hostLang, "PISTA DESBLOQUEADA", "CLUE UNLOCKED")}</p>
      )}
      {cur.predictions && (cur.predictions.yes + cur.predictions.no) > 0 && (
        <div className="mt-8 animate-fade-up glass rounded-2xl px-8 py-4 border-bronze/30">
          <p className="text-2xl text-parchment">
            <span className="text-gold font-display text-3xl">{correct ? cur.predictions.yes : cur.predictions.no}</span>{" "}
            {bi(hostLang, correct ? "creyeron que acertaría" : "dudaron", correct ? "believed" : "doubted")}
          </p>
        </div>
      )}
    </div>
  );
}

function SetbackStage({ cur, hostLang }) {
  const emoji = { sandstorm: "🌪️", caravan: "🐪", lostmap: "🗺️", blocked: "🏺", scroll: "📜" }[cur.setback] || "🌪️";
  const label = {
    sandstorm: ["Tormenta de arena", "Sandstorm"], caravan: ["Problemas con la caravana", "Caravan trouble"],
    lostmap: ["Mapa perdido", "Lost map"], blocked: ["Camino bloqueado", "Path blocked"], scroll: ["Pergamino ilegible", "Unreadable scroll"],
  }[cur.setback] || ["", ""];
  return (
    <StageWrap>
      <div className="text-9xl mb-6 animate-float">{emoji}</div>
      <h2 className="font-display font-800 text-6xl text-terracotta text-center">{bi(hostLang, "¡CONTRATIEMPO!", "SETBACK!")}</h2>
      <p className="text-parchment text-3xl mt-4 font-serif">{bi(hostLang, label[0], label[1])}</p>
      <p className="text-sand/70 text-xl mt-6">{bi(hostLang, "No podrás investigar este turno", "You can't investigate this turn")}</p>
    </StageWrap>
  );
}

/* ------------------------------ WINNER REVEAL ------------------------------ */
function WinnerReveal({ state, send }) {
  const [step, setStep] = useState(0); // 0 attention,1 char,2 loc,3 event,4 celebrate
  const hostLang = state.host_language;
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2200),
      setTimeout(() => setStep(2), 4400),
      setTimeout(() => setStep(3), 6600),
      setTimeout(() => { setStep(4); play("victory", state.sound); }, 8800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const pieces = [
    { key: "character", labelEs: "PERSONAJE PERDIDO", labelEn: "MISSING CHARACTER" },
    { key: "location", labelEs: "LUGAR PERDIDO", labelEn: "MISSING LOCATION" },
    { key: "event", labelEs: "ACONTECIMIENTO PERDIDO", labelEn: "MISSING EVENT" },
  ];

  return (
    <div className="relative min-h-screen bg-midnight flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${TEMPLE})` }} />
      <div className="absolute inset-0 bg-midnight/80" />
      {step === 4 && <Confetti />}
      <div className="relative z-10 text-center px-10 w-full max-w-4xl">
        {step === 0 && (
          <div className="animate-scale-in">
            <p className="font-display font-800 text-5xl lg:text-6xl text-gold text-shadow-lg">🚨 {bi(hostLang, "¡ATENCIÓN EXPLORADORES!", "ATTENTION EXPLORERS!")}</p>
            <p className="font-serif text-3xl text-parchment mt-8">{state.winner?.name} {bi(hostLang, "ha completado su investigación…", "has completed their investigation…")}</p>
          </div>
        )}
        {step >= 1 && step <= 3 && (
          <div className="grid gap-6">
            {pieces.slice(0, step).map((p, i) => (
              <PieceReveal key={p.key} piece={state.reveal?.[p.key]} label={bi(hostLang, p.labelEs, p.labelEn)} lang={state.winner?.id ? (state.players.find(pl => pl.id === state.winner.id)?.language || "es") : "es"} active={i === step - 1} />
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="animate-scale-in">
            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              {pieces.map((p) => (
                <div key={p.key} className="glass rounded-2xl p-4 border-gold/50">
                  <img src={state.reveal?.[p.key]?.image} alt="" className="w-full aspect-square object-cover rounded-xl mb-3" />
                  <div className="font-serif text-2xl text-gold">{loc(state.reveal?.[p.key], "es")}</div>
                </div>
              ))}
            </div>
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="font-display font-800 text-5xl lg:text-6xl text-gold text-shadow-lg">{bi(hostLang, "¡ARCHIVO BÍBLICO RECUPERADO!", "BIBLE ARCHIVE RECOVERED!")}</h1>
            <p className="font-serif text-4xl text-parchment mt-6">🏆 {state.winner?.name} {bi(hostLang, "gana la expedición", "wins the expedition")}</p>
            <HonorBoard state={state} hostLang={hostLang} />
            <button data-testid="tv-newgame-btn" onClick={() => { setStep(0); send({ action: "newgame" }); }}
              className="btn-tactile mt-10 bg-gold text-midnight border-[#a9822f] font-black text-2xl rounded-2xl px-12 py-5 hover:bg-bronze">
              {tt("es", "newExpedition")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HonorBoard({ state, hostLang }) {
  const ranked = [...(state.players || [])].sort((a, b) => (b.honor || 0) - (a.honor || 0));
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="mt-10 max-w-md mx-auto glass rounded-2xl p-6 border-bronze/40" data-testid="honor-board">
      <p className="uppercase tracking-[0.2em] text-sand/70 text-sm mb-4">📜 {bi(hostLang, "Marcador de honor", "Honor scoreboard")}</p>
      <div className="space-y-2">
        {ranked.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between bg-midnight2/60 rounded-xl px-4 py-2 border border-bronze/20">
            <span className="flex items-center gap-2 text-parchment font-serif text-lg">
              <span className="w-6">{medals[i] || `${i + 1}.`}</span> {p.name}
            </span>
            <span className="font-display font-bold text-gold text-xl">{p.honor || 0}</span>
          </div>
        ))}
      </div>
      <p className="text-sand/50 text-xs mt-3">{bi(hostLang, "Respuestas correctas", "Correct answers")}</p>
    </div>
  );
}

function PieceReveal({ piece, label, lang, active }) {
  return (
    <div className={`glass rounded-3xl p-6 border-gold/40 flex items-center gap-6 ${active ? "animate-scale-in" : "opacity-70"}`}>
      <img src={piece?.image} alt="" className="w-24 h-24 rounded-2xl object-cover border border-bronze/40" />
      <div className="text-left">
        <div className="uppercase tracking-[0.2em] text-sand/70 text-sm">{label}</div>
        <div className="font-display font-800 text-5xl text-gold">{loc(piece, lang)}</div>
      </div>
    </div>
  );
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 3, dur: 3 + Math.random() * 3,
    color: ["#E5C05C", "#C89B3C", "#C05B3F", "#2E6F40", "#F4EEDC"][i % 5], size: 6 + Math.random() * 8,
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {bits.map((b) => (
        <span key={b.id} style={{
          position: "absolute", left: `${b.left}%`, top: "-20px", width: b.size, height: b.size, background: b.color,
          borderRadius: 2, animation: `fall ${b.dur}s linear ${b.delay}s infinite`,
        }} />
      ))}
      <style>{`@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:0.2}}`}</style>
    </div>
  );
}

/* ------------------------------ CONTROL BAR ------------------------------ */
function ControlBar({ state, send }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass rounded-full px-4 py-2 flex items-center gap-2 border-bronze/40">
      <span className="text-bronze font-display text-sm px-2 tracking-widest">{state.code}</span>
      <Ctrl testid="ctrl-sound" onClick={() => send({ action: "sound", on: !state.sound })} icon={state.sound ? Volume2 : VolumeX} />
      {state.status === "playing" && <>
        <Ctrl testid="ctrl-skip" onClick={() => send({ action: "skip" })} icon={SkipForward} />
        <Ctrl testid="ctrl-restart" onClick={() => send({ action: "newgame" })} icon={RotateCcw} />
      </>}
    </div>
  );
}

function Ctrl({ onClick, icon: Icon, testid }) {
  return <button data-testid={testid} onClick={onClick} className="w-10 h-10 rounded-full flex items-center justify-center text-parchment hover:bg-bronze/30 transition-colors"><Icon className="w-5 h-5" /></button>;
}
