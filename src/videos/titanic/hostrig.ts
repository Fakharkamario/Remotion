// The host puppet: the user's own artwork (public/titanic/host_*.png) brought to life without redrawing it.
//  - the card is a subdivided mesh bent per frame (deform): head tilt / nod about the neck, breathing, body sway and a
//    planted-feet lean, arm swings about the shoulders (three-quarter pose), squash-and-stretch pops on reactions;
//  - the texture gets per-frame face layers drawn on top of the art (drawFace): blinks (skin lids + lash line) and
//    lip-sync (an open mouth grown out of the drawn smile, driven by the real voice envelope, voicemap.ts MOUTH).
// Every landmark is in source-image pixels, measured on the cut-outs (shorts/titanic/cut_host.py output).
import { MOUTH, WORDS } from "./voicemap";

type P2 = [number, number];
type Eye = [number, number, number, number]; // cx, cy, w, h
type Mouth =
  | { kind: "line"; L: P2; C: P2; R: P2; lw: number } // drawn closed mouth: quadratic L -> C (control) -> R
  | { kind: "open"; c: P2; w: number; h: number }; // drawn open mouth: ellipse box
export type Rig = {
  eyes: Eye[]; mouth?: Mouth; neck: P2; band: [number, number]; // head weight 1 above band[0], 0 below band[1]
  hip?: number; feet?: number; arms?: { a: P2; b: P2; r0: number; r1: number }[]; legs?: [number, number]; // jeans x-span, never moved by the arms
};
export const RIGS: Record<string, Rig> = {
  front: { eyes: [[315, 270, 76, 54], [457, 270, 76, 54]], mouth: { kind: "line", L: [335, 371], C: [388, 385], R: [441, 367], lw: 6 },
    neck: [385, 470], band: [430, 520], hip: 1250, feet: 2060 },
  three: { eyes: [[153, 292, 68, 60], [280, 269, 76, 56]], mouth: { kind: "line", L: [190, 395], C: [238, 391], R: [281, 372], lw: 6 },
    neck: [255, 480], band: [440, 530], hip: 1240, feet: 2080,
    arms: [{ a: [115, 600], b: [150, 1340], r0: 38, r1: 72 }, { a: [565, 590], b: [630, 1300], r0: 36, r1: 66 }], legs: [190, 560] },
  smile: { eyes: [[380, 536, 140, 96], [632, 505, 116, 92]], mouth: { kind: "line", L: [413, 715], C: [525, 756], R: [637, 705], lw: 7 },
    neck: [520, 930], band: [860, 990] },
  think: { eyes: [[342, 499, 126, 96], [587, 503, 134, 104]], mouth: { kind: "line", L: [372, 713], C: [443, 690], R: [514, 727], lw: 7 },
    neck: [470, 1080], band: [1000, 1180] },
  shock: { eyes: [[237, 536, 126, 112], [497, 534, 138, 124]], mouth: { kind: "open", c: [363, 763], w: 136, h: 58 },
    neck: [390, 960], band: [890, 1010] },
  laugh: { eyes: [], neck: [380, 950], band: [880, 1010] },
};

const SKIN = "#fbd5c1", INK = "#1d1416", MOUTH_IN = "#4a1a22", TONGUE = "#c95f6a", TEETH = "#fbf7f2";

// ---------------- pose ----------------
export type Pose = {
  head: number; hx: number; hy: number; // head roll (rad, + = clockwise on screen) and offset (px)
  body: number; lean: number; breath: number; // upper-body roll about the hips, whole-figure lean over planted feet, chest scale
  arms: number[]; sq: number; // arm rolls about the shoulders; squash-stretch (1 = none, >1 = tall)
  mouth: number; lid: number; // 0..1
};
export const REST: Pose = { head: 0, hx: 0, hy: 0, body: 0, lean: 0, breath: 0, arms: [0, 0], sq: 1, mouth: 0, lid: 0 };

const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rot = (x: number, y: number, cx: number, cy: number, a: number): P2 => {
  const c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};
const segDist = (x: number, y: number, a: P2, b: P2) => {
  const vx = b[0] - a[0], vy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - a[0] - t * vx, y - a[1] - t * vy);
};

