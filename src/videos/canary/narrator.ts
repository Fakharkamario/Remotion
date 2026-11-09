// The Narrator (from the user's character sheet): curly brown top, big round eyes with black pupils, small hook
// nose, black hoodie with grey drawstrings + kangaroo pocket, grey jeans, dark shoes with light soles. Drawn in the
// same 600 x 1000 design space as toon.ts (soles at y = 975, ~1.83 m tall), with the same plum ink and painted
// crescent shading, so he sits in the 3D world like every other card. Poses: stand, pockets, point, explain, shrug,
// think, wave, walk; mouth openness drives lip-sync from the voice word timings.
import { Pen, INK, mul, shade, blobPts, thickAngle } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const CURL = "#4a3226", CURL_D = "#2f1f17", CURL_L = "#6a4a36";
const SKIN = "#f6dcc6", HOOD = "#2e2e34", HOOD_L = "#44444e", JEANS = "#6a6e78", SHOE = "#2a2c34", SOLE = "#8a8e98", STRING = "#c9c9d1";
const WHITE = "#ffffff", PUPIL = "#1d1416", MOUTH = "#5a1e28", TONGUE = "#e86e78";

export type NExpr = "neutral" | "smile" | "grin" | "laugh" | "talk" | "worried" | "shock" | "sad" | "serious" | "relief" | "whistle" | "think" | "squint";
export type NPose = "stand" | "pockets" | "point" | "explain" | "shrug" | "think" | "wave" | "walk" | "cheer";
export type NarrOpts = {
  expr?: NExpr; pose?: NPose; mouth?: number; look?: number; lookY?: number; blink?: number; tilt?: number; headTilt?: number;
  phase?: number; light?: number; facing?: number; k?: number; // k = pose blend 0..1 (gesture in/out)
};

const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const curve = (a: P2, k: P2, b: P2, n = 12): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, s = 1 - t; out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]); }
  return out;
};
const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** arm as [shoulder, elbow, hand] for each pose (side -1 = screen left arm, +1 = screen right arm) */
const armPose = (pose: NPose, side: number, ph: number): P2[] => {
  const S: P2 = [300 + side * 98, 452];
  const hang: P2[] = [S, [300 + side * 122, 560], [300 + side * 118, 668]];
  const pocket: P2[] = [S, [300 + side * 126, 548], [300 + side * 46, 632]];
  if (pose === "walk") {
    const sw = Math.sin(ph * Math.PI * 2) * side;
    return [S, [300 + side * 120 + 14 * sw, 560], [300 + side * 112 + 34 * sw, 664 - 6 * Math.abs(sw)]];
  }
  if (pose === "pockets" || pose === "stand") return pose === "pockets" ? pocket : hang;
  if (pose === "shrug") return [S, [300 + side * 175, 520], [300 + side * 205, 430]];
  if (pose === "cheer") return [S, [300 + side * 165, 380], [300 + side * 175, 270]];
  if (side < 0) return pose === "explain" || pose === "point" || pose === "wave" ? pocket : hang;
  switch (pose) {
    case "point": return [S, [478, 432], [548, 360]];
    case "explain": return [S, [452, 548], [528, 512]];
    case "think": return [S, [452, 552], [356, 432]];
    case "wave": return [S, [470, 372], [492, 262]];
  }
  return hang;
};

