// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxNote, fxBurst, fxShadow, fxContact, setBirdHook,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, smooth, clamp01, mouthAt, POST1, OLD1, NARR1, CREW, TOMMY1, KNEEL, OLD9, NARR10, POST10, LINE, TOMMY11, NARR11,
  CAGEM, OLDM, TOMMYM, MINERSM, NARRM, NOTES_OLD, DROP, STUMBLE, BREATH, REVIVE, SING_BACK, DRAG_X, Y0, dimAt,
} from "./story";
import { OLD, TOMMY, miner } from "./outfits";
import { drawNarrator, NarrOpts } from "./narrator";
import { fxCage, bird, fxPick, fxGas, fxWatch, fxCough, BirdState } from "./fxcanary";
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
let LNAME: "day" | "golden" | "mine" = "day";
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
const CONTACT: Record<"day" | "golden" | "mine", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], mine: [0.18, 0.14, 0.18] };
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

// ---------------- the canary short: cast by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const OLDW: Who = { i: 3, o: OLD, okey: "old" };
const TOMW: Who = { i: 5, o: TOMMY, okey: "tommy" };
const MIN = (v: number): Who => ({ i: 10 + v, o: miner(v), okey: `m${v}` });
const after = (f: number, f0: number) => f >= f0 - 2;
const FRONT = { side: false, mirror: false };

setBirdHook((p, x, y, s, st) => bird(p, x, y, s, st < 0.5 ? { lying: true, eye: "shut", tilt: 10 } : { open: st > 0.75 ? 1 : 0.3, eye: "dot", wing: 0.5 }));

