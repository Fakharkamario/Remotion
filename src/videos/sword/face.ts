// Faces painted on a canvas that wraps the front of a head sphere (equirectangular cap, see rig.ts FACE_CAP).
// Features follow the Narrator sheet: big round white eyes with a thick plum rim and large dark pupils, short thick
// brows, a small hooked nose line to the left of centre, a small curved mouth. One function draws every expression;
// `mouth` (0..1, from the voice envelope) opens the mouth for lip-sync on top of the expression.
export const INK = "#241726";
export type Expr =
  | "neutral" | "smile" | "grin" | "laugh" | "talk" | "thinking" | "worried" | "sad" | "shocked" | "squint"
  | "dazed" | "content" | "nervous" | "serious" | "determined" | "ouch";
export type FaceState = { expr: Expr; mouth: number; blink: number; look: [number, number]; glasses?: boolean; beard?: string | null; brow?: string };

// cap geometry (radians): longitude -A..A across the canvas, colatitude T0..T0+TL down the canvas
export const CAP_A = 1.25, CAP_T0 = 0.3, CAP_TL = 2.15;
export const FACE_W = 1024, FACE_H = Math.round((FACE_W * CAP_TL) / (2 * CAP_A));
const K = FACE_W / (2 * CAP_A); // px per radian
const X = (lon: number, lat: number) => FACE_W / 2 + (lon / Math.max(0.35, Math.cos(lat))) * K;
const Y = (lat: number) => (Math.PI / 2 - lat - CAP_T0) * K;

type Brow = { ang: number; up: number }; // ang > 0 = inner end raised (worried); up = raise (rad)
type EyeT = "open" | "happy" | "squint" | "x" | "spiral" | "half" | "wide";
type MouthT = "smile" | "flat" | "frown" | "wavy" | "o" | "grin" | "laugh" | "smallO" | "smirk";
type Def = { bl: Brow; br: Brow; eye: EyeT; pup: number; mouth: MouthT; sweat?: boolean; eyeL?: EyeT };
const DEFS: Record<Expr, Def> = {
  neutral: { bl: { ang: 0, up: 0 }, br: { ang: 0, up: 0 }, eye: "open", pup: 1, mouth: "flat" },
  smile: { bl: { ang: 0, up: 0.02 }, br: { ang: 0, up: 0.02 }, eye: "open", pup: 1, mouth: "smile" },
  grin: { bl: { ang: -0.1, up: 0.0 }, br: { ang: -0.1, up: 0.0 }, eye: "open", pup: 1, mouth: "grin" },
  laugh: { bl: { ang: 0.05, up: 0.04 }, br: { ang: 0.05, up: 0.04 }, eye: "x", pup: 1, mouth: "laugh" },
  talk: { bl: { ang: 0, up: 0.02 }, br: { ang: 0, up: 0.02 }, eye: "open", pup: 1, mouth: "smallO" },
  thinking: { bl: { ang: -0.15, up: -0.01 }, br: { ang: 0.1, up: 0.07 }, eye: "open", pup: 0.95, mouth: "smirk" },
  worried: { bl: { ang: 0.35, up: 0.04 }, br: { ang: 0.35, up: 0.04 }, eye: "open", pup: 0.85, mouth: "wavy" },
  sad: { bl: { ang: 0.45, up: 0.0 }, br: { ang: 0.45, up: 0.0 }, eye: "half", pup: 1, mouth: "frown" },
  shocked: { bl: { ang: 0.1, up: 0.1 }, br: { ang: 0.1, up: 0.1 }, eye: "wide", pup: 0.55, mouth: "o" },
  squint: { bl: { ang: -0.3, up: -0.04 }, br: { ang: -0.3, up: -0.04 }, eye: "squint", pup: 1, mouth: "flat" },
  dazed: { bl: { ang: 0.15, up: 0.02 }, br: { ang: 0.15, up: 0.02 }, eye: "spiral", pup: 1, mouth: "wavy" },
  content: { bl: { ang: 0.05, up: 0.03 }, br: { ang: 0.05, up: 0.03 }, eye: "happy", pup: 1, mouth: "smile" },
  nervous: { bl: { ang: 0.35, up: 0.05 }, br: { ang: 0.35, up: 0.05 }, eye: "open", pup: 0.75, mouth: "wavy", sweat: true },
  serious: { bl: { ang: -0.35, up: -0.03 }, br: { ang: -0.35, up: -0.03 }, eye: "half", pup: 1, mouth: "frown" },
  determined: { bl: { ang: -0.4, up: -0.02 }, br: { ang: -0.4, up: -0.02 }, eye: "open", pup: 1, mouth: "grin" },
  ouch: { bl: { ang: 0.3, up: 0.0 }, br: { ang: 0.3, up: 0.0 }, eye: "x", pup: 1, mouth: "wavy", sweat: true },
};