export const drawNarrator = (p: Pen, o: NarrOpts) => {
  const { expr = "neutral", pose = "stand", mouth: mo = -1, look = 0, lookY = 0, blink = 0, tilt = 0, headTilt = 0, phase = 0,
    light = rad(-120), facing = 0, k = 1 } = o;
  const thick = thickAngle(light), two = Math.PI * 2;
  const walk = pose === "walk";
  const bob = walk ? 9 * Math.cos(2 * two * phase) : 0;
  const hipY = 690 + bob;
  // ---- legs + shoes ----
  p.rot = null;
  const legCol = JEANS;
  for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
    const up = walk ? Math.max(0, Math.sin(two * (phase + ph))) * 38 : 0;
    const fwd = walk ? Math.cos(two * (phase + ph)) * 10 : 0;
    const h: P2 = [300 + side * 34, hipY], f: P2 = [300 + side * 40 + fwd, 948 - up];
    const kn: P2 = [(h[0] + f[0]) / 2 + side * 3, (h[1] + f[1]) / 2 - up * 0.2];
    p.line(curve(h, kn, f), legCol, 34);
    p.stroke(curve([h[0] + side * 9, h[1] + 10], [kn[0] + side * 9, kn[1]], [f[0] + side * 8, f[1] - 30]), 7, mul(JEANS, [0.8, 0.8, 0.86]));
    // shoe: capsule pointing outwards a little, light sole strip
    const sx = f[0] + side * 12, sy = f[1] + 14;
    p.poly(rrectP(sx - 46, sy - 22, sx + 46, sy + 18, 18), SHOE, 9);
    p.poly(rrectP(sx - 42, sy + 4, sx + 42, sy + 15, 6), SOLE, 0);
    p.stroke([[sx - 44, sy + 3], [sx + 44, sy + 3]], 4, INK);
  }
  // ---- upper body (tilts about the hips) ----
  p.rot = tilt ? [rad(tilt), 300, hipY] : null;
  const arms = [-1, 1].map((side) => {
    const a = armPose(pose, side, phase), b = armPose(walk ? "walk" : "stand", side, phase);
    return k >= 1 ? a : a.map((q, i) => lerp2(b[i], q, k));
  });
  // hood behind the neck
  p.ell(300, 432, 118, 44, HOOD_L, 9);
  // arms first when they sit behind the body (hang / walk), else after
  const front = (side: number) => pose !== "stand" && pose !== "walk" && !(side < 0 && (pose === "point" || pose === "think"));
  const drawArm = (a: P2[], side: number) => {
    const pts = curve(a[0], a[1], a[2]);
    p.line(pts, HOOD, 36);
    p.stroke(curve([a[0][0], a[0][1] + 8], [a[1][0] - side * 6, a[1][1]], [a[2][0] - side * 4, a[2][1] - 14]), 6, HOOD_L);
    const [hx, hy] = a[2];
    const inPocket = pose === "pockets" || ((pose === "explain" || pose === "point" || pose === "wave" || pose === "think") && side < 0 && k > 0.5);
    if (!inPocket) {
      p.ell(hx, hy, 19, 19, SKIN, 8);
      if (pose === "point" && side > 0) p.line([[hx + 6, hy - 8], [hx + 30, hy - 32]], SKIN, 9);
      if ((pose === "explain" || pose === "shrug") && (side > 0 || pose === "shrug")) p.arc(hx, hy - 4, 12, 7, 200, 340, 4);
    }
  };
  for (const side of [-1, 1]) if (!front(side)) drawArm(arms[(side + 1) / 2], side);
  // hoodie body: rounded, wider at the hem
  const T = { a: 112, b: 148, nTop: 2.2, nBot: 3.2, egg: 0.16, asym: 0.03 * facing, rot: 0, noise: 0.004, seed: 41 };
  const tp = blobPts(300, hipY - 140, T);
  p.gradFill(tp, HOOD_L, mul(HOOD, [0.78, 0.78, 0.86]), light, 0.15);
  p.clip(tp, () => {
    // kangaroo pocket + hem band
    p.poly(rrectP(232, hipY - 108, 368, hipY - 26, 24), mul(HOOD, [0.92, 0.92, 0.98]), 6);
    p.stroke([[150, hipY - 6], [450, hipY - 6]], 6, INK);
    // seams: centre zip-less front fold
    p.stroke([[300 + 4 * facing, 470], [300 + 4 * facing, hipY - 112]], 3, mul(HOOD, [0.7, 0.7, 0.76]));
  });
  p.inkRing(tp, 10, thick);
  // neck V + drawstrings
  p.poly([[268, 420], [332, 420], [300, 458]], mul(SKIN, [0.86, 0.78, 0.76]), 6);
  const sw = walk ? 5 * Math.sin(two * phase) : 0;
  for (const s of [-1, 1]) {
    const a: P2 = [300 + s * 20, 438], b: P2 = [300 + s * 24 + sw, 520];
    p.stroke([a, b], 10, INK); p.stroke([a, b], 6, STRING);
    p.ell(b[0], b[1] + 6, 7, 9, STRING, 4);
  }
  for (const side of [-1, 1]) if (front(side)) drawArm(arms[(side + 1) / 2], side);
  // ---- head (tilts about the chin) ----
  const [cx, cy] = p.P(300, 410);
  const A = (tilt + headTilt) * Math.PI / 180;
  p.rot = A ? [A, 300, 410, cx - 300, cy - 410] : null;
  const hcx = 300 + 4 * facing, hcy = 300;
  // hair mass behind the head
  const back = curlRing(hcx, hcy - 40, 140, 104, 13, 44, 1, 165, 375);
  for (const [x, y, r] of back) p.ell(x, y, r + 6, r + 6, INK, 0);
  for (const [x, y, r] of back) p.ell(x, y, r, r, CURL, 0);
  // face: a round bean (wide jaw) with the painted crescent away from the light
  const H = { a: 120, b: 114, nTop: 2.0, nBot: 2.25, egg: -0.06, asym: 0.03 * facing, rot: 0, noise: 0.004, seed: 77 };
  const hp = blobPts(hcx, hcy + 4, H);
  p.shadedFill(hp, SKIN, mul(SKIN, [0.95, 0.84, 0.82]), light, H.a);
  p.inkRing(hp, 10, thick);
  // fringe curls over the forehead + crown curls (in front of the face outline)
  const top = curlRing(hcx, hcy - 34, 126, 92, 11, 40, 2, 205, 335);
  const fringe: [number, number, number][] = [[-86, -80, 34], [-46, -94, 36], [-6, -98, 36], [34, -94, 36], [74, -82, 34], [104, -58, 30], [-112, -54, 30]];
  const all = [...top, ...fringe.map(([x, y, r]) => [hcx + x + 6 * facing, hcy + y, r] as [number, number, number])];
  for (const [x, y, r] of all) p.ell(x, y, r + 5, r + 5, INK, 0);
  all.forEach(([x, y, r], i) => {
    p.shadedFill(ellP(x, y, r, r), CURL, CURL_D, light, r, 0.4);
    // curl swirl
    const pts: P2[] = [];
    const a0 = rnd(i) * two;
    for (let t = 0; t < 14; t++) { const rr = r * (0.18 + 0.045 * t); pts.push([x + Math.cos(a0 + t * 0.62) * rr, y + Math.sin(a0 + t * 0.62) * rr]); }
    p.stroke(pts, 4.5, CURL_D);
    p.stroke([[x - r * 0.35, y - r * 0.5], [x - r * 0.05, y - r * 0.62]], 4, CURL_L);
  });
  face(p, hcx + 8 * facing, hcy + 26, expr, mo, look, lookY, blink);
  p.rot = null;
};

