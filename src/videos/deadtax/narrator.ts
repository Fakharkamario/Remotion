// The Narrator (from the user's character sheet): round head, mop of dark-brown curls, big round eyes with dark
// pupils, short brows, little hooked nose, black hoodie (hood collar, grey drawstrings, kangaroo pocket), long grey
// jeans, dark shoes with grey soles. Drawn on the cast's 600 x 1000 design canvas (soles at y = 975), front view,
// lit like every other card (painted crescent away from the key light + thick-thin plum ink).
// Expressions follow the sheet; `talk` (0..3, lip sync) opens the mouth on top of any expression.
import { Pen, INK, mul, curve, ellPts, rrect } from "./toon";

type P2 = [number, number];
const SKIN = "#f6dcc6", HAIR = "#4a3226", HAIR_D = "#2c1b13", HAIR_L = "#6e4a36";
const HOOD = "#3a3a44", HOOD_D = "#24242a", JEANS = "#6a6e78", SHOE = "#2a2c34", SOLE = "#8a8e98";
const STRING = "#b9bdc6", MOUTH = "#5a1e28", TONGUE = "#e86e78", WHITE = "#ffffff", PUPIL = "#24160f";
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const hash = (i: number, k: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

export type NExpr = "neutral" | "smile" | "laugh" | "talking" | "thinking" | "worried" | "sad" | "shocked" | "squint" | "grin"
  | "dazed" | "content" | "nervous" | "relieved" | "serious";
export type NPose = "pockets" | "point" | "think" | "shrug" | "scratch" | "explain" | "walk" | "phone" | "facepalm" | "wave" | "up";
export type NarrOpts = {
  expr?: NExpr; talk?: number; pose?: NPose; k?: number; phase?: number; blink?: number; look?: number; lookY?: number;
  headTilt?: number; lean?: number; light?: number; breath?: number;
};

type Face = { eye: "open" | "big" | "happy" | "squeeze" | "spiral" | "small"; lid: number; brow: [number, number]; mouth: "line" | "smile" | "laugh" | "o" | "slant" | "wave" | "frown" | "O" | "grin" | "smileS"; sweat?: boolean; browUp?: number };
// brows [inner, outer] offsets (+ = down) in design units
const FACES: Record<NExpr, Face> = {
  neutral: { eye: "open", lid: 0.32, brow: [0, 0], mouth: "line" },
  smile: { eye: "open", lid: 0.08, brow: [-2, 0], mouth: "smile" },
  laugh: { eye: "squeeze", lid: 0, brow: [-6, -4], mouth: "laugh" },
  talking: { eye: "open", lid: 0.05, brow: [-3, 0], mouth: "o" },
  thinking: { eye: "open", lid: 0.1, brow: [4, -2], mouth: "slant", browUp: 1 },
  worried: { eye: "open", lid: 0, brow: [-9, 4], mouth: "wave" },
  sad: { eye: "open", lid: 0.4, brow: [-8, 5], mouth: "frown" },
  shocked: { eye: "big", lid: 0, brow: [-14, -12], mouth: "O" },
  squint: { eye: "open", lid: 0.58, brow: [8, -1], mouth: "line" },
  grin: { eye: "happy", lid: 0, brow: [-4, -3], mouth: "grin" },
  dazed: { eye: "spiral", lid: 0, brow: [-6, 4], mouth: "wave" },
  content: { eye: "happy", lid: 0, brow: [-2, 0], mouth: "smile" },
  nervous: { eye: "small", lid: 0, brow: [-9, 5], mouth: "wave", sweat: true },
  relieved: { eye: "happy", lid: 0, brow: [-5, 3], mouth: "smileS" },
  serious: { eye: "open", lid: 0.36, brow: [9, -2], mouth: "frown" },
};

// ---- geometry of the design (front view) ----
const SOLE_Y = 975, HIP = 652;
const HC: P2 = [300, 262], HR = 122;           // head centre / radius
const TC: P2 = [300, 528], TA = 132, TB = 140;  // hoodie body
const SH = (s: number): P2 => [300 + s * 112, 418]; // shoulders

/** egg-shaped hoodie body (wider at the hem), clockwise on screen */
const hoodiePts = (): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const wide = s > 0 ? 1.04 : 0.86 + 0.14 * (1 - Math.abs(s));
    out.push([TC[0] + TA * c * wide, TC[1] + TB * s * (s > 0 ? 0.98 : 1)]);
  }
  return out;
};

