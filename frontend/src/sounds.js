// Lightweight synthesized sound effects via Web Audio API (no copyrighted assets).
let ctx = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = "sine", gain = 0.18) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

function noise(start, dur, gain = 0.12) {
  const a = ac();
  if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, a.currentTime + start);
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 1200;
  src.connect(f).connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

const SOUNDS = {
  dice: () => { noise(0, 0.5, 0.1); tone(180, 0.1, 0.08, "square", 0.08); tone(220, 0.25, 0.08, "square", 0.08); tone(300, 0.4, 0.1, "square", 0.08); },
  correct: () => { tone(523, 0, 0.12, "triangle"); tone(659, 0.1, 0.12, "triangle"); tone(784, 0.2, 0.25, "triangle"); },
  incorrect: () => { tone(220, 0, 0.2, "sawtooth", 0.12); tone(160, 0.15, 0.3, "sawtooth", 0.12); },
  clue: () => { tone(880, 0, 0.08, "sine"); tone(1175, 0.09, 0.18, "sine"); },
  verify: () => { tone(300, 0, 0.5, "sine", 0.06); tone(320, 0.5, 0.4, "sine", 0.06); },
  recovered: () => { tone(659, 0, 0.1, "triangle"); tone(784, 0.1, 0.1, "triangle"); tone(1047, 0.22, 0.35, "triangle", 0.22); },
  travel: () => { tone(330, 0, 0.6, "sine", 0.06); tone(440, 0.3, 0.5, "sine", 0.06); },
  page: () => { noise(0, 0.25, 0.08); },
  victory: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.4, "triangle", 0.2)); },
};

export function play(name, enabled = true) {
  if (!enabled) return;
  try { (SOUNDS[name] || (() => {}))(); } catch (e) {}
}
