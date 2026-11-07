// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPuff, fxStars, Outfit, Expr, FrontOpts, SideOpts, Prop } from "./toon";
import { FPS, D0, SHOTS, V3, smooth, clamp01, W, NA, NB, NC, PETER_AT, PETER_DESK, COLLECTOR_G, FIELD, G_KEY, PORCH, DESK, CHEST, FAM } from "./story";
import { drawNarrator, NarrOpts, NExpr, NPose, narrKey } from "./narrator";
import { PETER, PEASANT, BABA, GRANDPA, KIDP, COLLECTOR, CLERK, ARISTO, BANKER } from "./russians";
import { fxCoin, fxRoll, fxBook, fxCheck, fxPage, fxSpark } from "./props2d";
import { lipAt } from "./lips";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;

const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = {};
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- the cast by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const swap = (t: number, f: number) => t >= f / FPS - LEAD;
const fr = (t: number) => Math.round(t * FPS);

/** the Narrator: lit card, lip sync from the voice while he is on screen */
const narrator = (cam: CamInfo, t: number, out: Stage, at: V3, o: NarrOpts & { talking?: boolean }, swaps: number[] = []) => {
  const f = fr(t), d = cam.pos.distanceTo(tmp.set(at[0], 1.3, at[2]));
  const [w, h, k] = tier(d);
  const { talking = true, ...rest } = o;
  const opts: NarrOpts = { breath: q((t * 0.4) % 1, 30), blink: lidAt(t, 7, swaps), talk: talking ? lipAt(f) : 0, light: light2D(cam, false), ...rest };
  out.places.push({ key: "N|" + narrKey(opts), x: at[0], y: at[1], z: at[2], size: [w, h, k], draw: (p) => drawNarrator(p, opts) });
  if (at[1] <= 0.02) blob(out, at[0], at[1], at[2], 1.15);
};
const W_ = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
const stand = (cam: CamInfo, t: number, out: Stage, who: Who, at: V3, fo: FrontOpts, opt: { scale?: number; roll?: number; lift?: number; swaps?: number[]; noBlob?: boolean } = {}) => {
  const f2: FrontOpts = { mode: "stand", blink: lidAt(t, who.i, opt.swaps), ...fo };
  const pl = person(cam, who, at[0], at[1] + (opt.lift ?? 0), at[2], { side: false, mirror: false }, f2, {}, opt.scale ?? 1);
  if (opt.roll) pl.roll = opt.roll;
  out.places.push(pl);
  if (!opt.noBlob && at[1] <= 0.6) blob(out, at[0], at[1], at[2], opt.scale ?? 1);
};
/** ghost: the person drawn into its own canvas, legs faded into a wisp, tinted pale blue and see-through; unlit soft card */
const ghost = (cam: CamInfo, t: number, out: Stage, who: Who, at: V3, fo: FrontOpts, s = 1, alpha = 0.8) => {
  const d = cam.pos.distanceTo(tmp.set(at[0], at[1] + 1.2, at[2]));
  const cs = d < 4 ? 1.5 : d < 12 ? 0.8 : 0.35;
  const f2: FrontOpts = { mode: "stand", blink: lidAt(t, who.i + 300), ...fo, light: -2.1 };
  const key = `ghost|${who.okey}|${q(alpha, 10)}|${fkey(f2)}`;
  const bob = 0.08 * Math.sin(t * 2.6 + who.i);
  out.fx.push({
    key, cw: Math.round(600 * cs), ch: Math.round(1000 * cs), soft: true,
    x: at[0], y: at[1] + bob + (975 - 500) * SU * s, z: at[2], w: 600 * SU * s, h: 1000 * SU * s, rot: 0.04 * Math.sin(t * 1.7 + who.i),
    draw: (p) => {
      const g = p.g; g.save(); g.scale(cs, cs); bodyFront(p, who.o, f2); g.restore();
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      const H = 1000 * cs, Wd = 600 * cs;
      g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(175,228,255,0.3)"; g.fillRect(0, 0, Wd, H);
      g.globalCompositeOperation = "destination-out";
      const gr = g.createLinearGradient(0, H * 0.6, 0, H * 0.93); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
      g.fillStyle = gr; g.fillRect(0, 0, Wd, H);
      g.globalCompositeOperation = "destination-in"; g.fillStyle = `rgba(0,0,0,${alpha})`; g.fillRect(0, 0, Wd, H);
      g.restore();
    },
  });
};
const fxCard = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, ...extra });
const coin = (out: Stage, at: V3, t: number, size = 0.12) => { const sp = q(Math.cos(t * 14), 8); fxCard(out, `coin${sp}`, 200, 200, (p) => fxCoin(p, sp), at, size, size); };
const burst = (out: Stage, f: number, f0: number, at: V3, size: number, n = 6, col?: string) => {
  if (f < f0 || f >= f0 + n) return;
  const u = q(0.5 + 0.5 * (f - f0) / n, 30);
  fxCard(out, `burst${u}${col ?? ""}`, 500, 500, (p) => fxBurst(p, u, col), at, size, size);
};
const puff = (out: Stage, f: number, f0: number, at: V3, size: number) => {
  if (f < f0 || f >= f0 + 14) return;
  const v = q((f - f0) / 14, 20), pv = q(0.45 + 0.55 * v, 20);
  fxCard(out, `puff${pv}`, 300, 300, (p) => fxPuff(p, pv), [at[0], at[1] + 0.2 * v, at[2]], size * (0.6 + 0.6 * v), size * (0.6 + 0.6 * v), { soft: true });
};
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** a coin thrown from a to b over n frames (parabola) */
const toss = (out: Stage, f: number, f0: number, a: V3, b: V3, n = 14, hgt = 0.6) => {
  if (f < f0 || f > f0 + n + 3) return;
  const u = clamp01((f - f0) / n), p = lerp3(a, b, u);
  p[1] += hgt * 4 * u * (1 - u);
  coin(out, p, f / FPS);
  if (f >= f0 + n) burst(out, f, f0 + n, b, 0.4, 4, "#fff3b0");
};
/** falling over: card roll 0 -> -90 degrees in 7 frames with a little bounce */
const fallK = (f: number, f0: number) => { if (f < f0) return 0; const u = (f - f0) / 7; return u < 1 ? u * u : 1 + 0.06 * Math.sin((f - f0 - 7) * 1.4) * Math.exp(-(f - f0 - 7) / 4); };

