import React, { useEffect, useRef, useState } from "react";

export const EMOJIS = ["🔥", "😲", "🐪", "👏", "🙌", "🤔", "😂", "⚡"];

// Counts down from `initial` seconds, resetting only when `resetKey` changes.
export function useCountdown(initial, resetKey, onExpire) {
  const [left, setLeft] = useState(initial ?? 0);
  const fired = useRef(false);
  useEffect(() => {
    fired.current = false;
    setLeft(initial ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  useEffect(() => {
    if (initial == null) return;
    if (left <= 0) {
      if (!fired.current && onExpire) { fired.current = true; onExpire(); }
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, initial]);
  return left;
}

export function TimerBar({ left, total = 30, big }) {
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const danger = left <= 8;
  return (
    <div data-testid="question-timer" className="w-full">
      <div className={`flex items-center gap-2 ${big ? "mb-2" : "mb-1"}`}>
        <span className="text-lg">⏳</span>
        <div className={`flex-1 rounded-full bg-black/30 overflow-hidden ${big ? "h-3" : "h-2"}`}>
          <div className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%`, background: danger ? "#B94034" : "#C89B3C" }} />
        </div>
        <span className={`font-display font-bold ${danger ? "text-incorrect" : "text-gold"} ${big ? "text-2xl" : "text-base"}`}>{left}</span>
      </div>
    </div>
  );
}

export function EmojiBar({ send, testid = "emoji-bar" }) {
  const [popped, setPopped] = useState(null);
  const fire = (e) => { send({ action: "emoji", emoji: e }); setPopped(e + Date.now()); setTimeout(() => setPopped(null), 400); };
  return (
    <div data-testid={testid} className="flex flex-wrap gap-2 justify-center">
      {EMOJIS.map((e) => (
        <button key={e} data-testid={`emoji-${e}`} onClick={() => fire(e)}
          className={`text-3xl w-14 h-14 rounded-2xl glass border border-bronze/30 flex items-center justify-center btn-tactile hover:border-gold ${popped && popped.startsWith(e) ? "scale-125" : ""}`}>
          {e}
        </button>
      ))}
    </div>
  );
}

// Floating reactions overlay for the TV. `reaction` = {emoji, name, id}.
export function ReactionOverlay({ reaction }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!reaction) return;
    const item = { ...reaction, left: 8 + Math.random() * 84, key: reaction.id };
    setItems((prev) => [...prev, item]);
    const t = setTimeout(() => setItems((prev) => prev.filter((i) => i.key !== item.key)), 3200);
    return () => clearTimeout(t);
  }, [reaction]);
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {items.map((i) => (
        <div key={i.key} style={{ position: "absolute", left: `${i.left}%`, bottom: "8%", animation: "floatUp 3.1s ease-out forwards" }}>
          <div className="text-6xl drop-shadow-lg">{i.emoji}</div>
          <div className="text-sand text-sm text-center font-semibold -mt-1">{i.name}</div>
        </div>
      ))}
      <style>{`@keyframes floatUp{0%{transform:translateY(0) scale(0.6);opacity:0}15%{opacity:1;transform:translateY(-20px) scale(1.1)}100%{transform:translateY(-60vh) scale(1);opacity:0}}`}</style>
    </div>
  );
}