/** the mop of curls: seeded circles over the crown, sides and a fringe across the forehead */
const CURLS: [number, number, number][] = (() => {
  const c: [number, number, number][] = [];
  for (let i = 0; i <= 13; i++) { // outer rim from the left ear over the crown to the right ear
    const a = rad(168 + (204 * i) / 13), r = 36 + 10 * hash(i, 1);
    c.push([HC[0] + Math.cos(a) * (HR * 0.97), HC[1] + Math.sin(a) * (HR * 0.95) - 10, r]);
  }
  for (let i = 0; i < 9; i++) { // second ring
    const a = rad(190 + (160 * i) / 8);
    c.push([HC[0] + Math.cos(a) * HR * 0.6, HC[1] + Math.sin(a) * HR * 0.72 - 22, 38 + 8 * hash(i, 2)]);
  }
  for (let i = 0; i < 6; i++) c.push([HC[0] - 92 + i * 37, HC[1] - 74 + 9 * hash(i, 3) + (i === 0 || i === 5 ? 14 : 0), 28 + 6 * hash(i, 4)]); // fringe
  c.push([HC[0], HC[1] - 120, 42], [HC[0] - 50, HC[1] - 112, 38], [HC[0] + 52, HC[1] - 110, 38]);
  return c;
})();

const drawHair = (p: Pen, light: number) => {
  const g = p.g;
  // ink outline of the union: every circle stroked wide first, then all filled without stroke
  for (const [x, y, r] of CURLS) p.ell(x, y, r + 6.5, r + 6.5, INK, 0);
  const lx = Math.cos(light), ly = Math.sin(light);
  for (const [x, y, r] of CURLS) {
    const gr = g.createRadialGradient(...p.P(x + lx * r * 0.4, y + ly * r * 0.4), r * 0.2, ...p.P(x, y), r * 1.15);
    gr.addColorStop(0, HAIR_L); gr.addColorStop(0.55, HAIR); gr.addColorStop(1, mul(HAIR, [0.8, 0.8, 0.82]));
    p.path(ellPts(x, y, r, r, 0, 360, 0, 28), true); g.fillStyle = gr; g.fill();
  }
  // curl spirals + a dark crease line under each lobe
  CURLS.forEach(([x, y, r], i) => {
    if (i % 2 && i < 23) return;
    const pts: P2[] = [], a0 = hash(i, 5) * 6.28;
    for (let t = 0; t < 12; t++) { const k = t / 11; pts.push([x + Math.cos(a0 + k * 5.2) * r * (0.62 - 0.4 * k), y + Math.sin(a0 + k * 5.2) * r * (0.62 - 0.4 * k)]); }
    p.stroke(pts, 4, "#352219");
  });
};

const eyeAt = (p: Pen, f: Face, x: number, y: number, side: number, look: number, lookY: number, blink: number) => {
  const lid = clamp(Math.max(f.lid, blink), 0, 1);
  if (f.eye === "happy") { p.arc(x, y + 6, 20, 15, 200, 340, 7.5); return; }
  if (f.eye === "squeeze") { p.stroke([[x + side * 14, y - 13], [x - side * 12, y], [x + side * 14, y + 13]], 7.5); return; }
  if (f.eye === "spiral") {
    p.ell(x, y, 25, 25, WHITE, 6.5);
    const s: P2[] = []; for (let t = 1; t < 26; t++) s.push([x + Math.cos(t * 0.75 * side) * t * 0.82, y + Math.sin(t * 0.75 * side) * t * 0.82]);
    p.stroke(s, 3.6); return;
  }
  if (lid >= 0.95) { p.stroke([[x - 22, y + 2], [x + 22, y + 2]], 7); return; }
  const R = f.eye === "big" ? 31 : 25, pr = f.eye === "big" ? 8.5 : f.eye === "small" ? 8 : 12.5;
  p.ell(x, y, R, R, WHITE, 0);
  p.clip(ellPts(x, y, R, R), () => {
    p.dot(x + look * 9 + side * 1.5, y + 3 + lookY * 7, pr, PUPIL);
    if (lid > 0) { // upper lid in skin, straight edge
      const ly = y - R + 2 * R * lid;
      p.poly([[x - R - 2, y - R - 2], [x + R + 2, y - R - 2], [x + R + 2, ly], [x - R - 2, ly]], mul(SKIN, [0.94, 0.86, 0.84]), 0);
      p.stroke([[x - R, ly], [x + R, ly]], 6);
    }
  });
  p.ell(x, y, R, R, null, 6.8);
};

