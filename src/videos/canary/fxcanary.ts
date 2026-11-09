// Canary short drawings: the canary itself (perched / singing / swaying / limp), its brass cage, a dropped pick,
// the invisible gas (drawn as faint swirls so the audience can see what the miners can't), a pocket watch.
import { Pen, INK } from "./toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const YEL = "#ffd23a", YEL_D = "#e6a81e", BEAK = "#f08a2c", BRASS = "#d4a63a", BRASS_D = "#9a7224";

export type BirdState = { open?: number; eye?: "dot" | "dazed" | "shut" | "half"; tilt?: number; wing?: number; lying?: boolean };
/** canary at (x, y) = feet, s = scale (1 = ~120 units tall), facing screen-right */
export const bird = (p: Pen, x: number, y: number, s: number, b: BirdState = {}) => {
  const { open = 0, eye = "dot", tilt = 0, wing = 0, lying = false } = b;
  const prev = p.rot;
  const a = rad(tilt + (lying ? -80 : 0));
  p.rot = a ? [a, x, y] : null;
  const S = (dx: number, dy: number): P2 => [x + dx * s, y + dy * s];
  const w = 6 * s;
  // tail
  p.poly([S(-30, -40), S(-78, -22), S(-74, -8), S(-26, -26)], YEL_D, w);
  // legs
  if (!lying) for (const d of [-6, 8]) p.stroke([S(d, -20), S(d - 2, 0)], 4 * s, BEAK);
  // body
  const body: P2[] = [];
  for (let i = 0; i < 40; i++) { const t = (i / 40) * Math.PI * 2; body.push(S(Math.cos(t) * 46 + (Math.cos(t) > 0 ? 4 : 0), -50 + Math.sin(t) * 34)); }
  p.shadedFill(body, YEL, YEL_D, rad(-120), 46 * s, 0.4);
  p.poly(body, null, w);
  // head
  const hx = 30, hy = -94;
  p.shadedFill(Array.from({ length: 36 }, (_, i) => S(hx + Math.cos((i / 36) * Math.PI * 2) * 30, hy + Math.sin((i / 36) * Math.PI * 2) * 29)), YEL, YEL_D, rad(-120), 30 * s, 0.4);
  p.ell(...S(hx, hy), 30 * s, 29 * s, null, w);
  // beak (opens on song)
  const o = 10 * open;
  p.poly([S(56, -100 - o * 0.4), S(84, -96 - o), S(58, -90)], BEAK, w * 0.8);
  p.poly([S(58, -88), S(80, -84 + o * 0.6), S(56, -80 + o * 0.3)], BEAK, w * 0.8);
  // eye
  const [ex, ey] = S(hx + 10, hy - 6);
  if (eye === "dot") p.dot(ex, ey, 6 * s);
  else if (eye === "half") { p.dot(ex, ey + 2 * s, 5 * s); p.stroke([S(hx + 1, hy - 8), S(hx + 19, hy - 8)], 4 * s); }
  else if (eye === "shut") p.arc(ex, ey, 7 * s, 5 * s, 20, 160, 4 * s);
  else { const sp: P2[] = []; for (let t = 1; t < 14; t++) sp.push([ex + Math.cos(t * 0.9) * t * 0.75 * s, ey + Math.sin(t * 0.9) * t * 0.75 * s]); p.stroke(sp, 3.2 * s); }
  // wing
  const wa = rad(-10 - 40 * wing);
  const wp: P2[] = [S(-14, -64), [x + (-14 + Math.cos(wa) * -40) * s, y + (-64 + Math.sin(wa) * -40 + 26) * s], S(20, -40), S(14, -62)];
  p.poly(wp, YEL_D, w * 0.8);
  p.rot = prev;
};

