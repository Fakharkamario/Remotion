// Synthesizes the soundtrack (music bed + SFX synced to the film's cues) into assets/audio/soundtrack.wav.
// Run: node scripts/make-audio.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
// film.js attaches FILM to globalThis when there is no window
new Function(fs.readFileSync(path.join(root, "assets/film.js"), "utf8"))();
const FILM = globalThis.FILM;

const SR = 44100, DUR = FILM.TOTAL / FILM.FPS + 0.0, N = Math.round(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const busRev = new Float32Array(N); // send to reverb
const fr = (f) => f / FILM.FPS;

let seed = 1234567;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rand() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function add(i, v, pan = 0, rev = 0) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  L[i] += v * l * 1.414 * 0.707; R[i] += v * r * 1.414 * 0.707; busRev[i] += v * rev;
}
// simple biquad
function biquad(type, f0, q) {
  const w = 2 * Math.PI * f0 / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
  let b0, b1, b2, a0, a1, a2;
  if (type === "bp") { b0 = a; b1 = 0; b2 = -a; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  else if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  else { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const f = (x) => { const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  f.set = (nf) => { const nb = biquad(type, nf, q); f._n = nb; };
  return f;
}

// ---------------------------------------------------------------- music
const BEAT = 0.5; // 120 bpm
// Rhodes-ish tone: sine + soft 2nd/3rd partials, bell-like attack
function epiano(t0, midi, dur, vel, pan) {
  const f = mtof(midi), s0 = Math.round(t0 * SR), n = Math.round((dur + 1.2) * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 2.2) * (t < dur ? 1 : Math.exp(-(t - dur) * 6));
    const bell = Math.exp(-t * 14);
    const v = Math.sin(2 * Math.PI * f * t + 0.6 * bell * Math.sin(2 * Math.PI * f * 7 * t))
      + 0.18 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 4);
    add(s0 + k, v * env * vel, pan, 0.35);
  }
}
function pad(t0, midis, dur, vel, cutoff) {
  const s0 = Math.round(t0 * SR), n = Math.round((dur + 1.5) * SR);
  const lp = biquad("lp", cutoff, 0.7), lp2 = biquad("lp", cutoff, 0.7);
  const ph = midis.map(() => [rand(), rand()]);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = Math.min(1, t / 0.6) * (t < dur ? 1 : Math.exp(-(t - dur) * 3));
    let v = 0;
    midis.forEach((m, j) => {
      const f = mtof(m);
      // two detuned saws, softened
      for (let d = 0; d < 2; d++) {
        const ff = f * (d ? 1.004 : 0.996);
        const p = (ph[j][d] + ff * t) % 1;
        v += (2 * p - 1) * 0.5;
      }
    });
    v = lp2(lp(v)) / midis.length;
    add(s0 + k, v * env * vel, Math.sin(t * 0.7) * 0.3, 0.6);
  }
}
function kick(t0, vel) {
  const s0 = Math.round(t0 * SR), n = Math.round(0.4 * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = 48 + 90 * Math.exp(-t * 30);
    const v = Math.sin(2 * Math.PI * (48 * t + 90 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 9);
    add(s0 + k, v * vel * 0.9, 0, 0.02);
  }
}
function hat(t0, vel) {
  const s0 = Math.round(t0 * SR), n = Math.round(0.08 * SR), hp = biquad("hp", 7000, 0.7);
  for (let k = 0; k < n; k++) add(s0 + k, hp(noise()) * Math.exp(-k / SR * 60) * vel, 0.25, 0.1);
}

// harmony (MIDI): scene 1 hopeful, scene 2 suspended/minor, scene 3 lift, outro resolve
const chords = [
  [0.0, [53, 60, 64, 67, 72], 2.0],   // Fmaj9-ish
  [2.0, [57, 60, 64, 67], 1.0],       // Am7
  [3.0, [50, 57, 60, 65], 2.6],       // Dm7 (nobody understands)
  [5.6, [46, 53, 58, 62, 65], 2.0],   // Bbmaj7
  [7.6, [48, 55, 60, 64, 67], 1.2],   // C
  [8.8, [53, 60, 65, 69, 72, 76], 2.4], // F (logo)
];
chords.forEach(([t, ch, d], i) => pad(t, ch, d, i === 2 ? 0.16 : 0.2, i === 2 ? 900 : 1500 + i * 150));
// arpeggio plucks on eighths
const arpNotes = (ch) => ch.map((m) => m + 12);
chords.forEach(([t, ch, d], ci) => {
  const notes = arpNotes(ch);
  const steps = Math.floor(d / (BEAT / 2));
  for (let s = 0; s < steps; s++) {
    if (ci === 2 && s % 2) continue; // sparser in scene 2
    if (ci === 5 && s > 3) break;
    const m = notes[(s * 2 + ci) % notes.length];
    epiano(t + s * BEAT / 2, m, 0.18, 0.06 + (s % 4 === 0 ? 0.03 : 0), ((s % 3) - 1) * 0.4);
  }
});
// pulse in scene 3
for (let t = 5.75; t < 8.7; t += BEAT) { kick(t, 0.32); hat(t + BEAT / 2, 0.05); }

// ----------------------------------------------------------------- sfx
function key(t0, vel) {
  const s0 = Math.round(t0 * SR), n = Math.round(0.05 * SR);
  const bp = biquad("bp", 2400 + rand() * 1800, 1.4);
  const body = 180 + rand() * 80;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const v = bp(noise()) * Math.exp(-t * 180) * 1.6 + Math.sin(2 * Math.PI * body * t) * Math.exp(-t * 90) * 0.35;
    add(s0 + k, v * vel * 0.15, (rand() - 0.5) * 0.5, 0.08);
  }
}
function sweep(t0, dur, f0, f1, vel, pan0, pan1, curvePow = 1) {
  // noise through a state-variable band-pass whose centre glides f0 -> f1
  const s0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  let lo = 0, bd = 0;
  const q = 1.1;
  for (let k = 0; k < n; k++) {
    const u = k / n;
    const fc = f0 * Math.pow(f1 / f0, Math.pow(u, curvePow));
    const F = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR);
    const hi = noise() - lo - q * bd;
    bd += F * hi;
    lo += F * bd;
    const env = Math.sin(Math.PI * Math.pow(u, 0.8)) ** 2;
    add(s0 + k, bd * env * vel * 0.8, pan0 + (pan1 - pan0) * u, 0.4);
  }
}
function pop(t0) {
  const s0 = Math.round(t0 * SR), n = Math.round(0.18 * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR, f = 520 + 700 * Math.exp(-t * 40);
    ph += 2 * Math.PI * f / SR;
    add(s0 + k, Math.sin(ph) * Math.exp(-t * 22) * 0.28, 0.1, 0.3);
  }
}
function tick(t0) {
  const s0 = Math.round(t0 * SR), n = Math.round(0.04 * SR);
  for (let k = 0; k < n; k++) { const t = k / SR; add(s0 + k, Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 120) * 0.08, (rand() - 0.5), 0.3); }
}
function riser(t0, dur) {
  sweep(t0, dur, 400, 6000, 0.22, -0.3, 0.3, 1.6);
  const s0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const u = k / n, f = 220 * Math.pow(4, u * u);
    ph += 2 * Math.PI * f / SR;
    add(s0 + k, Math.sin(ph) * u * u * 0.07, 0, 0.5);
  }
}
function impact(t0) {
  const s0 = Math.round(t0 * SR), n = Math.round(1.6 * SR), lp = biquad("lp", 400, 0.8);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const boom = Math.sin(2 * Math.PI * (42 * t + 40 * (1 - Math.exp(-t * 18)) / 18)) * Math.exp(-t * 3.2);
    add(s0 + k, boom * 0.55 + lp(noise()) * Math.exp(-t * 25) * 0.5, 0, 0.15);
  }
}
function shimmer(t0) {
  [84, 88, 91, 96, 100].forEach((m, i) => epiano(t0 + i * 0.07, m, 0.3, 0.05, (i - 2) * 0.3));
}

