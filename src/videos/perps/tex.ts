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

/** UI layer printed on a glass card: transparent so the 3D glass body (thickness, reflections) shows through.
 *  `border` = a state colour (red = closed, orange = lit) drawn as a thin inset line with a soft inner bloom. */
export const glass = (g: G, W: number, H: number, o: { lit?: string; border?: string; fill?: number } = {}) => {
  const r = Math.min(W, H) * 0.1;
  g.clearRect(0, 0, W, H);
  g.save();
  rr(g, 0, 0, W, H, r);
  g.clip();
  const sh = g.createLinearGradient(0, 0, W * 0.4, H);
  sh.addColorStop(0, "rgba(255,255,255,0.05)");
  sh.addColorStop(0.45, "rgba(255,255,255,0.012)");
  sh.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sh;
  g.fillRect(0, 0, W, H);
  if (o.lit) {
    const lg = g.createRadialGradient(W * 0.5, -H * 0.45, 0, W * 0.5, -H * 0.45, H * 1.3);
    lg.addColorStop(0, o.lit);
    lg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = lg;
    g.fillRect(0, 0, W, H);
  }
  const inset = Math.max(3, W / 160);
  if (o.border) {
    g.shadowColor = o.border;
    g.shadowBlur = W / 30;
    g.lineWidth = Math.max(2, W / 260);
    g.strokeStyle = o.border;
    rr(g, inset, inset, W - inset * 2, H - inset * 2, r * 0.9);
    g.stroke();
    g.shadowBlur = 0;
  } else {
    g.lineWidth = Math.max(1.5, W / 420);
    g.strokeStyle = "rgba(239,244,250,0.07)";
    rr(g, inset, inset, W - inset * 2, H - inset * 2, r * 0.9);
    g.stroke();
  }
  g.restore();
};

export const chip = (g: G, label: string, x: number, y: number, px: number, style: "closed" | "open" | "ghost", align: "left" | "right" = "left") => {
  g.font = `600 ${px}px ${FB}`;
  g.letterSpacing = `${px * 0.14}px`;
  const tw = g.measureText(label).width;
  g.letterSpacing = "0px";
  const dot = style === "closed" ? px * 1.0 : 0;
  const w = tw + px * 1.6 + dot, h = px * 1.9;
  const x0 = align === "right" ? x - w : x;
  rr(g, x0, y - h / 2, w, h, h / 2);
  if (style === "open") {
    g.fillStyle = C.perps;
    g.fill();
  } else {
    g.fillStyle = style === "closed" ? "rgba(255,117,106,0.12)" : "rgba(239,244,250,0.05)";
    g.fill();
    g.lineWidth = Math.max(1.5, px / 10);
    g.strokeStyle = style === "closed" ? "rgba(255,117,106,0.55)" : "rgba(239,244,250,0.22)";
    g.stroke();
  }
  if (dot) {
    g.beginPath();
    g.arc(x0 + px * 0.85, y, px * 0.26, 0, Math.PI * 2);
    g.fillStyle = C.error;
    g.fill();
  }
  text(g, label, x0 + px * 0.8 + dot, y + px * 0.36, px, "s", style === "open" ? "#0b0d10" : style === "closed" ? "#FFB1AA" : C.t2, "left", px * 0.14);
};

const spark = (g: G, x: number, y: number, w: number, h: number, seed: number, up: boolean) => {
  const r = rng(seed);
  let v = 0.5;
  const pts: number[] = [];
  for (let i = 0; i < 24; i++) {
    v += (r() - 0.5) * 0.22 + (up ? 0.018 : -0.018);
    v = Math.min(0.95, Math.max(0.05, v));
    pts.push(v);
  }
  const col = up ? C.success : C.error;
  const grad = g.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, up ? "rgba(54,196,110,0.28)" : "rgba(255,117,106,0.28)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.beginPath();
  pts.forEach((p, i) => {
    const px = x + (i / (pts.length - 1)) * w, py = y + (1 - p) * h;
    if (i) g.lineTo(px, py);
    else g.moveTo(px, py);
  });
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  g.fillStyle = grad;
  g.fill();
  g.beginPath();
  pts.forEach((p, i) => {
    const px = x + (i / (pts.length - 1)) * w, py = y + (1 - p) * h;
    if (i) g.lineTo(px, py);
    else g.moveTo(px, py);
  });
  g.lineWidth = h * 0.05;
  g.strokeStyle = col;
  g.stroke();
};

export type Ticker = { sym: string; kind: string; px: string; chg: string; up: boolean; seed: number };
export const CARD_W = 1.5, CARD_H = 0.86;

export const tickerTex = (t: Ticker) =>
  cached(`tk-${t.sym}-${t.px}-${t.chg}`, CARD_W, CARD_H, (g, W, H) => {
    glass(g, W, H);
    const p = W * 0.075;
    text(g, t.sym, p, H * 0.22, H * 0.105, "s", C.t2, "left", H * 0.01);
    text(g, t.kind, W - p, H * 0.22, H * 0.085, "s", C.t3, "right", H * 0.012);
    text(g, t.px, p, H * 0.53, H * 0.23, "s", C.text);
    text(g, t.chg, p, H * 0.8, H * 0.11, "s", t.up ? C.success : C.error);
    spark(g, W * 0.5, H * 0.6, W * 0.42, H * 0.25, t.seed, t.up);
  });

export const closedTex = (name: string, sub: string) =>
  cached(`cl-${name}`, CARD_W, CARD_H, (g, W, H) => {
    glass(g, W, H, { border: "rgba(255,117,106,0.75)" });
    const p = W * 0.075;
    text(g, name, p, H * 0.3, H * 0.15, "s", C.text);
    text(g, sub, p, H * 0.47, H * 0.095, "b", C.t3);
    chip(g, "CLOSED", p, H * 0.74, H * 0.085, "closed");
  });

export const clockTex = () =>
  cached("clock", 2.3, 1.36, (g, W, H) => {
    glass(g, W, H);
    text(g, "SATURDAY", W / 2, H * 0.22, H * 0.075, "s", C.t3, "center", H * 0.03);
    text(g, "02:14", W / 2, H * 0.72, H * 0.5, "d", C.text, "center", H * 0.01);
    text(g, "AM  ·  NEW YORK", W / 2, H * 0.88, H * 0.065, "s", C.t3, "center", H * 0.025);
  });

export const DAY_W = 0.92, DAY_H = 1.3;
export const dayTex = (label: string, lit: boolean, note?: string) =>
  cached(`day-${label}-${lit}`, DAY_W, DAY_H, (g, W, H) => {
    glass(g, W, H, lit ? { lit: "rgba(246,160,58,0.85)", border: "rgba(246,160,58,0.85)" } : {});
    text(g, label, W * 0.12, H * 0.22, H * 0.17, "d", C.text, "left", H * 0.004);
    if (note && lit) text(g, note, W * 0.12, H * 0.34, H * 0.055, "s", C.text, "left", H * 0.004);
    chip(g, "OPEN", W * 0.12, H * 0.86, H * 0.05, lit ? "open" : "ghost");
  });

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
    text(g, "24H", cx, cy - H * 0.02, H * 0.09, "s", C.t3, "center", H * 0.006);
    text(g, "ALWAYS OPEN", cx, cy + H * 0.08, H * 0.045, "s", C.t2, "center", H * 0.008);
  });

/** soft rounded glow, used additively behind cards */
export const glowTex = (rgb: string) =>
  cached(`glow-${rgb}`, 2, 2, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    gr.addColorStop(0, `rgba(${rgb},0.9)`);
    gr.addColorStop(0.35, `rgba(${rgb},0.35)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
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
