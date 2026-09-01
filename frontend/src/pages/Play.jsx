import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Compass, Lock, User, MapPin, Scroll, Wind, Target, BookOpen,
  CheckCircle2, XCircle, ChevronRight, LogOut, Loader2, Trophy,
} from "lucide-react";
import { useT, loc } from "@/i18n";
import { useRoom, BACKEND } from "@/useRoom";
import Dice from "@/components/Dice";
import { play } from "@/sounds";

const API = `${BACKEND}/api`;
const SKEY = "archivo_session";

const RANKS = [
  { id: "explorer", icon: "🧭", labelKey: "explorer", ageKey: "explorerAge" },
  { id: "investigator", icon: "🔎", labelKey: "investigator", ageKey: "investigatorAge" },
  { id: "archaeologist", icon: "🏺", labelKey: "archaeologist", ageKey: "archaeologistAge" },
];

const DICE_META = {
  1: { icon: Lock, key: "d1", color: "text-bronze" },
  2: { icon: User, key: "d2", color: "text-gold" },
  3: { icon: Target, key: "d3", color: "text-terracotta" },
  4: { icon: MapPin, key: "d4", color: "text-emerald" },
  5: { icon: Wind, key: "d5", color: "text-sand" },
  6: { icon: Scroll, key: "d6", color: "text-gold" },
};

