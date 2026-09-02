import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Compass, User, MapPin, Scroll, BookOpen, Lock, AlertTriangle, Tent,
  CheckCircle2, XCircle, ChevronRight, LogOut, Loader2, Trophy,
} from "lucide-react";
import { useT, loc } from "@/i18n";
import { useRoom, BACKEND } from "@/useRoom";
import Dice, { DicePair } from "@/components/Dice";
import { play } from "@/sounds";
import { EmojiBar, TimerBar, useCountdown, SparkleBurst } from "@/components/interactions";

const API = `${BACKEND}/api`;
const SKEY = "archivo_session";

const RANKS = [
  { id: "explorer", icon: "🧭", labelKey: "explorer", ageKey: "explorerAge" },
  { id: "investigator", icon: "🔎", labelKey: "investigator", ageKey: "investigatorAge" },
  { id: "archaeologist", icon: "🏺", labelKey: "archaeologist", ageKey: "archaeologistAge" },
];
const CAT_ICON = { character: User, location: MapPin, event: Scroll };
const TILE_EMOJI = { character: "👤", location: "📍", event: "📜", trap: "⚠️", clue: "🔐", rest: "🏕️", step: "👣", path: "✨", temple: "🏛️", start: "🚩", surprise: "🎁" };

export default function Play() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SKEY)); } catch { return null; }
  });
  if (!session) return <JoinFlow onJoined={(s) => { localStorage.setItem(SKEY, JSON.stringify(s)); setSession(s); }} />;
  return <PlayerGame session={session} onLeave={() => { localStorage.removeItem(SKEY); setSession(null); }} />;
}