const ellP = (cx: number, cy: number, rx: number, ry: number, n = 36): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
};
const rrectP = (x0: number, y0: number, x1: number, y1: number, r: number, n = 6): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};
/** curls around an elliptic arc (degrees, canvas angles: 180 = left, 270 = top) */
const curlRing = (cx: number, cy: number, rx: number, ry: number, n: number, r: number, seed: number, a0 = 150, a1 = 390): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / (n - 1));
    out.push([cx + rx * Math.cos(a) + 6 * (rnd(seed * 31 + i) - 0.5), cy + ry * Math.sin(a) + 6 * (rnd(seed * 17 + i) - 0.5), r * (0.85 + 0.3 * rnd(seed * 7 + i))]);
  }
  return out;
};

/** the sheet's face: big round white eyes with black pupils, short thick brows, hook nose, simple mouth */
const face = (p: Pen, cx: number, cy: number, expr: NExpr, mo: number, look: number, lookY: number, blink: number) => {
  const ey = cy - 6, ex = 44, R = 30;
  const eyeOpen = expr === "laugh" || expr === "relief" || expr === "squint" ? 0 : 1;
  const lid = Math.max(blink, expr === "sad" || expr === "serious" ? 0.35 : expr === "worried" ? 0.15 : 0);
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (!eyeOpen || blink >= 1) {
      if (expr === "laugh") p.stroke([[x + s * 12, ey - 12], [x - s * 10, ey], [x + s * 12, ey + 12]], 7);
      else if (expr === "squint") p.stroke([[x - 18, ey + 2], [x + 18, ey + 2]], 7);
      else p.arc(x, ey + 8, 17, 12, 200, 340, 7);
    } else {
      const r = expr === "shock" ? R * 1.18 : R;
      p.ell(x, ey, r, r, WHITE, 7);
      const pr = expr === "shock" ? 10 : 15;
      p.dot(x + look * 9 + (expr === "think" ? 8 : 0), ey + lookY * 7 + (expr === "think" ? -7 : 2), pr, PUPIL);
      if (lid > 0) {
        p.clip(ellP(x, ey, r - 2, r - 2), () => p.poly([[x - r - 4, ey - r - 4], [x + r + 4, ey - r - 4], [x + r + 4, ey - r + 2 * r * lid], [x - r - 4, ey - r + 2 * r * lid]], SKIN, 0));
        p.stroke([[x - r, ey - r + 2 * r * lid], [x + r, ey - r + 2 * r * lid]], 6);
        p.ell(x, ey, r, r, null, 7);
      }
    }
    // brows: short thick dashes; angle by mood
    const by = ey - 46;
    const tiltIn = expr === "worried" || expr === "sad" ? -9 : expr === "serious" || expr === "squint" ? 8 : expr === "shock" ? -4 : expr === "think" ? (s > 0 ? -8 : 3) : 0;
    const lift = expr === "shock" ? -10 : expr === "worried" ? -3 : 0;
    p.stroke([[x - s * 4, by + lift + tiltIn], [x + s * 22, by + lift - tiltIn * 0.4]], 10);
  }
  // hook nose
  p.stroke([[cx + 2, cy + 6], [cx - 8, cy + 24], [cx + 6, cy + 28]], 6);
  // mouth
  const my = cy + 52;
  const open = mo >= 0 ? mo : expr === "talk" ? 0.5 : -1;
  const wavy = (w: number) => { const s: P2[] = []; for (let i = 0; i <= 10; i++) s.push([cx - w + (2 * w * i) / 10, my + 4 * Math.sin(i * 1.6)]); p.stroke(s, 5.5); };
  if (expr === "whistle") { p.ell(cx + 4, my, 9, 11, MOUTH, 6); return; }
  if (open > 0.05) {
    const w = 15 + 8 * open, h = 6 + 18 * open;
    p.ell(cx, my - 2, w, h, MOUTH, 6, 0, 360);
    if (open > 0.4) p.ell(cx + 3, my + h * 0.45, w * 0.5, h * 0.35, TONGUE, 0);
    p.ell(cx, my - 2, w, h, null, 6);
    return;
  }
  switch (expr) {
    case "smile": case "relief": p.arc(cx, my - 14, 26, 16, 25, 155, 6.5); break;
    case "grin": case "laugh": {
      const h = expr === "laugh" ? 30 : 24;
      p.ell(cx, my - 8, 30, h, MOUTH, 0, 0, 180);
      p.clip(ellP(cx, my - 8, 30, h), () => p.poly([[cx - 32, my - 8], [cx + 32, my - 8], [cx + 32, my + 2], [cx - 32, my + 2]], WHITE, 0));
      if (expr === "laugh") p.clip(ellP(cx, my - 8, 30, h), () => p.ell(cx + 4, my + h - 10, 14, 9, TONGUE, 0));
      p.ell(cx, my - 8, 30, h, null, 6, 0, 180);
      break;
    }
    case "worried": wavy(18); break;
    case "sad": case "serious": p.arc(cx, my + 10, 20, 10, 205, 335, 6); break;
    case "shock": p.ell(cx, my + 4, 16, 22, MOUTH, 6); break;
    case "think": p.stroke([[cx - 10, my + 2], [cx + 14, my - 4]], 6); break;
    case "squint": p.stroke([[cx - 14, my], [cx + 14, my]], 6); break;
    default: p.arc(cx, my - 8, 16, 9, 30, 150, 6);
  }
};
export { shade };