/** hanging brass cage with the canary on its perch, on a 400 x 620 canvas; the hook ring is at (200, 24) */
export const fxCage = (p: Pen, b: BirdState & { hop?: number }) => {
  const x0 = 78, x1 = 322, yt = 190, yb = 540, cx = 200;
  // hook + ring
  p.ell(cx, 30, 18, 18, null, 9);
  p.stroke([[cx, 48], [cx, 92]], 9);
  // back bars (darker)
  for (let i = 0; i <= 8; i++) { const x = x0 + ((x1 - x0) * i) / 8; p.stroke([[x, yt], [x, yb]], 6, BRASS_D); }
  // perch + bird
  p.stroke([[x0 + 20, 430], [x1 - 20, 430]], 14, INK); p.stroke([[x0 + 20, 430], [x1 - 20, 430]], 8, "#8a5a34");
  bird(p, cx - 6, 424 - (b.hop ?? 0) * 40, 1.05, b);
  // front bars + dome
  const dome = (k: number): P2[] => { const out: P2[] = []; for (let i = 0; i <= 20; i++) { const t = Math.PI + (Math.PI * i) / 20; out.push([cx + Math.cos(t) * (x1 - x0) / 2 * k, yt + Math.sin(t) * 100 * k]); } return out; };
  for (let i = 0; i <= 8; i += 2) {
    const x = x0 + ((x1 - x0) * i) / 8, u = (x - cx) / ((x1 - x0) / 2);
    const top: P2 = [cx + u * (x1 - x0) / 2 * 0.98, yt - 100 * Math.sqrt(Math.max(0, 1 - u * u))];
    p.stroke([[x, yb], [x, yt], top, [cx, yt - 100]], 10, INK);
    p.stroke([[x, yb], [x, yt], top, [cx, yt - 100]], 5, BRASS);
  }
  p.stroke(dome(1), 11, INK); p.stroke(dome(1), 6, BRASS);
  p.dot(cx, yt - 104, 16, INK); p.dot(cx, yt - 104, 10, BRASS);
  p.stroke([[x0 - 4, yt], [x1 + 4, yt]], 12, INK); p.stroke([[x0 - 4, yt], [x1 + 4, yt]], 6, BRASS);
  // tray
  p.poly([[x0 - 22, yb - 6], [x1 + 22, yb - 6], [x1 + 12, yb + 44], [x0 - 12, yb + 44]], BRASS, 9);
  p.stroke([[x0 - 10, yb + 16], [x1 + 10, yb + 16]], 5, BRASS_D);
};

/** miner's pick on a 400 x 400 canvas (head at the top) */
export const fxPick = (p: Pen) => {
  p.band([[200, 380], [200, 70]], "#a8724a", 22, 7, "round");
  const head: P2[] = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16, a = rad(200 + 140 * t); head.push([200 + Math.cos(a) * 180, 150 + Math.sin(a) * 90]); }
  p.stroke(head, 40, INK); p.stroke(head, 26, "#7d848c");
  p.poly([[180, 52], [220, 52], [224, 96], [176, 96]], "#5d636b", 7);
};

/** faint drifting gas swirls on a 600 x 600 canvas (soft card); t loops 0..1 */
export const fxGas = (p: Pen, t: number, a = 0.35) => {
  const g = p.g;
  g.lineCap = "round";
  for (let k = 0; k < 5; k++) {
    const pts: P2[] = [];
    const cy = 120 + k * 95, ph = t * Math.PI * 2 + k * 1.3;
    for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([40 + 520 * u, cy + 30 * Math.sin(u * 7 + ph) + 12 * Math.sin(u * 17 - ph)]); }
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = `rgba(150,150,150,${a * 0.6})`; g.lineWidth = 46; g.stroke();
    g.strokeStyle = `rgba(205,205,200,${a})`; g.lineWidth = 16; g.stroke();
  }
};

/** pocket watch on a 400 x 480 canvas; hand = minute hand angle in turns */
export const fxWatch = (p: Pen, hand: number) => {
  p.ell(200, 40, 24, 24, null, 10);
  p.poly([[180, 60], [220, 60], [214, 96], [186, 96]], BRASS, 8);
  p.ell(200, 270, 170, 170, BRASS, 12);
  p.ell(200, 270, 140, 140, "#fbf6e8", 8);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.stroke([[200 + Math.cos(a) * 112, 270 + Math.sin(a) * 112], [200 + Math.cos(a) * 128, 270 + Math.sin(a) * 128]], i % 3 ? 6 : 12); }
  const a = hand * Math.PI * 2 - Math.PI / 2;
  p.stroke([[200, 270], [200 + Math.cos(a) * 110, 270 + Math.sin(a) * 110]], 12, "#c9373a");
  p.stroke([[200, 270], [200 + Math.cos(-Math.PI / 2 + 0.9) * 70, 270 + Math.sin(-Math.PI / 2 + 0.9) * 70]], 14);
  p.dot(200, 270, 14);
};

/** cough / breath puff ring of little clouds (300 x 300) */
export const fxCough = (p: Pen, t: number, col = "rgba(70,62,58,") => {
  for (let i = 0; i < 4; i++) {
    const a = rad(-40 + i * 25), d = 30 + 110 * t, r = (26 + 8 * (i % 2)) * (1 - 0.5 * t);
    p.ell(60 + d * Math.cos(a), 150 + d * Math.sin(a), r, r * 0.85, `${col}${(0.8 * (1 - t)).toFixed(3)})`, 0);
  }
};