/* -------------------------------- JOIN FLOW -------------------------------- */
function JoinFlow({ onJoined }) {
  const nav = useNavigate();
  const preCode = (new URLSearchParams(window.location.search).get("code") || "").replace(/\D/g, "").slice(0, 4);
  const [step, setStep] = useState(preCode.length === 4 ? 1 : 0);
  const [code, setCode] = useState(preCode);
  const [name, setName] = useState("");
  const [lang, setLang] = useState("es");
  const [rank, setRank] = useState("explorer");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useT(lang);

  const doJoin = async () => {
    setLoading(true); setErr("");
    try {
      const res = await axios.post(`${API}/rooms/join`, { code, name, language: lang, rank });
      onJoined({ code: res.data.code, pid: res.data.player_id, lang, rank, name });
    } catch (e) { setErr(t("enterCode")); setStep(0); } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen grain flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight2 to-midnight" />
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <button data-testid="play-back-btn" onClick={() => nav("/")} className="self-start text-sand/60 hover:text-bronze flex items-center gap-1 text-sm mb-6">
          <LogOut className="w-4 h-4 rotate-180" /> {t("back")}
        </button>
        <div className="flex items-center gap-2 text-bronze mb-8">
          <Compass className="w-6 h-6" /><span className="font-display text-lg tracking-widest">{t("appTitle")}</span>
        </div>

        {step === 0 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("enterCode")}</h2>
            <input data-testid="join-code-input" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={t("codePlaceholder")} inputMode="numeric"
              className="w-full text-center tracking-[0.5em] text-5xl font-display bg-charcoal/70 border border-bronze/40 rounded-2xl py-6 text-gold outline-none focus:border-gold" />
            {err && <p className="text-incorrect mt-3 text-sm">{err}</p>}
            <PrimaryBtn testid="join-code-next" disabled={code.length !== 4} onClick={() => setStep(1)}>{t("next")}</PrimaryBtn>
          </div>
        )}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("yourName")}</h2>
            <input data-testid="join-name-input" value={name} onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder={t("namePlaceholder")}
              className="w-full text-2xl bg-charcoal/70 border border-bronze/40 rounded-2xl py-5 px-5 text-parchment outline-none focus:border-gold" />
            <PrimaryBtn testid="join-name-next" disabled={!name.trim()} onClick={() => setStep(2)}>{t("next")}</PrimaryBtn>
          </div>
        )}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("chooseLanguage")}</h2>
            <div className="grid gap-4">
              {[{ id: "es", label: "Español", flag: "🇪🇸" }, { id: "en", label: "English", flag: "🇺🇸" }].map((o) => (
                <button key={o.id} data-testid={`join-lang-${o.id}`} onClick={() => { setLang(o.id); play("page"); setStep(3); }}
                  className="btn-tactile glass border-bronze/40 rounded-2xl py-6 px-6 flex items-center gap-4 text-2xl text-parchment hover:border-gold">
                  <span className="text-3xl">{o.flag}</span> {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("chooseRank")}</h2>
            <div className="grid gap-4">
              {RANKS.map((r) => (
                <button key={r.id} data-testid={`join-rank-${r.id}`} onClick={() => { setRank(r.id); play("page"); setStep(4); }}
                  className="btn-tactile glass border-bronze/40 rounded-2xl py-5 px-6 flex items-center gap-4 text-left hover:border-gold">
                  <span className="text-4xl">{r.icon}</span>
                  <div><div className="font-serif text-2xl text-parchment">{t(r.labelKey)}</div><div className="text-sand/70 text-sm">{t(r.ageKey)}</div></div>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="animate-fade-up text-center flex-1 flex flex-col justify-center">
            <div className="text-6xl mb-6">{RANKS.find((r) => r.id === rank)?.icon}</div>
            <h2 className="font-serif text-3xl text-gold mb-2">{name}</h2>
            <p className="text-sand/70 mb-10">{t(rank)} · {lang === "es" ? "🇪🇸" : "🇺🇸"}</p>
            <PrimaryBtn testid="join-confirm-btn" disabled={loading} onClick={doJoin}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t("ready")}
            </PrimaryBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, testid }) {
  return (
    <button data-testid={testid} disabled={disabled} onClick={onClick}
      className="btn-tactile mt-8 w-full bg-gold text-midnight border-[#a9822f] font-bold text-xl rounded-2xl py-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bronze">
      {children}
    </button>
  );
}

/* -------------------------------- GAME -------------------------------- */
function PlayerGame({ session, onLeave }) {
  const { code, pid, lang } = session;
  const t = useT(lang);
  const { state, priv, send } = useRoom(code, "player", pid);
  const [tab, setTab] = useState("game");
  const prevPhase = useRef(null);
  const prevResult = useRef(null);

  useEffect(() => {
    if (!state || state.current_player?.id !== pid) return;
    if (state.phase !== prevPhase.current) {
      if (state.phase === "moving") play("dice", state.sound);
      prevPhase.current = state.phase;
    }
  }, [state, pid]);

  useEffect(() => {
    const r = priv?.last_result;
    if (r && r !== prevResult.current) {
      const s = state?.sound;
      if (r.type === "clue") play(r.granted ? "clue" : "incorrect", s);
      if (r.type === "verify") play("verify", s);
      if (r.type === "trap") play(r.passed ? "correct" : "incorrect", s);
      prevResult.current = r;
    }
    if (!r) prevResult.current = null;
  }, [priv, state]);

  if (state?.error) return <Centered><p className="text-parchment mb-6">Room not found.</p><PrimaryBtn testid="leave-btn" onClick={onLeave}>{t("back")}</PrimaryBtn></Centered>;
  if (!state) return <Centered><Loader2 className="w-8 h-8 animate-spin text-bronze" /></Centered>;

  const isMyTurn = state.current_player?.id === pid;
  const winner = state.status === "finished";

  return (
    <div className="relative min-h-screen grain flex flex-col bg-midnight">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight2 to-midnight pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-bronze/20">
        <div className="flex items-center gap-2 text-bronze"><Compass className="w-5 h-5" /><span className="font-display text-sm tracking-widest">{code}</span></div>
        <div className="text-sand/80 text-sm font-semibold truncate max-w-[45%]">{session.name}</div>
        <button data-testid="player-leave-btn" onClick={onLeave} className="text-sand/50 hover:text-incorrect"><LogOut className="w-4 h-4" /></button>
      </div>

      {priv?.can_win && !winner && (
        <div className="relative z-20 px-3 py-2 text-center animate-fade-up bg-gold/10 border-b border-gold/40">
          <p className="text-gold text-sm font-serif">🏛️ {t("templeOpen")}</p>
        </div>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto pb-24">
        {winner ? <WinnerPhone state={state} pid={pid} t={t} lang={lang} />
          : tab === "notebook" ? <Notebook state={state} priv={priv} lang={lang} t={t} />
          : state.status === "lobby" ? <LobbyWait session={session} t={t} />
          : (state.phase === "duel" || state.phase === "duel_result") ? <DuelView state={state} send={send} pid={pid} lang={lang} t={t} />
          : isMyTurn ? <TurnView state={state} priv={priv} send={send} lang={lang} t={t} />
          : <WaitTurn state={state} t={t} send={send} pid={pid} lang={lang} />}
      </div>

      {!winner && state.status !== "lobby" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-bronze/30 flex">
          <NavBtn active={tab === "game"} onClick={() => setTab("game")} icon={Compass} label={t("investigation")} testid="nav-game" />
          <NavBtn active={tab === "notebook"} onClick={() => { setTab("notebook"); play("page", state.sound); }} icon={BookOpen} label={t("caseFile")} testid="nav-notebook" />
        </div>
      )}
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon, label, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${active ? "text-gold" : "text-sand/50"}`}>
      <Icon className="w-5 h-5" /><span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
function Centered({ children }) { return <div className="min-h-screen bg-midnight grain flex items-center justify-center flex-col p-8 text-center">{children}</div>; }

function LobbyWait({ session, t }) {
  const r = RANKS.find((x) => x.id === session.rank);
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
      <div className="text-7xl mb-6 animate-float">{r?.icon}</div>
      <h2 className="font-serif text-3xl text-gold">{session.name}</h2>
      <p className="text-parchment mt-2">{t(session.rank)} · {session.lang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</p>
      <div className="mt-10 flex items-center gap-2 text-sand/70"><Loader2 className="w-5 h-5 animate-spin" /> {t("waitingHost")}</div>
    </div>
  );
}

function DuelView({ state, send, pid, lang, t }) {
  const cur = state.current || {};
  const q = cur.question;
  const tr = q?.translations?.[lang] || q?.translations?.es;
  const isContender = pid === cur.challenger || pid === cur.opponent;
  const [answered, setAnswered] = useState(false);
  const [voted, setVoted] = useState(null);
  const lastId = useRef(null);
  useEffect(() => { if (q?.id !== lastId.current) { lastId.current = q?.id; setAnswered(false); setVoted(null); } }, [q?.id]);
  const opts = [["A", tr?.answer_a], ["B", tr?.answer_b], ["C", tr?.answer_c], ["D", tr?.answer_d]];

  if (state.phase === "duel_result") {
    const win = cur.duel_winner_name;
    return (
      <div className="p-6 text-center min-h-[60vh] flex flex-col items-center justify-center animate-fade-up">
        <div className="text-6xl mb-3">⚔️</div>
        {win
          ? <><h2 className="font-serif text-3xl text-gold">{t("duelWinner")}</h2><p className="text-parchment text-2xl mt-2">🏆 {win} +{cur.duel_reward || 3}</p></>
          : <h2 className="font-serif text-2xl text-sand">{t("duelTie")}</h2>}
        {pid === cur.challenger && <div className="mt-8"><ContinueBtn send={send} t={t} label={t("endTurn")} /></div>}
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-up min-h-[60vh]">
      <div className="text-center mb-4">
        <div className="text-4xl mb-1">⚔️</div>
        <h2 className="font-display font-800 text-2xl text-terracotta">{t("duelTitle")}</h2>
        <p className="text-parchment mt-1">{cur.challenger_name} <span className="text-bronze">{t("duelVs")}</span> {cur.opponent_name}</p>
      </div>
      {isContender ? (
        <>
          <p className="text-gold text-sm mb-2">{t("youAreDueling")}</p>
          <h3 className="font-sans font-bold text-lg text-parchment mb-4">{tr?.question}</h3>
          {answered ? <div className="text-center text-sand/70 py-6">✅ {t("duelAnswered")}</div> : (
            <div className="grid gap-2">
              {opts.map(([L, txt]) => (
                <button key={L} data-testid={`duel-ans-${L}`} onClick={() => { setAnswered(true); send({ action: "duel_answer", answer: L }); }}
                  className="btn-tactile rounded-xl py-3 px-4 text-left border border-bronze/40 glass text-parchment"><b>{L}.</b> {txt}</button>
              ))}
            </div>
          )}
          {pid === cur.challenger && (
            <div className="mt-6 text-center">
              <button data-testid="duel-resolve" onClick={() => send({ action: "continue" })} className="text-sand/60 text-sm underline">{t("duelResolve")}</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-gold text-center text-sm mb-3">{t("whoWon")}</p>
          {q && <div className="glass rounded-xl p-3 mb-4 text-sand/80 text-sm">{tr?.question}</div>}
          {voted ? <div className="text-center text-sand/70 py-6">✅ {t("duelWaitVotes")}</div> : (
            <div className="grid grid-cols-2 gap-3">
              {[["challenger", cur.challenger_name, cur.challenger], ["opponent", cur.opponent_name, cur.opponent]].map(([k, name, tid]) => (
                <button key={k} data-testid={`duel-vote-${k}`} onClick={() => { setVoted(k); send({ action: "duel_vote", target: tid }); }}
                  className="btn-tactile rounded-2xl py-6 px-3 border-2 border-terracotta/60 bg-terracotta/15 text-parchment font-serif text-lg">{name}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WaitTurn({ state, t, send, pid, lang }) {
  if (state.phase === "question") return <SpectatorQuestion state={state} t={t} send={send} lang={lang} pid={pid} />;
  const cur = state.current || {};
  const iStole = state.phase === "feedback" && cur.result_type === "stolen" && cur.stolen_by_name;
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
      {iStole ? (
        <div className="animate-scale-in mb-8" data-testid="spectator-stolen">
          <div className="text-6xl mb-3">🕵️</div>
          <h2 className="font-serif text-3xl text-terracotta">{cur.stolen_by_name} {t("turnStolen")}</h2>
          <p className="text-gold text-lg mt-2">+{cur.steal_reward || 3}</p>
        </div>
      ) : (
        <>
          <Compass className="w-14 h-14 text-bronze/60 animate-spin-slow mb-6" style={{ animationDuration: "10s" }} />
          <p className="text-sand/70 uppercase tracking-widest text-xs mb-2">{t("turnOf")}</p>
          <h2 className="font-serif text-4xl text-gold">{state.current_player?.name}</h2>
          <p className="text-sand/60 mt-8 mb-8">{t("waitTurn")}</p>
        </>
      )}
      <p className="text-sand/50 text-xs uppercase tracking-widest mb-3">{t("reactLabel")}</p>
      <EmojiBar send={send} />
    </div>
  );
}

function SpectatorQuestion({ state, t, send, lang, pid }) {
  const cur = state.current || {};
  const q = cur.question;
  const tr = q?.translations?.[lang] || q?.translations?.es;
  const [predicted, setPredicted] = useState(null);
  const [voted, setVoted] = useState(null);
  const [stole, setStole] = useState(false);
  const lastId = useRef(null);
  useEffect(() => { if (q?.id !== lastId.current) { lastId.current = q?.id; setPredicted(null); setVoted(null); setStole(false); } }, [q?.id]);
  const opts = [["A", tr?.answer_a], ["B", tr?.answer_b], ["C", tr?.answer_c], ["D", tr?.answer_d]];
  const left = useCountdown(cur.time_left, q?.id);
  const stealOpen = cur.steal_eligible && left <= 5 && left > 0;
  const attempted = (cur.steal_attempted || []).includes(pid) || stole;
  const doSteal = (L) => { setStole(true); send({ action: "steal", answer: L }); };
  return (
    <div className="p-5 animate-fade-up">
      <p className="uppercase tracking-widest text-xs text-bronze mb-1">{state.current_player?.name}</p>
      <h2 className="font-sans font-bold text-xl text-parchment leading-snug mb-4">{tr?.question}</h2>

      {cur.steal_eligible && (stealOpen && !attempted ? (
        <div className="rounded-2xl p-4 mb-4 border-2 border-terracotta bg-terracotta/15 animate-scale-in" data-testid="steal-panel">
          <p className="text-terracotta font-serif text-lg flex items-center gap-2">🕵️ {t("stealBtn")}</p>
          <p className="text-sand/80 text-xs mb-3">{t("stealPrompt")} · ⏱️ {left}s</p>
          <div className="grid grid-cols-2 gap-2">
            {opts.map(([L, text]) => (
              <button key={L} data-testid={`steal-${L}`} onClick={() => doSteal(L)}
                className="btn-tactile rounded-xl py-2 px-3 text-left border border-terracotta/60 bg-terracotta/20 text-parchment text-sm hover:bg-terracotta/40"><b>{L}.</b> {text}</button>
            ))}
          </div>
        </div>
      ) : attempted ? (
        <div className="rounded-2xl p-3 mb-4 border border-incorrect/60 bg-incorrect/10 text-center" data-testid="steal-failed">
          <p className="text-incorrect text-sm font-semibold">❌ {t("stealFail")}</p>
        </div>
      ) : null)}

      <div className="glass rounded-2xl p-4 border-bronze/30 mb-4">
        <p className="text-sand/80 text-sm mb-3">{t("willGetRight")}</p>
        <div className="grid grid-cols-2 gap-3">
          <button data-testid="predict-yes" disabled={predicted} onClick={() => { setPredicted("yes"); send({ action: "predict", value: "yes" }); }}
            className={`btn-tactile rounded-xl py-3 font-bold border ${predicted === "yes" ? "bg-correct text-white border-[#256b3d]" : "glass text-parchment border-bronze/40"}`}>👍 {t("yesShort")}</button>
          <button data-testid="predict-no" disabled={predicted} onClick={() => { setPredicted("no"); send({ action: "predict", value: "no" }); }}
            className={`btn-tactile rounded-xl py-3 font-bold border ${predicted === "no" ? "bg-incorrect text-white border-[#8f2f26]" : "glass text-parchment border-bronze/40"}`}>👎 {t("noShort")}</button>
        </div>
        {predicted && <p className="text-gold text-xs mt-2 text-center">{t("predicted")}</p>}
      </div>
      {cur.help_requested && (
        <div className="glass rounded-2xl p-4 border-gold/40 mb-4">
          <p className="text-gold text-sm mb-3">🧭 {t("councilVoted")}</p>
          <div className="grid grid-cols-2 gap-2">
            {opts.map(([L, text]) => (
              <button key={L} data-testid={`vote-${L}`} disabled={voted} onClick={() => { setVoted(L); send({ action: "vote", letter: L }); }}
                className={`btn-tactile rounded-xl py-2 px-3 text-left border text-sm ${voted === L ? "bg-gold text-midnight border-[#a9822f]" : "glass text-parchment border-bronze/40"}`}><b>{L}.</b> {text}</button>
            ))}
          </div>
        </div>
      )}
      <p className="text-sand/50 text-xs uppercase tracking-widest mb-2 text-center">{t("reactLabel")}</p>
      <EmojiBar send={send} />
    </div>
  );
}

/* ------------------------------ TURN VIEW (board) ------------------------------ */
function TurnView({ state, priv, send, lang, t }) {
  const phase = state.phase;
  const cur = state.current || {};

  if (phase === "roll") {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <p className="text-gold font-serif text-2xl mb-2">{t("yourTurn")}</p>
        <p className="text-sand/70 mb-6">{priv?.can_win ? `🏛️ ${t("raceTemple")}` : t("rollToMove")}</p>
        <div className="mb-10"><DicePair values={[null, null]} size={78} /></div>
        <button data-testid="roll-dice-btn" onClick={() => send({ action: "roll" })}
          className="btn-tactile bg-gold text-midnight border-[#a9822f] font-black text-2xl rounded-full px-12 py-6 hover:bg-bronze">{t("rollDice")}</button>
      </div>
    );
  }
  if (phase === "choose_stop") {
    const opts = cur.options || [];
    const situ = ["character", "location", "event", "clue", "trap", "surprise"];
    return (
      <div className="p-6 flex flex-col items-center min-h-[60vh] animate-fade-up">
        <div className="mb-4"><DicePair values={cur.dice_values} size={64} /></div>
        <h2 className="font-serif text-2xl text-gold mb-1 text-center">{t("chooseStopTitle")}</h2>
        <p className="text-sand/70 text-sm mb-6 text-center">{t("chooseStopSub")}</p>
        <div className="grid gap-3 w-full max-w-sm">
          {opts.map((o) => {
            const showType = situ.includes(o.type);
            return (
              <button key={o.step} data-testid={`stop-opt-${o.step}`} onClick={() => send({ action: "choose_stop", step: o.step })}
                className={`btn-tactile rounded-2xl py-4 px-5 flex items-center gap-3 text-left border ${o.final ? "bg-gold/15 border-gold text-parchment" : "glass border-bronze/40 text-parchment hover:border-gold"}`}>
                <span className="text-3xl shrink-0">{TILE_EMOJI[o.type] || "✨"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg">{o.final ? t("advanceFull") : t("stopHere")}</div>
                  <div className="text-sand/60 text-xs truncate">{showType ? t("tile_" + o.type) + " · " : ""}{o.step} {t("tilesWord")}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-bronze shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (phase === "moving") {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="mb-6"><DicePair values={cur.dice_values} size={82} /></div>
        <p className="text-sand/70">{t("youAdvance")}</p>
        <div className="text-6xl my-4">{TILE_EMOJI[cur.tile] || "✨"}</div>
        <p className="font-serif text-2xl text-parchment mb-8">{t("tile_" + cur.tile)}</p>
        <ContinueBtn send={send} t={t} label={t("continue")} />
      </div>
    );
  }
  if (phase === "choose_candidate") {
    const catX = cur.category;
    const pool = state.pools[catX] || [];
    const discarded = priv?.discarded?.[catX] || [];
    const recovered = priv?.recovered_ids?.[catX];
    return (
      <div className="p-4 animate-fade-up">
        <SectionTitle icon={CAT_ICON[catX]} title={t("investigate_" + catX)} sub={t("chooseCandidate")} />
        <div className="grid grid-cols-2 gap-3 mt-5">
          {pool.map((e) => {
            const isD = discarded.includes(e.id), isR = recovered === e.id;
            return <CandidateCard key={e.id} entity={e} lang={lang} state={isR ? "recovered" : isD ? "discarded" : "normal"}
              onClick={() => !(isD || isR) && send({ action: "choose_candidate", candidate_id: e.id })} testid={`candidate-${e.id}`} t={t} />;
          })}
        </div>
        <PassBtn send={send} t={t} />
      </div>
    );
  }
  if (phase === "question") return <QuestionView cur={cur} lang={lang} t={t} send={send} />;
  if (phase === "feedback") return <FeedbackView cur={cur} priv={priv} lang={lang} t={t} send={send} />;
  if (phase === "clue_tile") {
    const r = priv?.last_result;
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <Lock className="w-14 h-14 text-gold mb-4" />
        <h2 className="font-serif text-3xl text-gold mb-4">{t("clueUnlocked")}</h2>
        {r?.granted && r?.clue && <p className="text-parchment text-xl italic mb-8 px-4">"{r.clue[lang] || r.clue.es}"</p>}
        <ContinueBtn send={send} t={t} label={t("endTurn")} autoSeconds={10} />
      </div>
    );
  }
  if (phase === "rest_tile") {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="text-7xl mb-4 animate-float">🏕️</div>
        <h2 className="font-serif text-3xl text-sand mb-3">{t("restTitle")}</h2>
        <p className="text-sand/70 mb-8">{t("restBody")}</p>
        <ContinueBtn send={send} t={t} label={t("endTurn")} autoSeconds={4} />
      </div>
    );
  }
  if (phase === "surprise_tile") {
    const s = cur.surprise || {};
    const txt = s.kind === "forward" ? `${t("sfForward")} ${s.amount}` : s.kind === "back" ? `${t("sfBack")} ${s.amount}` : `${t("sfHonor")} +${s.amount}`;
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="text-7xl mb-4 animate-float">🎁</div>
        <h2 className="font-serif text-3xl text-terracotta mb-2">{t("surpriseTitle")}</h2>
        <p className="text-parchment text-xl mb-8">{txt}</p>
        <ContinueBtn send={send} t={t} label={t("endTurn")} autoSeconds={5} />
      </div>
    );
  }
  return null;
}

function ContinueBtn({ send, t, label, autoSeconds }) {
  const [left, setLeft] = useState(autoSeconds || 0);
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
    if (!autoSeconds) return;
    setLeft(autoSeconds);
    const iv = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    const to = setTimeout(() => {
      if (!firedRef.current) { firedRef.current = true; send({ action: "continue" }); }
    }, autoSeconds * 1000);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [autoSeconds]);
  const go = () => { if (firedRef.current) return; firedRef.current = true; send({ action: "continue" }); };
  return (
    <div className="flex flex-col items-center gap-3">
      <button data-testid="continue-btn" onClick={go}
        className="btn-tactile bg-gold text-midnight border-[#a9822f] font-bold text-xl rounded-2xl px-10 py-4 hover:bg-bronze inline-flex items-center gap-2">
        {label} <ChevronRight className="w-5 h-5" />
      </button>
      {autoSeconds ? <p className="text-sand/50 text-sm" data-testid="auto-continue-hint">{t("autoContinue").replace("{s}", left)}</p> : null}
    </div>
  );
}
function PassBtn({ send, t }) {
  return <div className="text-center mt-8"><button data-testid="pass-turn-btn" onClick={() => send({ action: "pass" })} className="text-sand/60 hover:text-bronze underline underline-offset-4 text-sm">{t("endTurn")}</button></div>;
}
function SectionTitle({ icon: Icon, title, sub }) {
  return <div className="text-center mt-2">{Icon && <Icon className="w-9 h-9 text-gold mx-auto mb-2" />}<h2 className="font-serif text-2xl text-parchment">{title}</h2>{sub && <p className="text-sand/70 text-sm mt-1">{sub}</p>}</div>;
}

function CandidateCard({ entity, lang, state, onClick, testid, t }) {
  const name = loc(entity, lang);
  return (
    <button data-testid={testid} onClick={onClick} disabled={state !== "normal"}
      className={`relative btn-tactile rounded-2xl overflow-hidden border text-left transition-all ${state === "recovered" ? "border-gold animate-pulse-gold" : state === "discarded" ? "border-bronze/20 opacity-50" : "border-bronze/40 hover:border-gold"}`}>
      <div className="aspect-square overflow-hidden bg-charcoal">
        <img src={entity.image} alt={name} className={`w-full h-full object-cover ${state === "discarded" ? "grayscale" : ""}`} />
        {state === "discarded" && <div className="absolute inset-0 bg-midnight/50 flex items-center justify-center"><XCircle className="w-10 h-10 text-incorrect" /></div>}
        {state === "recovered" && <div className="absolute top-2 right-2 bg-gold rounded-full p-1"><CheckCircle2 className="w-5 h-5 text-midnight" /></div>}
      </div>
      <div className={`px-3 py-2 ${state === "recovered" ? "bg-gold/20" : "bg-charcoal/90"}`}>
        <div className={`font-serif text-base truncate ${state === "discarded" ? "line-through text-sand/50" : "text-parchment"}`}>{name}</div>
        {state === "recovered" && <div className="text-gold text-[11px] font-bold">✅ {t("recovered")}</div>}
        {state === "discarded" && <div className="text-incorrect/80 text-[11px] font-bold">❌ {t("discarded")}</div>}
      </div>
    </button>
  );
}

function QuestionView({ cur, lang, t, send }) {
  const q = cur.question;
  const tr = q?.translations?.[lang] || q?.translations?.es;
  const [picked, setPicked] = useState(null);
  const pickedRef = useRef(false);
  useEffect(() => { setPicked(null); pickedRef.current = false; }, [q?.id]);
  const left = useCountdown(cur.time_left, q?.id, () => { if (!pickedRef.current) send({ action: "answer", answer: "TIMEOUT" }); });
  const choose = (letter) => { setPicked(letter); pickedRef.current = true; send({ action: "answer", answer: letter }); };
  const opts = [["A", tr?.answer_a], ["B", tr?.answer_b], ["C", tr?.answer_c], ["D", tr?.answer_d]];
  const isTrap = cur.tile === "trap";
  const votes = cur.votes || {};
  return (
    <div className="p-5 animate-fade-up">
      {cur.time_left != null && <div className="mb-4"><TimerBar left={left} total={30} /></div>}
      {isTrap ? (
        <div className="flex items-center gap-2 mb-3 text-terracotta"><AlertTriangle className="w-6 h-6" /><span className="font-serif text-lg">{t("trapTitle")}</span></div>
      ) : cur.candidate && (
        <div className="flex items-center gap-3 mb-4 glass rounded-xl p-2 border-bronze/30">
          <img src={cur.candidate.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
          <span className="font-serif text-lg text-gold">{loc(cur.candidate, lang)}</span>
        </div>
      )}
      <p className="uppercase tracking-widest text-xs text-bronze mb-2">{t("question")}</p>
      <h2 className="font-sans font-bold text-2xl text-parchment leading-snug mb-6">{tr?.question}</h2>
      <div className="grid gap-3">
        {opts.map(([letter, text]) => (
          <button key={letter} data-testid={`answer-${letter}`} disabled={picked} onClick={() => choose(letter)}
            className={`btn-tactile rounded-2xl py-4 px-5 flex items-center gap-3 text-left border ${picked === letter ? "bg-gold text-midnight border-[#a9822f]" : "glass text-parchment border-bronze/40 hover:border-gold"}`}>
            <span className={`font-display font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0 ${picked === letter ? "bg-midnight text-gold" : "bg-bronze/20 text-gold"}`}>{letter}</span>
            <span className="font-medium text-lg flex-1">{text}</span>
            {cur.help_requested && votes[letter] > 0 && <span className="text-xs font-bold text-gold bg-midnight/40 rounded-full px-2 py-1">🧭 {votes[letter]}</span>}
          </button>
        ))}
      </div>
      {!cur.help_requested && !picked && (
        <button data-testid="ask-council-btn" onClick={() => send({ action: "request_help" })}
          className="btn-tactile mt-5 w-full glass border-gold/40 text-gold rounded-2xl py-3 font-semibold hover:border-gold">{t("askCouncil")}</button>
      )}
    </div>
  );
}

function FeedbackView({ cur, priv, lang, t, send }) {
  const q = cur.question;
  const tr = q?.translations?.[lang] || q?.translations?.es;
  const correct = cur.was_correct;
  const result = priv?.last_result;
  const robbed = result?.type === "stolen" || cur.result_type === "stolen";
  return (
    <div className="p-6 animate-fade-up">
      {robbed && (
        <div className="rounded-2xl p-4 mb-5 border-2 border-terracotta bg-terracotta/15 text-center animate-scale-in" data-testid="you-were-robbed">
          <div className="text-5xl mb-2">🕵️</div>
          <h2 className="font-serif text-2xl text-terracotta">{t("youWereRobbed")}</h2>
          <p className="text-sand/80 text-sm mt-1">{cur.stolen_by_name || result?.by_name} +{cur.steal_reward || 3}</p>
        </div>
      )}
      <div className={`relative text-center mb-5 ${correct ? "" : "animate-shake"}`}>
        {correct && <SparkleBurst />}
        {correct ? <CheckCircle2 className="w-16 h-16 text-correct mx-auto" /> : <XCircle className="w-16 h-16 text-incorrect mx-auto" />}
        <h2 className={`font-serif text-3xl mt-3 ${correct ? "text-correct" : "text-incorrect"}`}>{correct ? t("correct") : t("incorrect")}</h2>
        {correct && cur.streak >= 2 && <p className="text-terracotta font-display font-bold text-2xl mt-1">🔥 {t("streak")} x{cur.streak} · +{cur.honor_gain}</p>}
      </div>
      <div className="glass rounded-2xl p-4 border-bronze/30 mb-5">
        <p className="text-sand/70 text-xs uppercase tracking-widest mb-1">{t("correctAnswer")}</p>
        <p className="text-parchment font-bold text-lg mb-2">{cur.correct_answer}. {tr?.["answer_" + cur.correct_answer.toLowerCase()]}</p>
        <p className="text-sand/90 text-sm mb-2">{tr?.explanation}</p>
        <p className="text-gold text-sm font-semibold">📖 {cur.bible_reference}</p>
      </div>
      {result?.type === "verify" && (
        <div className={`rounded-2xl p-5 mb-5 border ${result.recovered ? "border-gold bg-gold/10 animate-pulse-gold" : "border-bronze/40 bg-charcoal/60"}`}>
          {result.recovered ? (<>
            <p className="font-serif text-2xl text-gold mb-1">🚨 {t("pieceRecovered")}</p>
            <p className="text-parchment text-lg">{loc(cur.candidate, lang)} ✅</p>
            <p className="text-sand/70 text-sm mt-2">🔐 {t("keepSecret")}</p>
          </>) : <p className="text-sand text-lg">❌ {loc(cur.candidate, lang)} {t("notThePiece")}</p>}
        </div>
      )}
      {result?.type === "trap" && (
        <div className={`rounded-2xl p-5 mb-5 border ${result.passed ? "border-correct bg-correct/10" : "border-incorrect bg-incorrect/10"}`}>
          <p className="font-serif text-xl text-parchment">{result.passed ? `✅ ${t("trapPassed")}` : `⚠️ ${t("trapFail")} (-${result.back})`}</p>
        </div>
      )}
      <div className="text-center"><ContinueBtn send={send} t={t} label={t("endTurn")} /></div>
    </div>
  );
}

/* ------------------------------ NOTEBOOK ------------------------------ */
function Notebook({ state, priv, lang, t }) {
  const [cat, setCat] = useState("character");
  const tabs = [
    { id: "character", labelKey: "characters", icon: User }, { id: "location", labelKey: "locations", icon: MapPin },
    { id: "event", labelKey: "events", icon: Scroll }, { id: "clues", labelKey: "clues", icon: Lock },
  ];
  const pieces = [
    { cat: "character", labelKey: "person", icon: User },
    { cat: "location", labelKey: "place", icon: MapPin },
    { cat: "event", labelKey: "event", icon: Scroll },
  ];
  const foundEntity = (c) => (state.pools?.[c] || []).find((e) => e.id === priv?.recovered_ids?.[c]);
  const doneCount = pieces.filter((p) => priv?.discovered?.[p.cat]).length;
  return (
    <div className="parchment min-h-full">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4"><BookOpen className="w-6 h-6 text-terracotta" /><h2 className="font-serif text-2xl text-[#3a2a14]">{t("caseFile")}</h2></div>

        {/* Private progress — only this player can see it */}
        <div className="bg-white/50 border border-[#3a2a14]/20 rounded-2xl p-4 mb-5" data-testid="my-progress">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-terracotta font-bold flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {t("myProgress")}</p>
            <span className="font-display font-bold text-[#3a2a14]" data-testid="progress-count">{doneCount}/3</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {pieces.map((p) => {
              const done = !!priv?.discovered?.[p.cat];
              const e = foundEntity(p.cat);
              return (
                <div key={p.cat} data-testid={`progress-${p.cat}`}
                  className={`rounded-xl overflow-hidden border text-center ${done ? "border-bronze ring-2 ring-gold bg-gold/10" : "border-dashed border-[#3a2a14]/30 bg-[#3a2a14]/5"}`}>
                  <div className="aspect-square relative bg-[#3a2a14]/10 flex items-center justify-center">
                    {done && e ? (
                      <>
                        <img src={e.image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-gold rounded-full p-0.5"><CheckCircle2 className="w-4 h-4 text-midnight" /></div>
                      </>
                    ) : (
                      <p.icon className="w-8 h-8 text-[#3a2a14]/30" />
                    )}
                  </div>
                  <div className="px-1.5 py-1.5">
                    <div className="text-[10px] uppercase tracking-wide text-[#6b5836] font-semibold">{t(p.labelKey)}</div>
                    {done && e ? (
                      <div className="font-serif text-xs text-[#3a2a14] truncate leading-tight">{loc(e, lang)}</div>
                    ) : (
                      <div className="text-[10px] text-[#6b5836] italic">{t("searching")}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map((tb) => (
            <button key={tb.id} data-testid={`notebook-tab-${tb.id}`} onClick={() => setCat(tb.id)}
              className={`px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1 ${cat === tb.id ? "bg-[#3a2a14] text-parchment" : "bg-[#3a2a14]/10 text-[#3a2a14]"}`}><tb.icon className="w-4 h-4" /> {t(tb.labelKey)}</button>
          ))}
        </div>
        {cat === "clues" ? (
          <div className="space-y-3">
            {(priv?.clues || []).length === 0 && <p className="text-[#6b5836]">{t("noClues")}</p>}
            {(priv?.clues || []).map((c, i) => (
              <div key={i} data-testid="clue-card" className="bg-white/60 border border-[#3a2a14]/20 rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-terracotta mb-1">🔐 {t("yourClue")}</p>
                <p className="text-[#3a2a14] text-lg italic">"{c[lang] || c.es}"</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(state.pools[cat] || []).map((e) => {
              const isD = (priv?.discarded?.[cat] || []).includes(e.id), isR = priv?.recovered_ids?.[cat] === e.id;
              return (
                <div key={e.id} data-testid={`notebook-${e.id}`} className={`rounded-xl overflow-hidden border ${isR ? "border-bronze ring-2 ring-gold" : isD ? "border-[#3a2a14]/10 opacity-60" : "border-[#3a2a14]/20"}`}>
                  <div className="aspect-square relative bg-charcoal">
                    <img src={e.image} alt="" className={`w-full h-full object-cover ${isD ? "grayscale" : ""}`} />
                    {isD && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><XCircle className="w-8 h-8 text-incorrect" /></div>}
                    {isR && <div className="absolute top-1 right-1 bg-gold rounded-full p-0.5"><CheckCircle2 className="w-4 h-4 text-midnight" /></div>}
                  </div>
                  <div className="px-2 py-1.5 bg-white/70"><div className={`font-serif text-sm truncate ${isD ? "line-through text-[#6b5836]" : "text-[#3a2a14]"}`}>{loc(e, lang)}</div></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerPhone({ state, pid, t, lang }) {
  const won = state.winner?.id === pid;
  useEffect(() => { play("victory", state.sound); }, []);
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[70vh] animate-scale-in">
      <Trophy className={`w-20 h-20 mb-4 ${won ? "text-gold" : "text-bronze/60"}`} />
      <h2 className="font-serif text-3xl text-gold mb-2">{won ? t("archiveRecovered") : state.winner?.name}</h2>
      <p className="text-parchment text-lg mb-8">{won ? t("recoveredAll") : `${state.winner?.name} ${t("winsExpedition")}`}</p>
      <div className="grid gap-3 w-full max-w-xs">
        {["character", "location", "event"].map((c) => (
          <div key={c} className="glass rounded-xl p-3 border-gold/40 flex items-center gap-3">
            <img src={state.reveal?.[c]?.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="text-left">
              <div className="text-xs uppercase tracking-widest text-sand/70">{t(c === "character" ? "person" : c === "location" ? "place" : "event")}</div>
              <div className="font-serif text-lg text-gold">{loc(state.reveal?.[c], lang)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