const CAT_ICON = { character: User, location: MapPin, event: Scroll };

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
    } catch (e) {
      setErr(t("enterCode"));
      setStep(0);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen grain flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight2 to-midnight" />
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <button data-testid="play-back-btn" onClick={() => nav("/")} className="self-start text-sand/60 hover:text-bronze flex items-center gap-1 text-sm mb-6">
          <LogOut className="w-4 h-4 rotate-180" /> {t("back")}
        </button>

        <div className="flex items-center gap-2 text-bronze mb-8">
          <Compass className="w-6 h-6" />
          <span className="font-display text-lg tracking-widest">{t("appTitle")}</span>
        </div>

        {step === 0 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("enterCode")}</h2>
            <input
              data-testid="join-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={t("codePlaceholder")}
              inputMode="numeric"
              className="w-full text-center tracking-[0.5em] text-5xl font-display bg-charcoal/70 border border-bronze/40 rounded-2xl py-6 text-gold outline-none focus:border-gold"
            />
            {err && <p className="text-incorrect mt-3 text-sm">{err}</p>}
            <PrimaryBtn testid="join-code-next" disabled={code.length !== 4} onClick={() => setStep(1)}>{t("next")}</PrimaryBtn>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("yourName")}</h2>
            <input
              data-testid="join-name-input"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder={t("namePlaceholder")}
              className="w-full text-2xl bg-charcoal/70 border border-bronze/40 rounded-2xl py-5 px-5 text-parchment outline-none focus:border-gold"
            />
            <PrimaryBtn testid="join-name-next" disabled={!name.trim()} onClick={() => setStep(2)}>{t("next")}</PrimaryBtn>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="font-serif text-3xl text-parchment mb-6">{t("chooseLanguage")}</h2>
            <div className="grid gap-4">
              {[{ id: "es", label: "Español", flag: "🇪🇸" }, { id: "en", label: "English", flag: "🇺🇸" }].map((o) => (
                <button
                  key={o.id}
                  data-testid={`join-lang-${o.id}`}
                  onClick={() => { setLang(o.id); play("page"); setStep(3); }}
                  className="btn-tactile glass border-bronze/40 rounded-2xl py-6 px-6 flex items-center gap-4 text-2xl text-parchment hover:border-gold"
                >
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
                <button
                  key={r.id}
                  data-testid={`join-rank-${r.id}`}
                  onClick={() => { setRank(r.id); play("page"); setStep(4); }}
                  className="btn-tactile glass border-bronze/40 rounded-2xl py-5 px-6 flex items-center gap-4 text-left hover:border-gold"
                >
                  <span className="text-4xl">{r.icon}</span>
                  <div>
                    <div className="font-serif text-2xl text-parchment">{t(r.labelKey)}</div>
                    <div className="text-sand/70 text-sm">{t(r.ageKey)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-up text-center flex-1 flex flex-col justify-center">
            <div className="text-6xl mb-6">{RANKS.find((r) => r.id === rank)?.icon}</div>
            <h2 className="font-serif text-3xl text-gold mb-2">{name}</h2>
            <p className="text-sand/70 mb-10">{t(rank === "explorer" ? "explorer" : rank)} · {lang === "es" ? "🇪🇸" : "🇺🇸"}</p>
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
    <button
      data-testid={testid}
      disabled={disabled}
      onClick={onClick}
      className="btn-tactile mt-8 w-full bg-gold text-midnight border-[#a9822f] font-bold text-xl rounded-2xl py-5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bronze"
    >
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

  // sound cues driven by state/priv changes for this player
  useEffect(() => {
    if (!state || state.current_player?.id !== pid) return;
    const soundOn = state.sound;
    if (state.phase !== prevPhase.current) {
      if (state.phase === "dice") play("dice", soundOn);
      if (state.phase === "travel") play("travel", soundOn);
      prevPhase.current = state.phase;
    }
  }, [state, pid]);

  useEffect(() => {
    const r = priv?.last_result;
    if (r && r !== prevResult.current) {
      const soundOn = state?.sound;
      if (r.type === "clue") play(r.granted ? "clue" : "incorrect", soundOn);
      if (r.type === "verify") play(r.recovered ? "recovered" : "verify", soundOn);
      prevResult.current = r;
    }
    if (!r) prevResult.current = null;
  }, [priv, state]);

  useEffect(() => { if (priv?.can_win) play("recovered", state?.sound); }, [priv?.can_win]);

  if (state?.error) {
    return (
      <Centered>
        <p className="text-parchment mb-6">Room not found.</p>
        <PrimaryBtn testid="leave-btn" onClick={onLeave}>{t("back")}</PrimaryBtn>
      </Centered>
    );
  }
  if (!state) return <Centered><Loader2 className="w-8 h-8 animate-spin text-bronze" /></Centered>;

  const isMyTurn = state.current_player?.id === pid;
  const winner = state.status === "finished";

  return (
    <div className="relative min-h-screen grain flex flex-col bg-midnight">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight2 to-midnight pointer-events-none" />
      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-bronze/20">
        <div className="flex items-center gap-2 text-bronze">
          <Compass className="w-5 h-5" />
          <span className="font-display text-sm tracking-widest">{code}</span>
        </div>
        <div className="text-sand/80 text-sm font-semibold truncate max-w-[45%]">{session.name}</div>
        <button data-testid="player-leave-btn" onClick={onLeave} className="text-sand/50 hover:text-incorrect"><LogOut className="w-4 h-4" /></button>
      </div>

      {/* win banner */}
      {priv?.can_win && !winner && (
        <div className="relative z-20 p-3 animate-fade-up">
          <button
            data-testid="recover-archive-btn"
            onClick={() => send({ action: "claim_win" })}
            className="btn-tactile w-full bg-gradient-to-r from-gold to-bronze text-midnight font-black text-lg rounded-2xl py-4 animate-pulse-gold border-[#a9822f]"
          >
            {t("recoverArchive")}
          </button>
          <p className="text-center text-gold text-sm mt-2 font-serif">{t("archiveComplete")} {t("recoveredAll")}</p>
        </div>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto pb-24">
        {winner ? (
          <WinnerPhone state={state} pid={pid} t={t} lang={lang} />
        ) : tab === "notebook" ? (
          <Notebook state={state} priv={priv} lang={lang} t={t} />
        ) : state.status === "lobby" ? (
          <LobbyWait session={session} t={t} />
        ) : isMyTurn ? (
          <TurnView state={state} priv={priv} send={send} lang={lang} t={t} />
        ) : (
          <WaitTurn state={state} t={t} />
        )}
      </div>

      {/* bottom nav */}
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
      <Icon className="w-5 h-5" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function Centered({ children }) {
  return <div className="min-h-screen bg-midnight grain flex items-center justify-center flex-col p-8 text-center">{children}</div>;
}

function LobbyWait({ session, t }) {
  const r = RANKS.find((x) => x.id === session.rank);
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
      <div className="text-7xl mb-6 animate-float">{r?.icon}</div>
      <h2 className="font-serif text-3xl text-gold">{session.name}</h2>
      <p className="text-parchment mt-2">{t(session.rank)} · {session.lang === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</p>
      <div className="mt-10 flex items-center gap-2 text-sand/70">
        <Loader2 className="w-5 h-5 animate-spin" /> {t("waitingHost")}
      </div>
    </div>
  );
}

function WaitTurn({ state, t }) {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <Compass className="w-14 h-14 text-bronze/60 animate-spin-slow mb-6" style={{ animationDuration: "10s" }} />
      <p className="text-sand/70 uppercase tracking-widest text-xs mb-2">{t("turnOf")}</p>
      <h2 className="font-serif text-4xl text-gold">{state.current_player?.name}</h2>
      <p className="text-sand/60 mt-8">{t("waitTurn")}</p>
    </div>
  );
}

/* ------------------------------ TURN VIEW ------------------------------ */
function TurnView({ state, priv, send, lang, t }) {
  const phase = state.phase;
  const cur = state.current || {};

  if (phase === "roll") {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <p className="text-gold font-serif text-2xl mb-8">{t("yourTurn")}</p>
        <div className="mb-10"><Dice value={null} size={110} /></div>
        <button data-testid="roll-dice-btn" onClick={() => send({ action: "roll" })}
          className="btn-tactile bg-gold text-midnight border-[#a9822f] font-black text-2xl rounded-full px-12 py-6 hover:bg-bronze">
          {t("rollDice")}
        </button>
      </div>
    );
  }

  if (phase === "dice") {
    const meta = DICE_META[cur.dice_value] || DICE_META[1];
    const Icon = meta.icon;
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="mb-8"><Dice value={cur.dice_value} size={120} /></div>
        <Icon className={`w-12 h-12 mb-3 ${meta.color}`} />
        <h2 className="font-serif text-3xl text-parchment mb-8">{t(meta.key)}</h2>
        <ContinueBtn send={send} t={t} label={t("continue")} />
      </div>
    );
  }

  if (phase === "choose_category") {
    return (
      <div className="p-6 animate-fade-up">
        <SectionTitle icon={Target} title={t("youDecide")} sub={t("chooseCategory")} />
        <div className="grid gap-4 mt-6">
          {["character", "location", "event"].map((c) => {
            const Icon = CAT_ICON[c];
            return (
              <button key={c} data-testid={`choose-cat-${c}`} onClick={() => send({ action: "choose_category", category: c })}
                className="btn-tactile glass border-bronze/40 rounded-2xl py-6 px-6 flex items-center gap-4 hover:border-gold">
                <Icon className="w-8 h-8 text-gold" />
                <span className="font-serif text-2xl text-parchment">{t(c === "character" ? "person" : c === "location" ? "place" : "event")}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "choose_candidate") {
    const cat = cur.category;
    const pool = state.pools[cat] || [];
    const discarded = priv?.discarded?.[cat] || [];
    const recovered = priv?.recovered_ids?.[cat];
    return (
      <div className="p-4 animate-fade-up">
        <SectionTitle icon={CAT_ICON[cat]} title={cat === "event" ? t("investigateEvent") : t("investigateCharacter")} sub={cat === "event" ? t("chooseEvent") : t("chooseCharacter")} />
        <div className="grid grid-cols-2 gap-3 mt-5">
          {pool.map((e) => {
            const isDiscarded = discarded.includes(e.id);
            const isRecovered = recovered === e.id;
            const disabled = isDiscarded || isRecovered;
            return (
              <CandidateCard key={e.id} entity={e} lang={lang} state={isRecovered ? "recovered" : isDiscarded ? "discarded" : "normal"}
                onClick={() => !disabled && send({ action: "choose_candidate", candidate_id: e.id })}
                testid={`candidate-${e.id}`} t={t} />
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "choose_location") {
    const pool = state.pools.location || [];
    const discarded = priv?.discarded?.location || [];
    const recovered = priv?.recovered_ids?.location;
    return (
      <div className="p-4 animate-fade-up">
        <SectionTitle icon={MapPin} title={t("whereTravel")} sub={t("chooseDestination")} />
        <div className="grid grid-cols-2 gap-3 mt-5">
          {pool.map((e) => {
            const isDiscarded = discarded.includes(e.id);
            const isRecovered = recovered === e.id;
            const disabled = isDiscarded || isRecovered;
            return (
              <CandidateCard key={e.id} entity={e} lang={lang} state={isRecovered ? "recovered" : isDiscarded ? "discarded" : "normal"}
                onClick={() => !disabled && send({ action: "choose_location", location_id: e.id })}
                testid={`location-${e.id}`} t={t} />
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "travel") {
    const dest = cur.candidate;
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <MapPin className="w-10 h-10 text-emerald mb-4 animate-bounce" />
        <p className="text-sand/70 uppercase tracking-widest text-xs">{t("traveling")}</p>
        <h2 className="font-serif text-4xl text-gold mt-2 mb-6">{loc(dest, lang)}</h2>
        {dest?.image && <img src={dest.image} alt="" className="w-full max-w-xs rounded-2xl border border-bronze/40 mb-8 shadow-lg" />}
        <p className="text-sand/70 italic mb-6">{t("beginsHere")}</p>
        <ContinueBtn send={send} t={t} label={t("continue")} />
      </div>
    );
  }

  if (phase === "question") {
    return <QuestionView cur={cur} lang={lang} t={t} send={send} />;
  }

  if (phase === "feedback") {
    return <FeedbackView cur={cur} priv={priv} lang={lang} t={t} send={send} />;
  }

  if (phase === "setback") {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="text-7xl mb-4 animate-float">{(t(`sb_${cur.setback}`) || "").split(" ")[0]}</div>
        <Wind className="w-10 h-10 text-terracotta mb-3" />
        <h2 className="font-serif text-3xl text-terracotta mb-3">{t("setbackTitle")}</h2>
        <p className="text-parchment mb-2">{t(`sb_${cur.setback}`)}</p>
        <p className="text-sand/70 mb-8">{t("noInvestigate")}</p>
        <ContinueBtn send={send} t={t} label={t("endTurn")} />
      </div>
    );
  }

  return null;
}

function ContinueBtn({ send, t, label }) {
  return (
    <button data-testid="continue-btn" onClick={() => send({ action: "continue" })}
      className="btn-tactile bg-gold text-midnight border-[#a9822f] font-bold text-xl rounded-2xl px-10 py-4 hover:bg-bronze inline-flex items-center gap-2">
      {label} <ChevronRight className="w-5 h-5" />
    </button>
  );
}

function SectionTitle({ icon: Icon, title, sub }) {
  return (
    <div className="text-center mt-2">
      <Icon className="w-9 h-9 text-gold mx-auto mb-2" />
      <h2 className="font-serif text-2xl text-parchment">{title}</h2>
      {sub && <p className="text-sand/70 text-sm mt-1">{sub}</p>}
    </div>
  );
}

function CandidateCard({ entity, lang, state, onClick, testid, t }) {
  const name = loc(entity, lang);
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      disabled={state !== "normal"}
      className={`relative btn-tactile rounded-2xl overflow-hidden border text-left transition-all ${
        state === "recovered" ? "border-gold animate-pulse-gold" :
        state === "discarded" ? "border-bronze/20 opacity-50" : "border-bronze/40 hover:border-gold"
      }`}
    >
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
  useEffect(() => { setPicked(null); }, [q?.id]);
  const opts = [["A", tr?.answer_a], ["B", tr?.answer_b], ["C", tr?.answer_c], ["D", tr?.answer_d]];
  const catIcon = cur.candidate ? loc(cur.candidate, lang) : null;
  return (
    <div className="p-5 animate-fade-up">
      {cur.candidate && (
        <div className="flex items-center gap-3 mb-4 glass rounded-xl p-2 border-bronze/30">
          <img src={cur.candidate.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
          <span className="font-serif text-lg text-gold">{catIcon}</span>
        </div>
      )}
      <p className="uppercase tracking-widest text-xs text-bronze mb-2">{t("question")}</p>
      <h2 className="font-sans font-bold text-2xl text-parchment leading-snug mb-6">{tr?.question}</h2>
      <div className="grid gap-3">
        {opts.map(([letter, text]) => (
          <button
            key={letter}
            data-testid={`answer-${letter}`}
            disabled={picked}
            onClick={() => { setPicked(letter); send({ action: "answer", answer: letter }); }}
            className={`btn-tactile rounded-2xl py-4 px-5 flex items-center gap-3 text-left border ${
              picked === letter ? "bg-gold text-midnight border-[#a9822f]" : "glass text-parchment border-bronze/40 hover:border-gold"
            }`}
          >
            <span className={`font-display font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0 ${picked === letter ? "bg-midnight text-gold" : "bg-bronze/20 text-gold"}`}>{letter}</span>
            <span className="font-medium text-lg">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedbackView({ cur, priv, lang, t, send }) {
  const q = cur.question;
  const tr = q?.translations?.[lang] || q?.translations?.es;
  const correct = cur.was_correct;
  const result = priv?.last_result;
  const isClue = cur.phase_purpose === "clue";

  return (
    <div className="p-6 animate-fade-up">
      <div className={`text-center mb-5 ${correct ? "" : "animate-shake"}`}>
        {correct ? <CheckCircle2 className="w-16 h-16 text-correct mx-auto" /> : <XCircle className="w-16 h-16 text-incorrect mx-auto" />}
        <h2 className={`font-serif text-3xl mt-3 ${correct ? "text-correct" : "text-incorrect"}`}>
          {correct ? t("correct") : (isClue ? t("incorrectClue") : t("incorrect"))}
        </h2>
      </div>

      {/* educational feedback */}
      <div className="glass rounded-2xl p-4 border-bronze/30 mb-5">
        <p className="text-sand/70 text-xs uppercase tracking-widest mb-1">{t("correctAnswer")}</p>
        <p className="text-parchment font-bold text-lg mb-2">{cur.correct_answer}. {tr?.["answer_" + cur.correct_answer.toLowerCase()]}</p>
        <p className="text-sand/90 text-sm mb-2">{tr?.explanation}</p>
        <p className="text-gold text-sm font-semibold">📖 {cur.bible_reference}</p>
      </div>

      {/* private outcome */}
      {result?.type === "clue" && (
        <div className={`rounded-2xl p-5 mb-5 border ${result.granted ? "border-gold bg-gold/10" : "border-incorrect/40 bg-incorrect/10"}`}>
          <p className="font-serif text-xl mb-2 text-gold">{result.granted ? t("clueUnlocked") : t("clueLost")}</p>
          {result.granted && result.clue && <p className="text-parchment text-lg italic">"{result.clue[lang] || result.clue.es}"</p>}
        </div>
      )}
      {result?.type === "verify" && (
        <div className={`rounded-2xl p-5 mb-5 border ${result.recovered ? "border-gold bg-gold/10 animate-pulse-gold" : "border-bronze/40 bg-charcoal/60"}`}>
          {result.recovered ? (
            <>
              <p className="font-serif text-2xl text-gold mb-1">🚨 {t("pieceRecovered")}</p>
              <p className="text-parchment text-lg">{loc(cur.candidate, lang)} ✅</p>
              <p className="text-sand/70 text-sm mt-2">🔐 {t("keepSecret")}</p>
            </>
          ) : (
            <p className="text-sand text-lg">❌ {loc(cur.candidate, lang)} {t("notThePiece")}</p>
          )}
        </div>
      )}

      <div className="text-center">
        <ContinueBtn send={send} t={t} label={t("endTurn")} />
      </div>
    </div>
  );
}

/* ------------------------------ NOTEBOOK ------------------------------ */
function Notebook({ state, priv, lang, t }) {
  const [cat, setCat] = useState("character");
  const tabs = [
    { id: "character", labelKey: "characters", icon: User },
    { id: "location", labelKey: "locations", icon: MapPin },
    { id: "event", labelKey: "events", icon: Scroll },
    { id: "clues", labelKey: "clues", icon: Lock },
  ];
  return (
    <div className="parchment min-h-full">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-terracotta" />
          <h2 className="font-serif text-2xl text-[#3a2a14]">{t("caseFile")}</h2>
        </div>
        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map((tb) => (
            <button key={tb.id} data-testid={`notebook-tab-${tb.id}`} onClick={() => setCat(tb.id)}
              className={`px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1 transition-colors ${cat === tb.id ? "bg-[#3a2a14] text-parchment" : "bg-[#3a2a14]/10 text-[#3a2a14]"}`}>
              <tb.icon className="w-4 h-4" /> {t(tb.labelKey)}
            </button>
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
              const discarded = (priv?.discarded?.[cat] || []).includes(e.id);
              const recovered = priv?.recovered_ids?.[cat] === e.id;
              return (
                <div key={e.id} data-testid={`notebook-${e.id}`}
                  className={`rounded-xl overflow-hidden border ${recovered ? "border-bronze ring-2 ring-gold" : discarded ? "border-[#3a2a14]/10 opacity-60" : "border-[#3a2a14]/20"}`}>
                  <div className="aspect-square relative bg-charcoal">
                    <img src={e.image} alt="" className={`w-full h-full object-cover ${discarded ? "grayscale" : ""}`} />
                    {discarded && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><XCircle className="w-8 h-8 text-incorrect" /></div>}
                    {recovered && <div className="absolute top-1 right-1 bg-gold rounded-full p-0.5"><CheckCircle2 className="w-4 h-4 text-midnight" /></div>}
                  </div>
                  <div className="px-2 py-1.5 bg-white/70">
                    <div className={`font-serif text-sm truncate ${discarded ? "line-through text-[#6b5836]" : "text-[#3a2a14]"}`}>{loc(e, lang)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ WINNER (phone) ------------------------------ */
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