const EYE_LON = 0.3, EYE_LAT = -0.04, EYE_R = 0.165, BROW_LAT = 0.25, MOUTH_LAT = -0.42, NOSE_LAT = -0.2;

export function drawFace(g: CanvasRenderingContext2D, st: FaceState, skin: string) {
  const d = DEFS[st.expr];
  g.fillStyle = skin; g.fillRect(0, 0, FACE_W, FACE_H);
  // a soft cheek/chin form shade so the face is not a flat decal (the 3D light does the rest)
  const gr = g.createRadialGradient(X(0, -0.05), Y(-0.05), 20, X(0, -0.05), Y(-0.05), 0.95 * K * 1.3);
  gr.addColorStop(0, "rgba(255,255,255,0.05)"); gr.addColorStop(1, "rgba(150,90,80,0.0)");
  g.fillStyle = gr; g.fillRect(0, 0, FACE_W, FACE_H);
  g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = INK; g.fillStyle = INK;
  const lw = 0.03 * K; // main line weight
  // ---- beard (smith) ----
  if (st.beard) {
    g.fillStyle = st.beard;
    g.beginPath();
    g.moveTo(X(-0.75, -0.15), Y(-0.15));
    g.quadraticCurveTo(X(-0.7, -0.75), Y(-0.75), X(0, -0.85) , Y(-0.85));
    g.quadraticCurveTo(X(0.7, -0.75), Y(-0.75), X(0.75, -0.15), Y(-0.15));
    g.lineTo(X(0.55, -0.3), Y(-0.3)); g.quadraticCurveTo(X(0, -0.2), Y(-0.2), X(-0.55, -0.3), Y(-0.3));
    g.closePath(); g.fill();
    g.fillStyle = INK;
  }
  // ---- eyes ----
  const blink = Math.max(0, Math.min(1, st.blink));
  for (const s of [-1, 1]) {
    const cx = X(s * EYE_LON, EYE_LAT), cy = Y(EYE_LAT);
    const R = EYE_R * K * (d.eye === "wide" ? 1.1 : 1);
    const type = s < 0 && d.eyeL ? d.eyeL : d.eye;
    if (type === "happy" || (blink > 0.6 && type !== "x" && type !== "spiral")) {
      g.lineWidth = lw * 1.1; g.beginPath();
      if (type === "happy") g.arc(cx, cy + R * 0.35, R * 0.62, Math.PI * 1.15, Math.PI * 1.85);
      else { g.moveTo(cx - R * 0.75, cy + R * 0.1); g.quadraticCurveTo(cx, cy + R * 0.45, cx + R * 0.75, cy + R * 0.1); }
      g.stroke(); continue;
    }
    if (type === "x") {
      g.lineWidth = lw * 1.1; g.beginPath();
      const w = R * 0.6;
      g.moveTo(cx - s * w, cy - w * 0.7); g.lineTo(cx + s * w * 0.6, cy); g.lineTo(cx - s * w, cy + w * 0.7);
      g.stroke(); continue;
    }
    // white + rim
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    if (type === "spiral") {
      g.lineWidth = lw * 0.6; g.beginPath();
      for (let a = 0; a < 14; a += 0.2) { const rr = R * 0.08 + (a / 14) * R * 0.72; const px = cx + Math.cos(a * s) * rr, py = cy + Math.sin(a * s) * rr; if (a) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    } else {
      const pr = R * 0.52 * d.pup;
      const lx = st.look[0] * R * 0.38, ly = -st.look[1] * R * 0.32;
      g.fillStyle = "#3a2218"; g.beginPath(); g.arc(cx + lx, cy + ly, pr, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#140c0a"; g.beginPath(); g.arc(cx + lx, cy + ly, pr * 0.62, 0, Math.PI * 2); g.fill();
    }
    // lids: blink / half / squint cover the top of the eye in skin
    const lid = Math.max(blink / 0.6 * 0.55, type === "half" ? 0.38 : type === "squint" ? 0.55 : 0);
    if (lid > 0.01) {
      g.save(); g.beginPath(); g.arc(cx, cy, R + 1, 0, Math.PI * 2); g.clip();
      g.fillStyle = skin; g.fillRect(cx - R - 2, cy - R - 2, 2 * R + 4, lid * 2 * R + 2);
      if (type === "squint") g.fillRect(cx - R - 2, cy + R * 0.55, 2 * R + 4, R);
      g.restore();
      g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(cx - R * 0.98, cy - R + lid * 2 * R); g.lineTo(cx + R * 0.98, cy - R + lid * 2 * R); g.stroke();
      if (type === "squint") { g.beginPath(); g.moveTo(cx - R * 0.9, cy + R * 0.55); g.lineTo(cx + R * 0.9, cy + R * 0.55); g.stroke(); }
    }
    g.strokeStyle = INK; g.lineWidth = lw * 1.05; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    g.fillStyle = INK;
  }
  // ---- glasses (polisher) ----
  if (st.glasses) {
    g.strokeStyle = "#6b4a2a"; g.lineWidth = lw * 0.7;
    for (const s of [-1, 1]) { g.beginPath(); g.arc(X(s * EYE_LON, EYE_LAT), Y(EYE_LAT), EYE_R * K * 1.22, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(X(-0.12, EYE_LAT + 0.03), Y(EYE_LAT + 0.03)); g.quadraticCurveTo(X(0, EYE_LAT + 0.07), Y(EYE_LAT + 0.07), X(0.12, EYE_LAT + 0.03), Y(EYE_LAT + 0.03)); g.stroke();
    g.strokeStyle = INK;
  }
  // ---- brows ----
  g.strokeStyle = st.brow ?? INK;
  g.lineWidth = lw * 1.5;
  for (const s of [-1, 1]) {
    const b = s < 0 ? d.bl : d.br, cx = EYE_LON * s, lat = BROW_LAT + b.up;
    const half = 0.12;
    const inner = lat + b.ang * half, outer = lat - b.ang * half * 0.6;
    g.beginPath(); g.moveTo(X(cx - s * half, inner), Y(inner)); g.lineTo(X(cx + s * half, outer), Y(outer)); g.stroke();
  }
  g.strokeStyle = INK;
  // ---- nose: small hook, left of centre ----
  g.lineWidth = lw * 0.85; g.beginPath();
  g.moveTo(X(-0.02, NOSE_LAT + 0.07), Y(NOSE_LAT + 0.07)); g.lineTo(X(-0.08, NOSE_LAT - 0.02), Y(NOSE_LAT - 0.02)); g.lineTo(X(-0.01, NOSE_LAT - 0.04), Y(NOSE_LAT - 0.04));
  g.stroke();
  // ---- mouth ----
  const m = Math.max(0, Math.min(1, st.mouth));
  const my = Y(MOUTH_LAT), mx = X(0.02, MOUTH_LAT), W = 0.13 * K;
  g.lineWidth = lw * 0.95;
  let type = d.mouth;
  if (m > 0.08 && type !== "laugh" && type !== "o") {
    // talking: an open mouth whose shape keeps the expression (smile -> D, frown -> upside-down, else oval)
    const open = 0.03 * K + m * 0.13 * K;
    const smiley = type === "smile" || type === "grin" || type === "smirk";
    const frowny = type === "frown" || type === "wavy";
    const w = W * (0.55 + 0.25 * (1 - m)) * (smiley ? 1.15 : 1);
    g.fillStyle = "#6a1e2a"; g.beginPath();
    if (smiley) { g.moveTo(mx - w, my - open * 0.2); g.quadraticCurveTo(mx, my - open * 0.45, mx + w, my - open * 0.2); g.quadraticCurveTo(mx + w * 0.8, my + open * 1.1, mx, my + open * 1.1); g.quadraticCurveTo(mx - w * 0.8, my + open * 1.1, mx - w, my - open * 0.2); }
    else if (frowny) { g.moveTo(mx - w, my + open * 0.5); g.quadraticCurveTo(mx, my - open * 0.9, mx + w, my + open * 0.5); g.quadraticCurveTo(mx, my + open * 0.8, mx - w, my + open * 0.5); }
    else g.ellipse(mx, my, w * 0.8, open * 0.7 + 2, 0, 0, Math.PI * 2);
    g.fill();
    // tongue
    g.save(); g.clip(); g.fillStyle = "#e0566a"; g.beginPath(); g.ellipse(mx, my + open * 0.9, w * 0.6, open * 0.45, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.stroke();
  } else if (type === "smile") { g.beginPath(); g.moveTo(mx - W * 0.85, my - W * 0.18); g.quadraticCurveTo(mx, my + W * 0.55, mx + W * 0.85, my - W * 0.18); g.stroke(); }
  else if (type === "smirk") { g.beginPath(); g.moveTo(mx - W * 0.6, my + W * 0.05); g.quadraticCurveTo(mx + W * 0.2, my + W * 0.15, mx + W * 0.7, my - W * 0.15); g.stroke(); }
  else if (type === "flat") { g.beginPath(); g.moveTo(mx - W * 0.55, my); g.lineTo(mx + W * 0.55, my); g.stroke(); }
  else if (type === "frown") { g.beginPath(); g.moveTo(mx - W * 0.7, my + W * 0.2); g.quadraticCurveTo(mx, my - W * 0.35, mx + W * 0.7, my + W * 0.2); g.stroke(); }
  else if (type === "wavy") {
    g.beginPath(); const n = 4;
    for (let i = 0; i <= n * 4; i++) { const t = i / (n * 4); const px = mx - W * 0.7 + t * W * 1.4, py = my + Math.sin(t * n * Math.PI * 2) * W * 0.12; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke();
  } else if (type === "o" || type === "smallO") {
    const r = type === "o" ? W * (0.45 + 0.25 * m) : W * 0.28;
    g.fillStyle = "#6a1e2a"; g.beginPath(); g.ellipse(mx, my + r * 0.2, r * 0.75, r, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  } else if (type === "grin" || type === "laugh") {
    const open = type === "laugh" ? W * (0.55 + 0.25 * m) : W * 0.4;
    g.fillStyle = "#6a1e2a"; g.beginPath();
    g.moveTo(mx - W, my - W * 0.1); g.quadraticCurveTo(mx, my + W * 0.05, mx + W, my - W * 0.1);
    g.quadraticCurveTo(mx + W * 0.7, my + open, mx, my + open); g.quadraticCurveTo(mx - W * 0.7, my + open, mx - W, my - W * 0.1); g.fill();
    g.save(); g.clip();
    g.fillStyle = "#ffffff"; g.fillRect(mx - W, my - W * 0.3, 2 * W, W * 0.32); // teeth
    if (type === "laugh") { g.fillStyle = "#e0566a"; g.beginPath(); g.ellipse(mx, my + open, W * 0.55, open * 0.45, 0, 0, Math.PI * 2); g.fill(); }
    g.restore(); g.stroke();
  }
  // ---- sweat drop ----
  if (d.sweat) {
    const sx = X(0.68, 0.18), sy = Y(0.18), r = 0.055 * K;
    g.fillStyle = "#8fd0f2"; g.strokeStyle = "#3a6f9a"; g.lineWidth = lw * 0.5;
    g.beginPath(); g.moveTo(sx, sy - r * 2); g.quadraticCurveTo(sx + r * 1.1, sy, sx, sy + r); g.quadraticCurveTo(sx - r * 1.1, sy, sx, sy - r * 2); g.fill(); g.stroke();
  }
}