const mouthAt = (p: Pen, kind: Face["mouth"], talk: number, mx: number, my: number) => {
  if (talk > 0) { // lip sync: open oval, width follows the expression's smile
    const happy = kind === "smile" || kind === "grin" || kind === "laugh" || kind === "smileS";
    const rx = (happy ? 20 : 13) + talk * 3, ry = [0, 6, 11, 16][Math.round(clamp(talk, 0, 3))];
    p.ell(mx, my + ry * 0.35, rx, ry, MOUTH, 0);
    if (talk >= 2) p.clip(ellPts(mx, my + ry * 0.35, rx, ry), () => p.ell(mx + 2, my + ry * 1.05, rx * 0.55, ry * 0.5, TONGUE, 0));
    p.ell(mx, my + ry * 0.35, rx, ry, null, 5.5);
    return;
  }
  switch (kind) {
    case "line": p.stroke([[mx - 15, my], [mx + 14, my - 1.5]], 6.5); break;
    case "smile": p.arc(mx, my - 9, 24, 13, 25, 155, 6.8); break;
    case "smileS": p.arc(mx, my - 6, 17, 9, 25, 155, 6.5); break;
    case "slant": p.stroke([[mx - 14, my + 2], [mx + 15, my - 5]], 6.5); break;
    case "frown": p.arc(mx, my + 9, 17, 8, 205, 335, 6.5); break;
    case "o": p.ell(mx, my + 2, 9, 11, MOUTH, 5.5); break;
    case "O": p.ell(mx, my + 8, 18, 27, MOUTH, 6.5); p.clip(ellPts(mx, my + 8, 18, 27), () => p.ell(mx, my + 30, 11, 9, TONGUE, 0)); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 14; i++) s.push([mx - 19 + i * 2.7, my + 3.5 * Math.sin(i * 1.4)]); p.stroke(s, 5.5); break; }
    case "grin": case "laugh": {
      const rx = kind === "laugh" ? 30 : 27, ry = kind === "laugh" ? 26 : 17;
      const pts = ellPts(mx, my - 4, rx, ry, 0, 180);
      p.poly(pts, MOUTH, 0);
      p.clip(pts, () => { p.poly([[mx - rx, my - 6], [mx + rx, my - 6], [mx + rx, my + 2], [mx - rx, my + 2]], WHITE, 0); if (kind === "laugh") p.ell(mx + 3, my + ry * 0.75, rx * 0.5, ry * 0.4, TONGUE, 0); });
      p.poly(pts, null, 6);
      break;
    }
  }
};

/** arm: hoodie sleeve tube shoulder -> elbow -> wrist, round skin hand; pointing adds a finger */
const arm = (p: Pen, s: P2, e: P2, h: P2, finger?: P2, open = false, hide = false) => {
  const pts = curve(s, e, h, 12);
  if (hide) { // hand in the pocket: the sleeve ends at the pocket mouth, which is redrawn over it
    p.line(pts, HOOD, 34); p.stroke(pts.slice(2), 5, mul(HOOD, [1.35, 1.35, 1.35]));
    p.poly([[h[0] - 30, h[1] - 6], [h[0] + 30, h[1] - 6], [h[0] + 30, h[1] + 40], [h[0] - 30, h[1] + 40]], mul(HOOD, [0.82, 0.82, 0.86]), 0);
    p.stroke([[h[0] - 32, h[1] - 6], [h[0] + 32, h[1] - 6]], 5);
    return;
  }
  p.line(pts, HOOD, 34);
  p.stroke(curve(s, e, h, 12).slice(2), 5, mul(HOOD, [1.35, 1.35, 1.35])); // soft sleeve highlight
  p.ell(h[0], h[1], 21, 9, mul(HOOD, [0.75, 0.75, 0.8]), 4.5); // cuff
  if (finger) p.line([h, finger], SKIN, 11);
  if (open) { p.ell(h[0], h[1] - 10, 19, 22, SKIN, 6); p.stroke([[h[0] - 8, h[1] - 26], [h[0] - 8, h[1] - 12]], 3); }
  else p.ell(h[0], h[1] - 4, 18, 18, SKIN, 6);
};

