// Canvas-drawn textures for the 3D UI: frosted glass cards, chips, trading screens, glows.
import * as THREE from "three";
import { C, FB, FD } from "./brand";

export const PX = 420; // texture px per world unit

export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type G = CanvasRenderingContext2D;
type Kind = "b" | "s" | "d";

const rr = (g: G, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};

export const text = (g: G, s: string, x: number, y: number, px: number, kind: Kind, color: string, align: CanvasTextAlign = "left", ls = 0) => {
  g.font = kind === "d" ? `900 ${px}px ${FD}` : `${kind === "s" ? 600 : 400} ${px}px ${FB}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  g.letterSpacing = `${ls}px`;
  g.fillText(s, x, y);
  g.letterSpacing = "0px";
};

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.round(w * PX);
  c.height = Math.round(h * PX);
  return c;
};
const toTex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const cache = new Map<string, THREE.CanvasTexture>();
export const cached = (key: string, w: number, h: number, draw: (g: G, W: number, H: number) => void) => {
  let t = cache.get(key);
  if (t) return t;
  const c = canvas(w, h);
  draw(c.getContext("2d")!, c.width, c.height);
  t = toTex(c);
  cache.set(key, t);
  return t;
};

export const dialFaceTex = () =>
  cached("dialface", 2.4, 2.4, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.48;
    g.beginPath();
    g.arc(cx, cy, R * 0.97, 0, Math.PI * 2);
    g.lineWidth = W / 500;
    g.strokeStyle = "rgba(239,244,250,0.08)";
    g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const big = i % 6 === 0;
      const r0 = R * (big ? 0.62 : 0.66), r1 = R * 0.7;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.lineWidth = W / (big ? 160 : 320);
      g.strokeStyle = big ? "rgba(239,244,250,0.6)" : "rgba(239,244,250,0.25)";
      g.stroke();
    }
    text(g, "24h", cx, cy - H * 0.01, H * 0.1, "s", C.text, "center");
    text(g, "Always open", cx, cy + H * 0.085, H * 0.05, "b", C.t2, "center");
  });

// ---------------- live trading screens (redrawn every frame) ----------------
export class Screen {
  readonly tex: THREE.CanvasTexture;
  private g: G;
  private walk: number[] = [];
  constructor(readonly w: number, readonly h: number, readonly seed: number, readonly sym: string) {
    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = Math.round((1280 * h) / w);
    this.g = c.getContext("2d")!;
    this.tex = toTex(c);
    const r = rng(seed);
    let v = 0.5;
    for (let i = 0; i < 400; i++) {
      v += (r() - 0.47) * 0.06;
      v = Math.min(0.92, Math.max(0.12, v));
      this.walk.push(v);
    }
  }
  draw(frame: number) {
    const g = this.g, W = g.canvas.width, H = g.canvas.height;
    g.fillStyle = "#05070a";
    g.fillRect(0, 0, W, H);
    const top = H * 0.08;
    g.fillStyle = "#0b0e13";
    g.fillRect(0, 0, W, top);
    text(g, this.sym, W * 0.02, top * 0.66, top * 0.42, "s", C.text);
    text(g, "1m   5m   15m   1h   4h", W * 0.2, top * 0.66, top * 0.32, "b", C.t3);
    const cw = W * 0.74, ch = H - top;
    g.strokeStyle = "rgba(255,255,255,0.05)";
    g.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      g.beginPath();
      g.moveTo(0, top + (ch * i) / 8);
      g.lineTo(cw, top + (ch * i) / 8);
      g.stroke();
    }
    const N = 46, off = frame * 0.12, bw = cw / N;
    const yOf = (v: number) => top + ch * 0.06 + (1 - v) * ch * 0.66;
    for (let i = 0; i < N; i++) {
      const k = Math.floor(i + off) % (this.walk.length - 2);
      const o = this.walk[k], c = this.walk[k + 1];
      const last = i === N - 1;
      const cc = last ? o + (c - o) * (off % 1) : c;
      const up = cc >= o;
      const hi = Math.max(o, cc) + 0.02, lo = Math.min(o, cc) - 0.02;
      const x = i * bw + bw * 0.5;
      g.strokeStyle = g.fillStyle = up ? C.success : C.error;
      g.lineWidth = Math.max(1, bw * 0.12);
      g.beginPath();
      g.moveTo(x, yOf(hi));
      g.lineTo(x, yOf(lo));
      g.stroke();
      g.fillRect(x - bw * 0.32, yOf(Math.max(o, cc)), bw * 0.64, Math.max(2, yOf(Math.min(o, cc)) - yOf(Math.max(o, cc))));
      const vol = 0.2 + Math.abs(cc - o) * 9;
      g.globalAlpha = 0.55;
      g.fillRect(x - bw * 0.32, H - vol * ch * 0.14, bw * 0.64, vol * ch * 0.14);
      g.globalAlpha = 1;
    }
    // order book
    const bx = cw + W * 0.015, bwid = W - bx - W * 0.015, rows = 24, rh = ch / (rows + 2);
    const r = rng(this.seed + Math.floor(frame / 3));
    for (let i = 0; i < rows; i++) {
      const ask = i < rows / 2;
      const y = top + rh * (i + 1 + (ask ? 0 : 1));
      const depth = 0.2 + r() * 0.8;
      g.fillStyle = ask ? "rgba(255,117,106,0.16)" : "rgba(54,196,110,0.16)";
      g.fillRect(bx + bwid * (1 - depth), y - rh * 0.8, bwid * depth, rh * 0.8);
      const price = (97412.5 + (rows / 2 - i) * 0.5).toFixed(1);
      text(g, price, bx + 6, y - rh * 0.22, rh * 0.55, "s", ask ? C.error : C.success);
      text(g, (r() * 3).toFixed(3), bx + bwid - 6, y - rh * 0.22, rh * 0.55, "b", C.t2, "right");
    }
    this.tex.needsUpdate = true;
  }
}

// ---------------- reference-style soft cards (matte, icon tile, tinted state footer) ----------------
export const SOFT_W = 1.25, SOFT_H = 0.98;
const icoClock = (g: G, cx: number, cy: number, r: number, col: string) => {
  g.strokeStyle = col;
  g.lineWidth = r * 0.16;
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx, cy + r * 0.08, r * 0.78, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(cx, cy + r * 0.08);
  g.lineTo(cx, cy - r * 0.38);
  g.moveTo(cx, cy + r * 0.08);
  g.lineTo(cx + r * 0.32, cy + r * 0.3);
  g.moveTo(cx - r * 0.28, cy - r * 0.88);
  g.lineTo(cx + r * 0.28, cy - r * 0.88);
  g.stroke();
};
const icoEyeOff = (g: G, cx: number, cy: number, r: number, col: string) => {
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = r * 0.2;
  g.beginPath();
  g.ellipse(cx, cy, r, r * 0.58, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, r * 0.26, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(cx - r * 0.95, cy - r * 0.7);
  g.lineTo(cx + r * 0.95, cy + r * 0.7);
  g.stroke();
};
/** state "closed": red-tinted matte card like the reference's "HIDDEN" cards. state "open": neutral with a green footer. */
type SoftState = "closed" | "open" | "lit" | "plain";
const SOFT: Record<SoftState, { top: string; bot: string; tile: string; ink: string; foot0: string; foot1: string; col: string; edge: string; sub: string }> = {
  closed: { top: "rgba(70,30,32,0.92)", bot: "rgba(48,18,20,0.92)", tile: "rgba(255,92,80,0.16)", ink: "#FF8A7E", foot0: "rgba(255,92,80,0.10)", foot1: "rgba(255,92,80,0.03)", col: "#FF6F63", edge: "rgba(255,120,110,0.16)", sub: "rgba(239,244,250,0.82)" },
  open: { top: "rgba(38,40,46,0.92)", bot: "rgba(24,26,30,0.92)", tile: "rgba(239,244,250,0.08)", ink: C.text, foot0: "rgba(54,196,110,0.07)", foot1: "rgba(54,196,110,0.02)", col: C.success, edge: "rgba(239,244,250,0.08)", sub: C.text },
  lit: { top: "rgba(78,48,20,0.94)", bot: "rgba(44,26,12,0.94)", tile: "rgba(236,139,27,0.2)", ink: "#F6A03A", foot0: "rgba(236,139,27,0.16)", foot1: "rgba(236,139,27,0.05)", col: "#F6A03A", edge: "rgba(246,160,58,0.22)", sub: "rgba(239,244,250,0.85)" },
  plain: { top: "rgba(34,36,41,0.92)", bot: "rgba(22,24,28,0.92)", tile: "rgba(239,244,250,0.06)", ink: C.t2, foot0: "rgba(239,244,250,0.05)", foot1: "rgba(239,244,250,0.02)", col: C.t2, edge: "rgba(239,244,250,0.07)", sub: C.t2 },
};
/** reference-style matte card: inner panel with an icon tile + two-line label, and a tinted state footer */
export const softCard = (title: [string, string], footer: string, state: SoftState, glyph?: string) =>
  cached(`soft-${title.join("|")}-${footer}-${state}-${glyph ?? ""}`, SOFT_W, SOFT_H, (g, W, H) => {
    const P = SOFT[state];
    const r = W * 0.085;
    g.clearRect(0, 0, W, H);
    g.save();
    rr(g, 0, 0, W, H, r);
    g.clip();
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, P.top);
    bg.addColorStop(1, P.bot);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    const p = W * 0.06, ph = H * 0.5;
    rr(g, p, p, W - p * 2, ph, r * 0.7);
    g.fillStyle = "rgba(255,255,255,0.045)";
    g.fill();
    const ts = ph * 0.56, tx = p * 2.1, ty = p + (ph - ts) / 2;
    rr(g, tx, ty, ts, ts, ts * 0.26);
    g.fillStyle = P.tile;
    g.fill();
    if (glyph) text(g, glyph, tx + ts / 2, ty + ts * 0.68, ts * 0.5, "s", P.ink, "center");
    else icoClock(g, tx + ts / 2, ty + ts / 2, ts * 0.3, P.ink);
    const lx = tx + ts + p * 0.9;
    text(g, title[0], lx, p + ph * 0.44, ph * 0.2, "b", C.text);
    text(g, title[1], lx, p + ph * 0.76, ph * 0.2, "b", P.sub);
    const fy = p + ph + H * 0.07, fh = H - fy - p;
    const fg = g.createLinearGradient(0, fy, 0, H);
    fg.addColorStop(0, P.foot0);
    fg.addColorStop(1, P.foot1);
    rr(g, p, fy, W - p * 2, fh, r * 0.7);
    g.fillStyle = fg;
    g.fill();
    g.font = `600 ${fh * 0.3}px ${FB}`;
    g.letterSpacing = `${fh * 0.035}px`;
    const tw = g.measureText(footer).width;
    g.letterSpacing = "0px";
    const ic = fh * 0.15, total = tw + ic * 3.4, x0 = W / 2 - total / 2;
    if (state === "closed") icoEyeOff(g, x0 + ic, fy + fh / 2, ic, P.col);
    else { g.beginPath(); g.arc(x0 + ic, fy + fh / 2, ic * 0.55, 0, Math.PI * 2); g.fillStyle = P.col; g.fill(); }
    text(g, footer, x0 + ic * 3.4, fy + fh / 2 + fh * 0.11, fh * 0.3, "s", P.col, "left", fh * 0.035);
    g.restore();
    g.lineWidth = Math.max(1.5, W / 500);
    g.strokeStyle = P.edge;
    rr(g, 1, 1, W - 2, H - 2, r);
    g.stroke();
  });