/** source pixel -> posed pixel (cw x ch image) */
export const deform = (rig: Rig, P: Pose, cw: number, ch: number) => (x0: number, y0: number): P2 => {
  let x = x0, y = y0;
  // arms (inside the body's frame)
  rig.arms?.forEach((arm, i) => {
    const a = P.arms[i] ?? 0;
    if (!a) return;
    let w = sstep(arm.r1, arm.r0, segDist(x0, y0, arm.a, arm.b)) * sstep(arm.a[1] - 40, arm.a[1] + 60, y0);
    if (rig.legs && rig.hip && y0 > rig.hip - 30) w *= 1 - sstep(rig.legs[0] - 25, rig.legs[0] + 15, x0) * sstep(rig.legs[1] + 25, rig.legs[1] - 15, x0);
    if (w > 0) [x, y] = rot(x, y, arm.a[0], arm.a[1], a * w);
  });
  // head about the neck
  const wh = sstep(rig.band[1], rig.band[0], y0);
  if (wh > 0) { [x, y] = rot(x, y, rig.neck[0], rig.neck[1], P.head * wh); x += P.hx * wh; y += P.hy * wh; }
  // breathing: chest/shoulders stretch up from the hips (full body) or the bust's bottom edge
  const base = rig.hip ?? ch;
  const wu = rig.hip ? sstep(rig.hip + 60, rig.hip - 80, y0) : 1;
  y = base + (y - base) * (1 + P.breath * wu);
  // upper body sways about the hip (full body) / the bust's bottom centre
  if (P.body) [x, y] = rot(x, y, cw / 2, base, P.body * wu);
  // lean over planted feet: progressive bend, 0 at the soles
  if (P.lean && rig.feet) { const k = Math.max(0, (rig.feet - y0) / rig.feet); [x, y] = rot(x, y, cw / 2, rig.feet, P.lean * k); }
  // squash-and-stretch about the bottom centre
  if (P.sq !== 1) { const sy = P.sq, sx = 1 / Math.sqrt(sy), by = rig.feet ?? ch; x = cw / 2 + (x - cw / 2) * sx; y = by + (y - by) * sy; }
  return [x, y];
};

// ---------------- face layers ----------------
const qd = (g: CanvasRenderingContext2D, L: P2, C: P2, R: P2) => { g.moveTo(L[0], L[1]); g.quadraticCurveTo(C[0], C[1], R[0], R[1]); };
const lerp = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const drawLid = (g: CanvasRenderingContext2D, [cx, cy, w, h]: Eye, b: number) => {
  if (b <= 0) return;
  const rx = w * 0.6, ry = h * 0.62, top = cy - ry, shut = b >= 1, edge = shut ? cy + ry + 2 : top + 2 * ry * 0.55;
  g.save();
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = SKIN; g.fillRect(cx - rx - 2, top - 2, 2 * rx + 4, edge - top + 2);
  g.restore();
  // lash line: the lid edge when half shut, a downward arc across the middle when shut
  const ly = shut ? cy + h * 0.05 : edge, half = (shut ? rx * 0.92 : rx * Math.sqrt(Math.max(0, 1 - ((edge - cy) / ry) ** 2))) * 0.97;
  g.save(); g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = Math.max(3, h * 0.09);
  g.beginPath(); g.moveTo(cx - half, ly - (shut ? h * 0.06 : 0)); g.quadraticCurveTo(cx, ly + (shut ? h * 0.2 : h * 0.06), cx + half, ly - (shut ? h * 0.06 : 0)); g.stroke();
  g.restore();
};