/** arm placements per pose: [shoulder, elbow, hand, finger?, open?, front?] */
type ArmDef = { e: P2; h: P2; f?: P2; open?: boolean; front?: boolean; hide?: boolean; head?: boolean };
const lerp = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const POCKET = (s: number): ArmDef => ({ e: [300 + s * 150, 520], h: [300 + s * 70, 612], front: true, hide: true });
const HANG = (s: number, sw = 0): ArmDef => ({ e: [300 + s * 152, 540], h: [300 + s * 148 + sw * 30, 650] });
const armsFor = (pose: NPose, k: number, phase: number): [ArmDef, ArmDef] => {
  const K = clamp(k, 0, 1), mixA = (a: ArmDef, b: ArmDef): ArmDef => ({ ...b, hide: K < 0.12 && a.hide, e: lerp(a.e, b.e, K), h: lerp(a.h, b.h, K), f: b.f && lerp(b.h, b.f, Math.min(1, K * 1.4)) });
  const L = POCKET(-1), R = POCKET(1);
  switch (pose) {
    case "point": return [L, mixA(R, { e: [470, 360], h: [540, 262], f: [566, 226] })];
    case "up": return [L, mixA(R, { e: [440, 330], h: [452, 196], f: [456, 150] })];
    case "think": return [L, mixA(R, { e: [440, 560], h: [352, 372], front: true, head: true })];
    case "scratch": return [L, mixA(R, { e: [480, 360], h: [392, 166], head: true })];
    case "shrug": return [mixA(L, { e: [140, 545], h: [92, 452], open: true }), mixA(R, { e: [460, 545], h: [508, 452], open: true })];
    case "explain": return [L, mixA(R, { e: [440, 540], h: [520, 470], open: true })];
    case "phone": return [mixA(L, { e: [210, 560], h: [272, 478], front: true }), mixA(R, { e: [390, 560], h: [330, 478], front: true })];
    case "facepalm": return [L, mixA(R, { e: [430, 520], h: [318, 270], front: true, open: true, head: true })];
    case "wave": { const w = Math.sin(phase * Math.PI * 2) * 22; return [L, mixA(R, { e: [470, 380], h: [500 + w, 236], open: true })]; }
    case "walk": { const sw = Math.sin(phase * Math.PI * 2); return [HANG(-1, -sw), HANG(1, sw)]; }
    default: return [L, R];
  }
};