const P = (i: number) => W_(10 + i, PEASANT(i), `pe${i}`);
const B = (i: number) => W_(30 + i, BABA(i), `ba${i}`);
const GP = W_(50, GRANDPA, "gp"), KD = W_(51, KIDP, "kid"), CO = W_(52, COLLECTOR, "co"), CL = W_(53, CLERK, "cl"), AR = W_(54, ARISTO, "ar"), BK = W_(55, BANKER, "bk"), PT = W_(56, PETER, "pt");
const hoe = (t: number, i: number): Prop => ["hoe", q(0.5 + 0.5 * Math.sin(t * 5 + i * 1.7), 12)];

export const stage = (id: number, t: number, _ts: number | null, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = fr(t);
  LNAME = s.light;
  findSun(cam, SUN);
  const after = (cue: number) => swap(t, cue);
  switch (id) {
    case 1: narrator(cam, t, out, NA, { expr: "serious", pose: "point", k: smooth((f - 4) / 8) }); break;
    case 2: narrator(cam, t, out, NA, { expr: after(W.account) ? "nervous" : "talking", pose: "phone", k: smooth((f - 50) / 7), look: after(W.account) ? 0.2 : 0, lookY: after(W.account) ? 0 : 0.8 }, [W.account / FPS]); break;
    case 3: for (let i = 0; i < 6; i++) { const x = -60 + i * 17 + (t * 1.1 * (i % 2 ? 1 : -1)), z = i % 2 ? 2 : -2; stand(cam, t, out, i % 2 ? P(i) : B(i), [x, 0, z], { mode: "stroll", phase: q((t * 0.8 + i * 0.3) % 1, 60), expr: "smile_closed" }); } break;
    case 4: {
      const rise = smooth((f - 142) / 22), gy = -1.6 + 1.9 * rise;
      ghost(cam, t, out, P(1), [G_KEY[0] + 0.1, gy, G_KEY[2] + 2.0], { expr: after(W.taxes1) ? "shock" : f > 170 ? "smile_closed" : "dazed", prop: f > 150 ? ["bill", 0] : null }, 1, 0.9);
      if (f < 168) puff(out, f, 140, [G_KEY[0], 0.3, G_KEY[2] + 1.2], 1.2);
      const k = after(W.taxes1) ? 1 : 0;
      stand(cam, t, out, CO, COLLECTOR_G, { expr: "stern", prop: ["bill", k], facing: -1, look: -1 });
      burst(out, f, W.taxes1, [G_KEY[0] + 0.35, 1.5, G_KEY[2] + 2.3], 0.9);
      break;
    }
    case 5: {
      const shocked = after(W.gold + 4);
      stand(cam, t, out, PT, PETER_AT, { expr: shocked ? "shock" : "stern", prop: ["sack", 0], facing: -1, look: -1 }, { swaps: [(W.gold + 4) / FPS] });
      if (f >= W.gold - 6) {
        const u = clamp01((f - (W.gold - 6)) / 10), y = 1.25 - 0.75 * u * u;
        if (u < 1) coin(out, [CHEST[0] + 0.55 * (1 - u), y, CHEST[2] + 0.1], t, 0.11);
        burst(out, f, W.gold + 4, [CHEST[0], 0.62, CHEST[2] + 0.2], 0.5, 5, "#fff3b0");
      }
      break;
    }
    case 6: stand(cam, t, out, PT, PETER_AT, { expr: after(W.problem) ? "shock" : "stern", look: after(W.problem) ? 0 : -1, headTilt: after(W.problem) ? 0 : -4 }, { swaps: [W.problem / FPS] }); break;
    case 7: {
      const spots: V3[] = [[0.2, 0, -33.4], [1.4, 0, -36.2], [-0.5, 0, -38.8], [2.0, 0, -41.4], [0.4, 0, -44.2]];
      spots.forEach((p0, i) => {
        const at: V3 = [FIELD[0] + p0[0], 0, p0[2] + FIELD[2] + 36];
        const cue = i === 0 ? W.dying + 4 : i === 1 ? W.year + 4 : 0;
        const k = cue ? fallK(f, cue) : 0;
        if (k > 0) stand(cam, t, out, P(i), at, { expr: k > 0.5 ? "dead" : "shock" }, { roll: -k * Math.PI / 2, lift: 0.22 * Math.min(1, k), noBlob: true });
        else stand(cam, t, out, i === 4 ? B(1) : P(i), at, { expr: "neutral", prop: hoe(t, i), facing: i % 2 ? 1 : -1 });
        if (cue) puff(out, f, cue + 6, [at[0] - 0.6, 0.2, at[2]], 1.0);
      });
      break;
    }
    case 8: {
      const keep = 12 - Math.max(0, Math.min(12, Math.floor((f - W.wiping + 2) / 3.2)));
      fxCard(out, `roll${keep}`, 700, 1000, (p) => fxRoll(p, keep), [DESK[0], 1.46, DESK[2] + 0.15], 0.62, 0.88);
      if (f >= W.wiping - 2) for (let i = 0; i < 12; i++) { const fi = W.wiping - 2 + Math.round(i * 3.2); puff(out, f, fi, [DESK[0] - 0.08 + cam.right.x * 0.0, 1.46 + 0.88 * (0.34 - i * 0.06), DESK[2] + 0.25], 0.22); }
      break;
    }
    case 9: stand(cam, t, out, PT, PETER_DESK, { expr: f < W.solution + 4 ? "stern" : "grin", look: 1, headTilt: -5 }, { swaps: [(W.solution + 4) / FPS] }); break;
    case 10: narrator(cam, t, out, NB, { expr: f < W.warfare - 6 ? "worried" : "nervous", pose: "think", k: smooth((f - 486) / 8), look: -0.6 }); break;
    case 11: {
      const n = clamp01((f - 540) / 60) * 14;
      fxCard(out, `book${Math.floor(n)}`, 1000, 700, (p) => fxBook(p, Math.floor(n)), [PETER_DESK[0], 0.965, PETER_DESK[2] + 1.3], 1.1, 0.77, { flat: true, rot: 0 });
      stand(cam, t, out, PT, PETER_DESK, { expr: after(W.census1) ? "grin" : "stern", prop: after(W.census1 - 8) && !after(W.census1 + 8) ? ["hammer", q(clamp01((f - W.census1 + 8) / 8), 8)] : ["quill", q((f % 20) / 20, 10)], look: 0 });
      [[218.3, -9.9], [217.4, -8.9], [216.5, -7.9], [215.6, -6.9]].forEach(([x, z], i) => stand(cam, t, out, i === 2 ? B(2) : P(i + 1), [x, 0, z], { expr: i === 0 ? "nervous" : "neutral", facing: 1, look: 1 }));
      burst(out, f, W.census1, [PETER_DESK[0] + 0.3, 1.05, PETER_DESK[2] + 1.2], 0.8);
      break;
    }
    case 12: {
      const stamped = after(W.alive);
      ghost(cam, t, out, P(1), [G_KEY[0] - 0.1, 0.3, G_KEY[2] + 2.0], { expr: stamped ? "dazed" : "nervous", prop: ["bill", 0] }, 1, 0.9);
      stand(cam, t, out, CL, [G_KEY[0] + 0.65, 0, G_KEY[2] + 2.6], { expr: stamped ? "grin" : "stern", prop: ["hammer", q(clamp01((f - W.alive + 8) / 8), 8)], facing: -1, look: -1 });
      if (stamped) { const u = smooth((f - W.alive) / 6); fxCard(out, "check", 600, 600, fxCheck, [G_KEY[0] + 0.2, 2.35, G_KEY[2] + 2.0], 0.75 * u, 0.75 * u); }
      burst(out, f, W.alive, [G_KEY[0] + 0.25, 1.45, G_KEY[2] + 2.2], 1.1);
      break;
    }
    case 13: narrator(cam, t, out, NA, { expr: f < W.next ? "talking" : "serious", pose: f < W.next - 2 ? "explain" : "up", k: f < W.next - 2 ? smooth((f - 670) / 8) : smooth((f - W.next + 2) / 5) }); break;
    case 14: {
      const dazed = after(W.twenty);
      narrator(cam, t, out, NA, { expr: dazed ? "dazed" : "worried", pose: "pockets", headTilt: dazed ? 6 * Math.sin(t * 5) : 0, talking: !dazed });
      const fwd = tmp.set(cam.pos.x - NA[0], 0, cam.pos.z - NA[2]).normalize().clone();
      for (let i = 0; i < 16; i++) {
        const per = 22, ph = ((f - 755 + i * (per / 4) * 1.37) % (per * 4)) / (per * 4), depth = [-1.2, 0.9, 2.0, -0.4][i % 4];
        const sx = 3.2 - 6.4 * ph, y = 0.4 + 2.1 * hh(i, 4) + 0.5 * Math.sin(ph * 6 + i);
        const at: V3 = [NA[0] + cam.right.x * sx + fwd.x * depth, y, NA[2] + cam.right.z * sx + fwd.z * depth];
        fxCard(out, `page${i % 5}`, 400, 480, (p) => fxPage(p, i % 5), at, 0.42, 0.5, { rot: q(ph * 9 + i, 12) });
      }
      break;
    }
    case 15: {
      const k = fallK(f, W.dropped + 2);
      if (k > 0) { stand(cam, t, out, GP, PORCH, { expr: k > 0.5 ? "dead" : "shock" }, { roll: -k * Math.PI / 2, lift: 0.2 * Math.min(1, k), noBlob: true }); burst(out, f, W.dead2, [PORCH[0] + 0.9, 0.4, PORCH[2] + 0.2], 0.7, 6, "#ffffff"); }
      else stand(cam, t, out, GP, PORCH, { expr: "smile_closed", wave: q(Math.sin(t * 7), 10) });
      if (f >= W.dead2) { const v = q(((f - W.dead2) / 30) % 1, 20); fxCard(out, `stars${v}`, 400, 400, (p) => fxStars(p, v), [PORCH[0] + 1.5, 0.55, PORCH[2] + 0.2], 0.6, 0.6); }
      break;
    }
    case 16: {
      const C: V3 = [FAM[0] + 1.25, 0, FAM[2] + 1.2];
      stand(cam, t, out, P(0), [FAM[0], 0, FAM[2]], { expr: f < W.pay ? "nervous" : "pained", prop: ["coin", 0], facing: 1, look: 1 });
      stand(cam, t, out, B(0), [FAM[0] - 0.75, 0, FAM[2] - 0.6], { expr: "nervous", facing: 1, look: 1 });
      stand(cam, t, out, KD, [FAM[0] + 0.55, 0, FAM[2] + 0.35], { expr: "shock", look: 1 }, { scale: 0.72 });
      stand(cam, t, out, CO, C, { expr: "grin", prop: ["bill", 1], facing: -1, look: -1 });
      ghost(cam, t, out, GP, [FAM[0] - 0.2, 0.75, FAM[2] - 1.3], { expr: "nervous", look: 1 }, 1, 0.85);
      toss(out, f, W.pay - 2, [FAM[0] + 0.3, 1.2, FAM[2] + 0.1], [C[0] - 0.3, 1.25, C[2]], 12, 0.5);
      toss(out, f, W.taxes2 - 4, [FAM[0] + 0.3, 1.2, FAM[2] + 0.1], [C[0] - 0.3, 1.25, C[2]], 12, 0.6);
      break;
    }
    case 17: {
      const g0: V3 = [FIELD[0] + 6, 0.25, FIELD[2]];
      ghost(cam, t, out, GP, g0, { expr: f < W.farming ? "smile_closed" : "relief_open", prop: hoe(t, 2) }, 1, 0.9);
      stand(cam, t, out, P(2), [g0[0] + 1.3, 0, g0[2] - 2.6], { expr: "nervous", prop: hoe(t, 5), facing: -1, look: -1 });
      stand(cam, t, out, CO, [g0[0] - 0.8, 0, g0[2] - 2.3], { expr: "smile_closed", prop: ["scroll", 0], facing: 1, look: 1 });
      break;
    }
    case 18: narrator(cam, t, out, NA, { expr: f < W.absurd ? "squint" : "serious", pose: f < W.absurd - 4 ? "shrug" : "facepalm", k: f < W.absurd - 4 ? smooth((f - 1083) / 6) : smooth((f - W.absurd + 4) / 6) }); break;
    case 19: {
      const handed = after(W.buying + 6), sly = after(W.secretly);
      stand(cam, t, out, AR, [-90.4, 0, 14.6], { expr: sly ? "grin" : "stern", prop: handed ? ["scroll", 0] : ["sack", 0.6], look: sly && !handed ? (Math.sin(t * 6) > 0 ? -1 : 1) : 1, facing: 1 }, { swaps: [W.buying / FPS] });
      stand(cam, t, out, CL, [-89.6, 0, 15.7], { expr: handed ? "grin" : "nervous", prop: handed ? ["sack", 0.6] : ["scroll", 0], facing: -1, look: -1 });
      burst(out, f, W.buying + 6, [-89.9, 1.3, 15.0], 0.7, 5, "#fff3b0");
      break;
    }
    case 20: for (let i = 0; i < 14; i++) ghost(cam, t, out, i % 3 ? P(i % 5) : B(i % 3), [-75 - 9 * i - 6 * hh(i, 1), 0.4, 28 + 8 * (i % 5) + 5 * hh(i, 2)], { expr: (["smile_closed", "nervous", "neutral"] as Expr[])[i % 3] }, 1, 0.7); break;
    case 21: {
      const u = clamp01((f - 1274) / 64), A: V3 = [244.5 + 0.5 * u, 0, 18 + 3.5 * u];
      stand(cam, t, out, AR, A, { mode: "stroll", phase: q((t * 1.4) % 1, 60), expr: after(W.collateral) ? "grin" : "smile_closed", prop: ["scroll", 0] });
      for (let i = 0; i < 10; i++) ghost(cam, t, out, i % 3 ? P(i % 5) : B(i % 3), [A[0] - 1.6 - 1.5 * (i % 4) + 0.8 * hh(i, 3), 0.3, A[2] - 1.8 - 1.4 * Math.floor(i / 4) - 0.6 * hh(i, 5)], { expr: (["nervous", "neutral", "smile_closed", "dazed"] as Expr[])[i % 4] }, 1, 0.75);
      break;
    }
    case 22: {
      const got = after(W.massive2);
      stand(cam, t, out, BK, [246.6, 0.6, 28.6], { expr: got ? "smile_closed" : "stern", prop: got ? null : ["sack", 1], facing: -1, look: -1 });
      stand(cam, t, out, AR, [245.0, 0, 27.0], { expr: got ? "relief_open" : "grin", prop: got ? ["sack", 1] : ["scroll", 0], facing: 1, look: 1 }, { swaps: [W.massive2 / FPS] });
      burst(out, f, W.massive2, [245.6, 1.5, 27.4], 1.4, 7, "#fff3b0");
      if (got) for (let i = 0; i < 18; i++) {
        const u = ((f - W.massive2) / 22 + hh(i, 7)) % 1, x = 244.2 + 2.8 * hh(i, 8), z = 26.6 + 1.6 * hh(i, 9);
        coin(out, [x, 3.2 - 3.0 * u, z], t + i, 0.13);
      }
      break;
    }
    case 23: narrator(cam, t, out, NA, { expr: "talking", pose: "explain", k: smooth((f - 1390) / 8), look: 0.2 }); break;
    case 24: narrator(cam, t, out, NA, { expr: f < W.die - 4 ? "serious" : "shocked", pose: f < W.die - 4 ? "pockets" : "shrug", k: smooth((f - W.die + 4) / 5) }, [(W.die - 4) / FPS]); break;
    case 25: for (let i = 0; i < 5; i++) stand(cam, t, out, i % 2 ? P(i) : B(i), [-50 + i * 14 + t * 0.8 * (i % 2 ? 1 : -1), 0, i % 2 ? 2 : -2], { mode: "stroll", phase: q((t * 0.8 + i * 0.3) % 1, 60), expr: "neutral" }); break;
    case 26: {
      const pop = after(W.mistake), shrug = after(W.make);
      narrator(cam, t, out, NC, { expr: shrug ? "nervous" : pop ? "shocked" : "sad", pose: shrug ? "shrug" : "pockets", k: smooth((f - W.make) / 6), look: pop && !shrug ? -0.8 : 0 }, [W.mistake / FPS]);
      if (pop) {
        const u = smooth((f - W.mistake + 2) / 8);
        ghost(cam, t, out, GP, [NC[0] - 0.85, -0.9 + 1.2 * u, NC[2] + 0.7], { expr: "smile_closed", prop: ["bill", 1], facing: 1, look: 1 }, 1, 0.8);
        puff(out, f, W.mistake - 2, [NC[0] - 0.85, 0.4, NC[2] + 0.8], 1.2);
      }
      break;
    }
  }
  return out;
};
export { FPS, D0, clamp01 };