const stand = (out: Stage, cam: CamInfo, w: Who, pos: V3, fo: FrontOpts, scale = 1, shadow = true) => {
  out.places.push(person(cam, w, pos[0], pos[1], pos[2], FRONT, fo, {}, scale));
  if (shadow) blob(out, pos[0], pos[1], pos[2], scale);
};
const narr = (out: Stage, cam: CamInfo, t: number, pos: V3, o: NarrOpts, talk = true, mirror = false) => {
  const d = cam.pos.distanceTo(tmp.set(pos[0], pos[1] + 1.2, pos[2]));
  const [w, h, k] = tier(d), light = light2D(cam, mirror);
  const op: NarrOpts = { blink: lidAt(t, 500), ...o, light, mouth: talk ? mouthAt(t) : o.mouth ?? -1 };
  if (op.mouth! > 0 && op.expr === "whistle") op.mouth = -1;
  out.places.push({ key: `N|${fkey(op)}|${mirror}`, x: pos[0], y: pos[1], z: pos[2], mirror, size: [w, h, k], draw: (p) => drawNarrator(p, op) });
  blob(out, pos[0], pos[1], pos[2]);
};
/** hanging cage: hook ring at hookY; rot swings it about its centre */
const cage = (out: Stage, x: number, hookY: number, z: number, b: BirdState & { hop?: number }, rot = 0) => {
  const w = 0.36, h = (w * 620) / 400, key = `cage|${fkey(b)}`;
  out.fx.push({ key, cw: 400, ch: 620, draw: (p) => fxCage(p, b), x, y: hookY - h * (0.5 - 24 / 620), z, w, h, rot });
};
/** notes rising from a point: born at each frame in `births`, live 34 f */
const notes = (out: Stage, cam: CamInfo, f: number, src: V3, births: number[], col: string, size = 0.16, drift = 1) => {
  births.forEach((b, n) => {
    const age = (f - b) / 34;
    if (age < 0 || age >= 1) return;
    const pop = Math.min(1, age * 7) * (age > 0.75 ? (1 - age) / 0.25 : 1), kind = n % 2;
    const sx = drift * (0.12 + 0.45 * age);
    out.fx.push({ key: `note${kind}${col}`, cw: 220, ch: 260, draw: (p) => fxNote(p, kind, col), x: src[0] + cam.right.x * sx, y: src[1] + 0.1 + 0.55 * age,
      z: src[2] + cam.right.z * sx + 0.05, w: size * pop, h: size * 1.18 * pop, rot: 0.25 * Math.sin(age * 7 + n) });
  });
};
const every = (f0: number, f1: number, step: number, off = 0) => { const a: number[] = []; for (let f = f0 + off; f < f1; f += step) a.push(f); return a; };
const NAVY = "#1f2a44", GOLD = "#f2b01e";
/** pick strike 0 raised .. 1 struck, struck exactly at frames f0 + n * period */
const strike = (f: number, f0: number, period: number) => q(0.5 + 0.5 * Math.cos((2 * Math.PI * (f - f0)) / period), 12);
const shake = (t: number, i: number, a: number) => q(a * Math.sin(t * 19 + i * 2.1), 3);
const sparks = (out: Stage, f: number, x: number, y: number, z: number, f0: number, period: number) => {
  const n = (((f - f0) % period) + period) % period;
  if (n < 5) out.fx.push({ key: `spark${n}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, n / 5, "#ffd27a", 8, 30, 200), x, y, z, w: 0.55, h: 0.55 });
};

// ---- surface ----
const shot1 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const sing = f >= SING_BACK && f < 116;
  stand(out, cam, OLDW, OLD1, { mode: "stand", expr: f < 60 ? "whistle" : sing ? "grin" : "smile_closed", facing: 1, look: 1, blink: f < 60 ? 0 : lidAt(t, 3), headTilt: f < 60 ? -3 : 2 });
  notes(out, cam, f, [OLD1[0] + 0.25, 1.4, OLD1[2]], [6, 16, 27], NAVY, 0.15, 1);
  const open = sing ? q(Math.abs(Math.sin(((f - SING_BACK) / 11) * Math.PI)), 3) : 0;
  cage(out, POST1[0], 2.05, POST1[2] + 0.05, { open, eye: "dot", hop: f >= 30 && f < 40 ? q(Math.sin(((f - 30) / 10) * Math.PI), 4) : 0, wing: open * 0.6 });
  notes(out, cam, f, [POST1[0] + 0.05, 1.75, POST1[2]], [SING_BACK + 3, SING_BACK + 14, SING_BACK + 26], GOLD, 0.13, 1);
  const pt = smooth((f - 70) / 8) * (1 - smooth((f - 112) / 10));
  narr(out, cam, t, NARR1, { pose: pt > 0.02 ? "point" : "pockets", k: q(Math.max(pt, 0.001), 6), expr: f < 70 ? "smile" : "grin", look: -1, facing: -1 }, true, true);
};
const shot2 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const howl = after(f, 137);
  CREW.forEach((pos, i) => {
    const tease = i === 0 && f >= 191 && f < 222;
    const expr: Expr = tease ? "laugh" : howl ? (i % 2 ? "laugh" : "grin") : "smile";
    stand(out, cam, MIN(i), pos, { mode: "stand", expr, tilt: howl ? shake(t, i, 4) : 0, headTilt: howl ? -4 : 0, blink: howl ? 0 : lidAt(t, 10 + i),
      wave: tease ? q(0.5 + 0.5 * Math.sin(t * 9), 4) : undefined, facing: i === 0 ? 1 : 0, look: i === 0 ? 1 : 0 });
  });
  const big = after(f, 247);
  stand(out, cam, TOMW, TOMMY1, { mode: "stand", expr: howl ? "laugh" : "smile", tilt: howl ? shake(t, 7, big ? 7 : 4) : 0, headTilt: big ? -9 : -3, blink: 0 });
};
// ---- underground ----
const face = (out: Stage, cam: CamInfo, t: number, f: number, working: boolean, oldWork: boolean, tom: Expr = "neutral") => {
  const pers = [27, 31, 25];
  MINERSM.forEach((pos, i) => {
    const k = working ? strike(f, 327 + 6 * i, pers[i]) : 0.25;
    stand(out, cam, MIN(i), pos, { mode: "stand", expr: "stern", prop: ["pick", k], facing: -1, blink: lidAt(t, 10 + i) });
    if (working) sparks(out, f, pos[0] - 0.55, pos[1] + 1.1, pos[2], 327 + 6 * i, pers[i]);
  });
  const kt = working ? strike(f, 327, 29) : 0.25;
  stand(out, cam, TOMW, TOMMYM, { mode: "stand", expr: tom, prop: ["pick", kt], facing: -1, blink: lidAt(t, 5) });
  if (working) sparks(out, f, TOMMYM[0] - 0.6, Y0 + 1.15, TOMMYM[2], 327, 29);
  if (oldWork) {
    stand(out, cam, OLDW, OLDM, { mode: "stand", expr: "stern", prop: ["pick", strike(f, 330, 30)], facing: -1, blink: lidAt(t, 3) });
    sparks(out, f, OLDM[0] - 0.6, Y0 + 1.1, OLDM[2], 330, 30);
  }
};
const quietCage = (out: Stage, b: BirdState, rot = 0) => cage(out, CAGEM[0], CAGEM[1], CAGEM[2], b, rot);
const shot3 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const work = f < 392;
  face(out, cam, t, f, work, work);
  if (!work) stand(out, cam, OLDW, OLDM, { mode: "stand", expr: "neutral", prop: ["pick", 0.25], facing: -1, look: -1, blink: lidAt(t, 3) });
  quietCage(out, { eye: "dot" });
};
const shot4 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  face(out, cam, t, f, true, false);
  const whistling = (f >= 468 && f < 500) || (f >= 517 && f < 540) || (f >= 549 && f < 575);
  const worry = after(f, 583);
  stand(out, cam, OLDW, OLDM, { mode: "stand", expr: whistling ? "whistle" : worry ? "nervous" : "neutral", prop: ["pick", 0.2], facing: -1, look: -1,
    headTilt: whistling ? -4 : 0, blink: whistling ? 0 : lidAt(t, 3) });
  notes(out, cam, f, [OLDM[0] - 0.25, Y0 + 1.42, OLDM[2]], [470, 482, NOTES_OLD[0], NOTES_OLD[1]], "#f4ead0", 0.15, -1);
  const sw = f >= 610 ? q(16 * Math.sin(((f - 610) / 26) * Math.PI) * smooth((f - 610) / 10), 2) : 0;
  quietCage(out, { eye: f >= 628 ? "dazed" : f >= 600 ? "half" : "dot", tilt: sw }, q(sw * 0.004, 50));
  narr(out, cam, t, NARRM, { pose: "pockets", expr: worry ? "worried" : "neutral", look: 1, lookY: -0.5 }, false);
};
const shot5 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  // the old man: pick held up, then let go (@686); then shoving the men toward the shaft
  if (f < 715) {
    const dropped = f >= DROP;
    stand(out, cam, OLDW, OLDM, { mode: "stand", expr: dropped ? "stern" : "shock", prop: dropped ? null : ["pick", 0.05], facing: 1, blink: lidAt(t, 3) });
    if (dropped) {
      const u = clamp01((f - DROP) / 9), x = OLDM[0] + 0.45 + 0.15 * u, y = Y0 + 1.45 - 1.2 * u * u, rot = -0.4 - 1.3 * u;
      out.fx.push({ key: "pick", cw: 400, ch: 400, draw: (p) => fxPick(p), x, y: Math.max(Y0 + 0.28, y), z: OLDM[2] + 0.15, w: 0.75, h: 0.75, rot });
      if (f >= DROP + 9 && f < DROP + 24) { const v = q((f - DROP - 9) / 15, 15); out.fx.push({ key: `dust${v}`, cw: 300, ch: 300, draw: (p) => fxCough(p, v, "rgba(110,90,78,"), x: x - 0.1, y: Y0 + 0.3, z: OLDM[2] + 0.25, w: 0.8, h: 0.8, soft: true }); }
    }
    face(out, cam, t, f, true, false);
  } else if (f < 780) {
    const go = (f - 715) / FPS;
    [[0, 1.2], [1, -0.9], [2, 0.3]].forEach(([i, z], n) => {
      const x = -84.0 + 1.25 * go + 0.9 * n;
      stand(out, cam, MIN(i), [x, Y0, z], { mode: "stroll", phase: q((go * 1.6 + n * 0.3) % 1, 30), expr: n === 1 ? "nervous" : "neutral", blink: lidAt(t, 10 + i), look: -1 });
    });
    stand(out, cam, OLDW, [-85.3 + 1.25 * go, Y0, 0.3], { mode: "stroll", phase: q((go * 1.6) % 1, 30), expr: "stern", wave: q(0.6 + 0.4 * Math.sin(go * 8), 4), blink: lidAt(t, 3) });
    stand(out, cam, TOMW, TOMMYM, { mode: "stand", expr: after(f, 787) ? "laugh" : "grin", prop: ["pick", 0.25], facing: 1, blink: 0 });
  } else {
    const shy = after(f, 824);
    stand(out, cam, TOMW, TOMMYM, { mode: "stand", expr: shy ? "grin" : "laugh", prop: ["pick", 0.25], facing: 1, look: 1, tilt: shake(t, 5, shy ? 2 : 5),
      headTilt: shy ? 6 : -6, blink: 0 });
    quietCage(out, { eye: "dazed", tilt: q(14 * Math.sin(t * 4), 2) }, q(0.05 * Math.sin(t * 4), 50));
  }
};
const shot6 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const x = DRAG_X(f), ph = q((t * 1.0) % 1, 30);
  const side = (w: Who, xx: number, z: number, so: SideOpts) => {
    const view = viewOf(cam, xx, z, 1, 0);
    out.places.push(person(cam, w, xx, Y0, z, view, { mode: "stroll", phase: ph, expr: so.expr }, { mode: "march", phase: ph, stride: 0.84 * view.fs, stomp: 0.6, ...so }));
    blob(out, xx, Y0, z);
  };
  side(OLDW, x + 0.6, 0, { expr: "stern", reach: true, blink: lidAt(t, 3) });
  side(TOMW, x - 0.45, -0.2, { expr: "nervous", leanAdd: -12, phase: q((t * 1.0 + 0.5) % 1, 30) });
  side(MIN(2), x + 3.2, -0.5, { expr: "nervous", phase: q((t * 1.0 + 0.25) % 1, 30) });
};
const shot7 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const go = (f - 962) / FPS;
  const walker = (w: Who, x0: number, z: number, n: number, fall?: number) => {
    const fallen = fall !== undefined && f >= fall, tf = fall !== undefined ? Math.min(go, (fall - 962) / FPS) : go;
    const x = x0 + 0.7 * tf;
    if (!fallen) stand(out, cam, w, [x, Y0, z], { mode: "stroll", phase: q((go * 1.6 + n * 0.37) % 1, 30), expr: n < 2 ? "stern" : "nervous", blink: lidAt(t, w.i), look: n === 1 ? -1 : 0 });
    else {
      const u = clamp01((f - fall!) / 8);
      if (u < 1) stand(out, cam, w, [x, Y0, z], { mode: "stand", expr: "dazed", tilt: q(-28 * u, 2), blink: 0 });
      else stand(out, cam, w, [x + 0.15, Y0, z], { mode: "sit", expr: "dazed", tilt: q(-8 + 3 * Math.sin(t * 3), 2), blink: 0 });
    }
  };
  walker(OLDW, -67.5, 0.45, 0);
  walker(TOMW, -68.3, -0.5, 1);
  walker(MIN(0), -70.6, 0.9, 2, STUMBLE[0]);
  walker(MIN(1), -72.8, -0.8, 3, STUMBLE[1]);
  const a = q(0.13 * smooth((f - 975) / 30), 20);
  if (a > 0) [[-72, 0.2], [-76, -0.6], [-80, 0.5]].forEach(([x, z], i) => {
    const u = q((t * 0.15 + i * 0.3) % 1, 30);
    out.fx.push({ key: `gas${u}|${a}`, cw: 600, ch: 600, draw: (p) => fxGas(p, u, a), x, y: Y0 + 1.2, z, w: 3.2, h: 2.2, soft: true });
  });
};
// ---- at the top ----
const coughs = (out: Stage, cam: CamInfo, f: number, src: V3, births: number[], col = "rgba(70,62,58,") => births.forEach((b) => {
  const n = f - b;
  if (n < 0 || n >= 16) return;
  const v = q(n / 16, 16);
  out.fx.push({ key: `cough${v}${col}`, cw: 300, ch: 300, draw: (p) => fxCough(p, v, col), x: src[0] + cam.right.x * 0.18, y: src[1], z: src[2] + cam.right.z * 0.18 + 0.1, w: 0.5, h: 0.5, soft: true });
});
const COUGH = [1123, 1134, 1147, 1160, 1186, 1214];
const tommyKneel = (out: Stage, cam: CamInfo, t: number, f: number, better = false) => {
  const c = COUGH.some((b) => f >= b && f < b + 6);
  stand(out, cam, TOMW, KNEEL, { mode: "sit", expr: better ? "relief" : c ? "pained" : "nervous", tilt: c ? -10 : -4, headTilt: c ? -6 : 0, blink: lidAt(t, 5), facing: -1 });
  if (!better) coughs(out, cam, f, [KNEEL[0] - 0.05, 0.95, KNEEL[2]], COUGH);
};
const shot8 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  tommyKneel(out, cam, t, f);
  stand(out, cam, OLDW, OLD9, { mode: "stand", expr: "nervous", prop: ["bird", 0], facing: 1, look: 1, blink: lidAt(t, 3) });
  stand(out, cam, MIN(3), [4.6, 0, 3.4], { mode: "stand", expr: "nervous", facing: -1, look: -1, blink: lidAt(t, 13) });
  stand(out, cam, MIN(4), [5.4, 0, 2.6], { mode: "stand", expr: "pained", facing: -1, blink: lidAt(t, 14) });
  narr(out, cam, t, [-0.6, 0, 3.1], { pose: "pockets", expr: "worried", look: 1 }, false);
};
const shot9 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const blowing = BREATH.some((b) => f >= b - 2 && f < b + 12), alive = after(f, REVIVE);
  const expr: Expr = alive ? (f < REVIVE + 10 ? "shock" : "relief_open") : blowing ? "whistle" : "nervous";
  stand(out, cam, OLDW, OLD9, { mode: "stand", expr, prop: ["bird", alive ? (Math.floor((f - REVIVE) / 6) % 2 ? 0.6 : 1) : 0], headTilt: blowing ? 10 : alive ? -3 : 5,
    blink: blowing || alive ? 0 : lidAt(t, 3), facing: 0 });
  coughs(out, cam, f, [OLD9[0] - 0.2, 1.35, OLD9[2] + 0.1], BREATH.map((b) => b + 1), "rgba(235,240,255,");
  notes(out, cam, f, [OLD9[0], 1.05, OLD9[2] + 0.1], every(REVIVE + 2, 1360, 11), GOLD, 0.14, 1);
  tommyKneel(out, cam, t, f, alive);
};
// ---- the Narrator explains ----
const shot10 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  let pose: NarrOpts["pose"] = "explain", expr: NarrOpts["expr"] = "talk", k = smooth((f - 1366) / 8), look = 1, mirror = false;
  if (f >= 1460 && f < 1516) { pose = f < 1492 ? "think" : "shrug"; expr = f < 1492 ? "think" : "neutral"; k = f < 1492 ? smooth((f - 1462) / 7) : smooth((f - 1492) / 6); }
  else if (f >= 1516 && f < 1598) { pose = "point"; expr = f < 1560 ? "talk" : "worried"; k = smooth((f - 1518) / 6); }
  else if (f >= 1598) { pose = "pockets"; expr = "serious"; k = 1; look = 0; }
  narr(out, cam, t, NARR10, { pose, expr, k: q(Math.max(k, 0.001), 6), look, facing: 1 }, true, mirror);
  // the cage on its post: happy bird until the gas reaches it, then woozy
  const woozy = f >= 1546 && f < 1600;
  const sw = woozy ? q(16 * Math.sin(((f - 1546) / 24) * Math.PI) * smooth((f - 1546) / 8), 2) : 0;
  const sing = f < 1460 && Math.floor(f / 9) % 3 === 0;
  cage(out, POST10[0], 2.05, POST10[2] + 0.05, { eye: woozy ? (f > 1562 ? "dazed" : "half") : "dot", tilt: sw, open: sing ? 1 : 0 }, q(sw * 0.004, 50));
  if (f < 1460) notes(out, cam, f, [POST10[0] + 0.05, 1.75, POST10[2]], [1372, 1398, 1424], GOLD, 0.13, 1);
  // the gas: faint swirls the miners could not see or smell
  const a = q(0.3 * smooth((f - 1464) / 14), 20);
  if (a > 0 && f < 1600) [[-6.8, 5.6], [-5.6, 5.3], [-4.6, 5.7]].forEach(([x, z], i) => {
    const u = q((t * 0.2 + i * 0.33) % 1, 30);
    out.fx.push({ key: `gas${u}|${a}`, cw: 600, ch: 600, draw: (p) => fxGas(p, u, a), x, y: 1.4, z, w: 2.6, h: 2.0, soft: true });
  });
  if (f >= 1630) {
    const pop = q(smooth((f - 1630) / 6), 6), hand = q(0.05 + (f - 1630) / 120, 60);
    out.fx.push({ key: `watch${hand}`, cw: 400, ch: 480, draw: (p) => fxWatch(p, hand), x: NARR10[0] - 0.62, y: 1.55, z: NARR10[2] + 0.2, w: 0.42 * pop, h: 0.5 * pop, rot: 0.05 * Math.sin(t * 3) });
  }
};
// ---- the whole crew whistles ----
const shot11 = (out: Stage, cam: CamInfo, t: number, f: number) => {
  const go = f >= 1702;
  const crew: Who[] = [MIN(0), OLDW, MIN(1), MIN(2), MIN(3), MIN(4)];
  crew.forEach((w, i) => {
    const pos = LINE[i];
    stand(out, cam, w, pos, { mode: "stand", expr: go ? "whistle" : "smile_closed", tilt: go ? q(3 * Math.sin(t * 5 + i), 3) : 0, headTilt: go ? -3 : 0, blink: go ? 0 : lidAt(t, w.i) });
    if (go) notes(out, cam, f, [pos[0] + 0.22, 1.42, pos[2]], every(1704, 1845, 26, i * 5), NAVY, 0.13, 1);
  });
  const loud = after(f, 1774);
  stand(out, cam, TOMW, TOMMY11, { mode: "stand", expr: go ? "whistle" : "smile", tilt: go ? q((loud ? 6 : 3) * Math.sin(t * 6), 3) : 0, headTilt: loud ? -8 : -3, blink: 0,
    wave: loud ? q(0.5 + 0.5 * Math.sin(t * 7), 4) : undefined });
  if (go) notes(out, cam, f, [TOMMY11[0] + 0.24, 1.45, TOMMY11[2]], loud ? every(1776, 1845, 7) : every(1706, 1774, 16), "#c9373a", loud ? 0.24 : 0.15, 1);
  cage(out, POST1[0], 2.05, POST1[2], { open: go && Math.floor(f / 8) % 2 ? 1 : 0, eye: "dot" });
  if (go) notes(out, cam, f, [POST1[0], 1.75, POST1[2]], every(1710, 1845, 20), GOLD, 0.11, -1);
  const wave = f >= 1812;
  narr(out, cam, t, NARR11, { pose: wave ? "wave" : "pockets", k: q(smooth((f - 1812) / 8), 6) || 0.001, expr: wave ? "grin" : go ? "whistle" : "smile", look: -1, facing: -1 }, false);
  if (go && !wave) notes(out, cam, f, [NARR11[0] + 0.25, 1.5, NARR11[2]], every(1712, 1812, 24), NAVY, 0.13, 1);
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, _ts: number | null, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  void dimAt;
  switch (id) {
    case 1: shot1(out, cam, t, f); break;
    case 2: shot2(out, cam, t, f); break;
    case 3: shot3(out, cam, t, f); break;
    case 4: shot4(out, cam, t, f); break;
    case 5: shot5(out, cam, t, f); break;
    case 6: shot6(out, cam, t, f); break;
    case 7: shot7(out, cam, t, f); break;
    case 8: shot8(out, cam, t, f); break;
    case 9: shot9(out, cam, t, f); break;
    case 10: shot10(out, cam, t, f); break;
    case 11: shot11(out, cam, t, f); break;
  }
  return out;
};
export { FPS, D0, clamp01 };