export const drawNarrator = (p: Pen, o: NarrOpts) => {
  const { expr = "neutral", talk = 0, pose = "pockets", k = 1, phase = 0, blink = 0, look = 0, lookY = 0, headTilt = 0, lean = 0,
    light = rad(-120), breath = 0 } = o;
  const g = p.g, F = FACES[expr];
  const walk = pose === "walk", two = Math.PI * 2;
  const bob = walk ? 9 * Math.cos(2 * two * phase) : 3 * Math.sin(breath * two);
  // ---- legs + shoes ----
  for (const [s, ph] of [[-1, 0], [1, 0.5]] as const) {
    const up = walk ? Math.max(0, Math.sin(two * (phase + ph))) * 34 : 0;
    const hx = 300 + s * 44, fx = 300 + s * 50, fy = SOLE_Y - 30 - up;
    p.line(curve([hx, HIP - 10 + bob], [hx + s * 4, (HIP + fy) / 2 - up * 0.2], [fx, fy], 8), JEANS, 32);
    const sh = rrect(fx - 30 - (s < 0 ? 12 : 0), fy - 2, fx + 30 + (s > 0 ? 12 : 0), fy + 28, 13);
    p.poly(sh, SHOE, 6);
    p.clip(sh, () => p.poly([[fx - 60, fy + 18], [fx + 60, fy + 18], [fx + 60, fy + 40], [fx - 60, fy + 40]], SOLE, 0));
    p.poly(sh, null, 6);
  }
  // ---- upper body (leans about the hips) ----
  g.save();
  g.translate(300, HIP + bob); g.rotate(rad(lean)); g.translate(-300, -HIP);
  const [aL, aR] = armsFor(pose, k, phase);
  for (const [a, s] of [[aL, -1], [aR, 1]] as const) if (!a.front && !a.head) arm(p, SH(s), a.e, a.h, a.f, a.open);
  const tp = hoodiePts();
  p.gradFill(tp, HOOD, mul(HOOD, [0.62, 0.62, 0.7]), light);
  p.clip(tp, () => {
    // kangaroo pocket + hem band
    const pk: P2[] = [[228, 584], [372, 584], [394, 662], [206, 662]];
    p.poly(pk, mul(HOOD, [0.82, 0.82, 0.86]), 5);
    p.stroke([[150, 642], [450, 642]], 4, HOOD_D);
  });
  p.inkRing(tp, 13, Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light)));
  // hood collar + neck opening + drawstrings
  p.ell(300, 400, 104, 30, mul(HOOD, [1.12, 1.12, 1.15]), 6);
  p.poly([[268, 392], [332, 392], [300, 436]], HOOD_D, 5);
  for (const s of [-1, 1]) {
    const a: P2 = [300 + s * 20, 404], b: P2 = [300 + s * 26, 486];
    p.line([a, b], STRING, 6);
    p.ell(b[0], b[1] + 6, 6, 9, STRING, 3.5);
  }
  if (pose === "phone" && k > 0.5) { // phone held up in both hands: a red chart falling off a cliff
    const ph = rrect(250, 380, 350, 500, 14);
    p.poly(ph, "#1c1c22", 6);
    const sc = rrect(260, 392, 340, 486, 6);
    p.poly(sc, "#e8f2ff", 0);
    p.stroke([[268, 410], [286, 418], [300, 412], [314, 446], [332, 474]], 6, "#d83a3a");
    p.poly([[324, 476], [338, 480], [336, 464]], "#d83a3a", 0);
  }
  for (const [a, s] of [[aL, -1], [aR, 1]] as const) if (a.front && !a.head) arm(p, SH(s), a.e, a.h, a.f, a.open, a.hide);
  // ---- head (tilts about the neck) ----
  g.save();
  g.translate(300, 384); g.rotate(rad(headTilt)); g.translate(-300, -384);
  const hp = ellPts(HC[0], HC[1], HR, HR * 0.97, 0, 360, 0, 72);
  p.shadedFill(hp, SKIN, mul(SKIN, [0.95, 0.85, 0.83]), light, HR);
  p.inkRing(hp, 13, Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light)));
  // face
  const ex = 46, ey = HC[1] + 22;
  for (const s of [-1, 1]) {
    const x = 300 + s * ex;
    eyeAt(p, F, x, ey, s, look, lookY, blink);
    const [bi, bo] = F.brow, up = F.browUp && s > 0 ? -10 : 0;
    p.stroke([[x - s * 15, ey - 46 + bi + up], [x + s * 17, ey - 46 + bo + up]], 9);
  }
  p.stroke([[307, 286], [294, 312], [309, 315]], 5.5); // nose
  mouthAt(p, F.mouth, talk, 302 + look * 4, HC[1] + 80);
  if (F.sweat) p.ell(408, 222, 8, 13, "#9fd4ff", 3.5);
  drawHair(p, light);
  g.restore();
  for (const [a, s] of [[aL, -1], [aR, 1]] as const) if (a.head) arm(p, SH(s), a.e, a.h, a.f, a.open || pose === "facepalm");
  g.restore();
};

/** canvas key for the pool: rounded options */
export const narrKey = (o: NarrOpts) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v));