for (const e of FILM.cues()) {
  const t = Math.max(0, fr(e.f));
  if (e.type === "key") key(t, e.v);
  else if (e.type === "swell") sweep(t, 2.2, 250, 2200, 0.2, -0.6, 0.6, 1.2);
  else if (e.type === "pop") pop(t);
  else if (e.type === "tick") tick(t);
  else if (e.type === "whoosh") sweep(t, 0.75, 300, 3800, 0.38, 0.8, -0.8, 0.8);
  else if (e.type === "riser") riser(t, 0.75);
  else if (e.type === "impact") impact(t);
  else if (e.type === "shimmer") shimmer(t);
}

// ------------------------------------------------------------- reverb + master
// Schroeder-style: parallel combs + allpasses on the send bus
const combs = [1557, 1617, 1491, 1422].map((d) => ({ b: new Float32Array(d), i: 0, fb: 0.8, lp: 0 }));
const aps = [225, 556, 441].map((d) => ({ b: new Float32Array(d), i: 0 }));
for (let k = 0; k < N; k++) {
  const x = busRev[k] * 0.25;
  let y = 0;
  combs.forEach((c, j) => {
    const o = c.b[c.i];
    c.lp = o * 0.7 + c.lp * 0.3;
    c.b[c.i] = x + c.lp * c.fb;
    c.i = (c.i + 1) % c.b.length;
    y += o;
  });
  aps.forEach((a) => {
    const o = a.b[a.i];
    const out = -0.5 * y + o;
    a.b[a.i] = y + 0.5 * out;
    a.i = (a.i + 1) % a.b.length;
    y = out;
  });
  L[k] += y * 0.9; R[k] += y * 0.9 * (k % 2 ? 1 : 0.97);
}
// fades + soft clip + normalize
let peak = 0;
for (let k = 0; k < N; k++) {
  const t = k / SR;
  const g = Math.min(1, t / 0.02) * Math.min(1, (DUR - t) / 0.6);
  L[k] = Math.tanh(L[k] * g * 1.2); R[k] = Math.tanh(R[k] * g * 1.2);
  peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k]));
}
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let k = 0; k < N; k++) {
  buf.writeInt16LE(Math.round(L[k] * norm * 32767), 44 + k * 4);
  buf.writeInt16LE(Math.round(R[k] * norm * 32767), 46 + k * 4);
}
fs.mkdirSync(path.join(root, "assets/audio"), { recursive: true });
fs.writeFileSync(path.join(root, "assets/audio/soundtrack.wav"), buf);
console.log("wrote assets/audio/soundtrack.wav", DUR.toFixed(2) + "s");