const drawMouth = (g: CanvasRenderingContext2D, m: Mouth, o: number) => {
  if (m.kind === "line") {
    if (o < 0.08) return;
    const { L, C, R, lw } = m, wdt = Math.hypot(R[0] - L[0], R[1] - L[1]), D = wdt * 0.26 * o;
    // the opening hangs from the drawn line: top lip = the line lifted a touch, bottom = a deeper curve
    const nx = 0, ny = 1, Lb = L, Rb = R, Ct: P2 = [C[0], C[1] - D * 0.25], Cb: P2 = [C[0] + nx * D * 2, C[1] + ny * D * 2];
    g.save();
    g.beginPath(); qd(g, L, Ct, R); g.quadraticCurveTo(Cb[0], Cb[1], Lb[0], Lb[1]); g.closePath();
    g.fillStyle = MOUTH_IN; g.fill();
    g.save(); g.clip();
    // tongue at the bottom, a strip of top teeth when wide open
    const mid = lerp(L, R, 0.5), bot: P2 = [mid[0] * 0.5 + Cb[0] * 0.5, (mid[1] + Cb[1]) / 2 + D * 0.55];
    g.fillStyle = TONGUE; g.beginPath(); g.ellipse(bot[0], bot[1], wdt * 0.3, D * 0.55, 0, 0, Math.PI * 2); g.fill();
    if (o > 0.35) { g.fillStyle = TEETH; g.beginPath(); qd(g, L, Ct, R); qd(g, R, [Ct[0], Ct[1] + D * 0.38], L); g.fill(); }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round";
    g.beginPath(); qd(g, L, Ct, R); g.quadraticCurveTo(Cb[0], Cb[1], Lb[0], Lb[1]); g.closePath(); g.stroke();
    void Rb;
    g.restore();
  } else {
    const { c, w, h } = m, sy = 0.45 + 0.85 * o, sx = 0.86 + 0.16 * o;
    g.save();
    // paint the drawn mouth out with skin (soft edge), then draw the posed one
    const gr = g.createRadialGradient(c[0], c[1], 0, c[0], c[1], w * 0.78);
    gr.addColorStop(0, SKIN); gr.addColorStop(0.75, SKIN); gr.addColorStop(1, "rgba(251,213,193,0)");
    g.fillStyle = gr; g.beginPath(); g.ellipse(c[0], c[1], w * 0.78, h * 1.05, 0, 0, Math.PI * 2); g.fill();
    const rx = (w / 2) * sx, ry = (h / 2) * sy;
    g.beginPath(); g.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI * 2); g.fillStyle = MOUTH_IN; g.fill();
    g.save(); g.clip();
    g.fillStyle = TEETH; g.fillRect(c[0] - rx, c[1] - ry, 2 * rx, ry * 0.42);
    g.fillStyle = TONGUE; g.beginPath(); g.ellipse(c[0], c[1] + ry * 0.85, rx * 0.75, ry * 0.6, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
};

/** the artwork plus this frame's face layers */
export const drawFace = (g: CanvasRenderingContext2D, im: HTMLImageElement, rig: Rig, mouth: number, lid: number) => {
  g.drawImage(im, 0, 0);
  if (rig.mouth) drawMouth(g, rig.mouth, mouth);
  for (const e of rig.eyes) drawLid(g, e, lid);
};

// ---------------- acting ----------------
const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const LIDS = [0.5, 1, 1, 0.5];
/** blinks every 0.5-2.3 s in output frames; `force` = frames where a blink must start (expression swaps) */
export const hostLid = (F: number, force: number[] = []) => {
  for (const s of force) { const k = F - s; if (k >= 0 && k < 4) return LIDS[k]; }
  let s = 7;
  for (let n = 0; s <= F && n < 600; n++) {
    const k = F - s;
    if (k >= 0 && k < 4) return LIDS[k];
    s += Math.round(18 + 48 * hash(n, 77));
  }
  return 0;
};
export const mouthAt = (F: number) => MOUTH[Math.max(0, Math.min(MOUTH.length - 1, F))] ?? 0;
/** speech accents: a nod that lands on each stressed word (onset - 2 f), decaying over ~8 frames */
export const accent = (F: number) => {
  let a = 0;
  for (const [w, on] of WORDS) {
    const k = F - (on - 2);
    if (k < 0 || k > 14 || w.length < 4) continue;
    a += Math.sin(Math.min(1, k / 3) * Math.PI / 2) * Math.exp(-k / 5) * Math.min(1, w.length / 7);
  }
  return Math.min(1.4, a);
};
