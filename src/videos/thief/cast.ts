// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPuff, Outfit, Expr, FrontOpts, SideOpts, Item, Pose, rrect,
  fxThing, fxNoteBig, fxPaper, fxIdCard, fxSoap, fxStopwatch, fxKeySide, fxLaugh, fxGlint, fxHeart, fxBill, fxSpark, INK,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, smooth, clamp01, camAt, STATION, MAILBOX, DOOR, WIN, LOCK, NEWS, DEN, DESK, PILE, KTABLE, DTABLE, MARK_X, NAR_X, NAR4, PARADE_X,
  LIFT, POST1, POST2, ITEMS, NOTE_UP, NOTE_IN, WALLET_SHUT, GENTLEMAN, RETURNING, CLONES, ALL_AT_ONCE, KEY_IN, KEY_TURN, DOOR_OPEN, ID_OUT, KEY_OUT, GLINT,
  PRESS0, PRESS1, PILE_N, easeOut,
} from "./story";
import { LName } from "./lights";
import { NARRATOR, COP, CHIEF, citizen } from "./people";
import { DOORS } from "./build";
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
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean; euler?: [number, number, number] };
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
let LNAME: LName = "day";
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
const CONTACT: Record<LName, [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.2, 0.2, 0.36], room: [0.26, 0.22, 0.28] };
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

// ---------------- cast and staging by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const NAR: Who = { i: 7, o: NARRATOR, okey: "nar" };
const FOLKS = Array.from({ length: 12 }, (_, v) => citizen(v));
const folk = (i: number): Who => ({ i: 20 + i, o: FOLKS[i % 12], okey: `c${i % 12}` });
const COPS: Who[] = [{ i: 41, o: COP, okey: "cop" }, { i: 42, o: CHIEF, okey: "chief" }, { i: 43, o: { ...COP, skin: "#ecd0b6" }, okey: "cop2" }];
const OWNER: Who = { i: 51, o: { ...citizen(4), hat: "hair", hair: "#6a4a3a", jacket: "#3f6fb5", dress: undefined }, okey: "owner" };
const PJ: Who = { i: 52, o: { jacket: "#9cc4e8", pants: "#9cc4e8", boots: "#c9a07a", skin: "#f5c9a0", hat: "hair", hair: "#2a2220", buttons: "#ffffff", hands: true }, okey: "pj" };
const swap = (t: number, f: number) => t >= f / FPS - LEAD;
const ramp = (f: number, a: number, b: number) => smooth((f - a) / (b - a));
const hold = (f: number, a: number, b: number, c: number, d: number) => Math.min(ramp(f, a, b), 1 - ramp(f, c, d));

/** a front-view character standing (or strolling in place) at p, with a contact shadow */
const stand = (out: Stage, cam: CamInfo, t: number, w: Who, p: V3, fo: FrontOpts, scale = 1, swaps: number[] = []) => {
  const o: FrontOpts = { mode: "stand", blink: lidAt(t, w.i, swaps), ...fo };
  if (o.expr === "laugh" || o.expr === "grin" || o.expr === "content" || o.expr === "smile_closed" || o.expr === "relief") o.blink = 0;
  out.places.push(person(cam, w, p[0], p[1], p[2], { side: false, mirror: false }, o, {}, scale));
  if (p[1] >= 0) blob(out, p[0], p[1], p[2], scale);
};
/** side view walker along +x (or -x) */
const walk = (out: Stage, cam: CamInfo, t: number, w: Who, x: number, y: number, z: number, dir: number, speed: number, so: SideOpts = {}, scale = 1) => {
  const phase = q(((t * speed) / 1.4 + hh(w.i, 9)) % 1, 120), view = viewOf(cam, x, z, dir, 0);
  const s2: SideOpts = { mode: "march", phase, stomp: 0.55, stride: 0.875 * Math.max(0.3, view.fs), blink: lidAt(t, w.i), ...so };
  const fo: FrontOpts = { mode: "stroll", phase, expr: s2.expr, blink: s2.blink };
  out.places.push(person(cam, w, x, y, z, view, fo, s2, scale));
  blob(out, x, y, z, scale);
};
/** generic effect card helper */
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, o: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...o });
/** flat card lying on a table top: (dx, dz) from its centre */
const onTable = (out: Stage, top: V3, key: string, cw: number, ch: number, draw: (p: Pen) => void, dx: number, dz: number, w: number, h: number, rot = 0, lift = 0.002) =>
  card(out, key, cw, ch, draw, [top[0] + dx, top[1] + lift, top[2] + dz], w, h, { flat: true, rot });
const thing = (it: Item) => (p: Pen) => fxThing(p, it);

/** townsfolk strolling the two pavements (side view), kept clear of the lens */
const strollers = (out: Stage, cam: CamInfo, t: number, x0: number, x1: number, n: number, base: number) => {
  for (let i = 0; i < n; i++) {
    const dir = i % 2 ? 1 : -1, sp = 0.9 + 0.4 * hh(i + base, 6), span = x1 - x0;
    const x = x0 + ((((hh(i + base, 7) * span + dir * sp * t) % span) + span) % span), z = dir > 0 ? 0.7 + 0.8 * hh(i, 8) : 12.6 + 0.9 * hh(i, 8);
    if (cam.pos.distanceTo(tmp.set(x, 1, z)) < 4) continue;
    walk(out, cam, t, folk(base + i), x, 0.12, z, dir, sp, { expr: (["smile", "neutral", "smile_closed", "talk"] as Expr[])[i % 4] });
  }
};
const face = (o: Outfit, expr: Expr) => (p: Pen) => bodyFront(p, o, { mode: "stand", expr, seed: 3 });
const NFACE = face(NARRATOR, "smile");
const paper = (gent: boolean) => (p: Pen) => fxPaper(p, gent, NFACE);

// ---- shot pieces ----
const copsLaugh = (out: Stage, cam: CamInfo, t: number, f: number, k = 1) => {
  const spots: V3[] = [[-1.4, 0.12, 13.45], [0.2, 0.12, 13.0], [1.7, 0.12, 13.4]];
  spots.forEach((p, i) => {
    const sh = Math.sin(t * 13 + i * 2.1);
    stand(out, cam, t, COPS[i], p, { expr: "laugh", pose: i === 1 ? "belly" : i === 0 ? "slap" : "belly", tilt: q(k * (4 * sh - 3 * (i - 1)), 4), headTilt: q(k * 5 * Math.sin(t * 9 + i), 4) });
    if (i === 1) card(out, `laugh${q((t * 3) % 1, 12)}`, 500, 300, (pp) => fxLaugh(pp, q((t * 3) % 1, 12)), [p[0] + 0.0, 1.65, p[2] + 0.05], 0.75, 0.45);
  });
  void f;
};
const desk = (out: Stage, f: number, items: { cash?: number; cards?: number; photos?: number; receipt?: number }, wallet: "walletOpen" | "wallet" | null = "walletOpen") => {
  if (wallet) onTable(out, DESK, wallet, 512, 512, thing(wallet), 0, 0.04, wallet === "wallet" ? 0.24 : 0.38, wallet === "wallet" ? 0.24 : 0.38, 0.05, 0.003);
  const slide = (f0: number | undefined, to: [number, number], key: string, cw: number, ch: number, draw: (p: Pen) => void, w: number, h: number, rot: number, lift: number) => {
    if (f0 === undefined || f < f0) return;
    const u = easeOut((f - f0) / 9);
    onTable(out, DESK, key, cw, ch, draw, to[0] * u, 0.04 + (to[1] - 0.04) * u, w, h, rot * u, lift);
  };
  slide(items.cash, [-0.26, -0.06], "cash", 512, 512, thing("cash"), 0.3, 0.3, -0.25, 0.004);
  slide(items.cards, [0.24, -0.1], "bankcards", 400, 300, (p) => {
    p.poly(rrect(20, 40, 300, 220, 18), "#3f6fb5", 8); p.poly(rrect(50, 90, 110, 140, 6), "#e2b84a", 5);
    p.poly(rrect(90, 70, 380, 260, 18), "#d8433a", 8); p.poly(rrect(120, 120, 180, 170, 6), "#e2b84a", 5); p.stroke([[130, 220], [340, 220]], 8, "#f3e0d0");
  }, 0.2, 0.15, 0.18, 0.005);
  slide(items.photos, [-0.2, 0.22], "photo", 512, 512, thing("photo"), 0.24, 0.24, 0.15, 0.006);
  slide(items.receipt, [0.22, 0.22], "receipt", 300, 420, (p) => {
    p.poly([[30, 20], [270, 34], [252, 120], [280, 210], [244, 300], [262, 400], [40, 392], [62, 300], [24, 200], [52, 110]], "#fbf8f1", 7);
    for (let i = 0; i < 9; i++) p.stroke([[70, 70 + i * 34], [70 + 100 + ((i * 37) % 60), 64 + i * 34 + (i % 2) * 6]], 6, "#8a8a94");
    p.stroke([[60, 230], [240, 120]], 3, "#d9d2c4"); p.stroke([[80, 330], [230, 260]], 3, "#d9d2c4");
  }, 0.13, 0.18, -0.3, 0.007);
};
const ALL_ITEMS = { cash: 0, cards: 0, photos: 0, receipt: 0 };
const narAtDesk = (out: Stage, cam: CamInfo, t: number, fo: FrontOpts, swaps: number[] = []) =>
  stand(out, cam, t, NAR, [DEN[0], 0, DEN[2] - 2.1], fo, 1, swaps);

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  const c = camAt(id, f), fwd = new THREE.Vector3(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]).normalize();
  const before = (d: number): V3 => [c.pos[0] + fwd.x * d, c.pos[1] + fwd.y * d, c.pos[2] + fwd.z * d];
  switch (id) {
    case 1: copsLaugh(out, cam, t, f); strollers(out, cam, t, -30, 30, 6, 0); break;
    case 2: {
      stand(out, cam, t, NAR, [30, 0, 7], { expr: f < 96 ? "smile" : "grin", pose: "holdUp", poseK: ramp(f, 84, 98), item: "key", look: 0 });
      break;
    }
    case 3: {
      out.places.push(person(cam, folk(2), 10.0, 0.12, 1.0, { side: true, mirror: false }, {}, { mode: "stand", expr: "smile", wallet: true, blink: lidAt(t, 22) }));
      blob(out, 10.0, 0.12, 1.0);
      strollers(out, cam, t, -10, 30, 6, 3);
      break;
    }
    case 4: {
      const mx = MARK_X(f);
      walk(out, cam, t, folk(2), mx, 0.12, 1.0, 1, 1.05, { expr: "smile", wallet: f < LIFT });
      if (f < 266) {
        const nx = NAR_X(f), reach = hold(f, 244, 255, 258, 264);
        if (reach > 0.02) {
          out.places.push(person(cam, NAR, nx, 0.12, 1.05, { side: true, mirror: false }, {}, { mode: "push", pose: q(reach, 20), expr: "squint", item: f >= LIFT ? "wallet" : undefined, blink: 0 }));
          blob(out, nx, 0.12, 1.05);
        } else walk(out, cam, t, NAR, nx, 0.12, 1.05, 1, 1.05, { expr: f < LIFT ? "squint" : "grin", item: f >= LIFT ? "wallet" : undefined });
      } else stand(out, cam, t, NAR, [NAR4, 0.12, 1.05], { expr: f < 272 ? "grin" : "wink", pose: "holdUp", poseK: ramp(f, 266, 274), item: "wallet" });
      strollers(out, cam, t, -6, 30, 4, 9);
      break;
    }
    case 5: case 26: {
      const p0 = id === 5 ? 294 : 2298, pp = id === 5 ? POST1 : POST2;
      const k = hold(f, p0, pp - 8, pp + 6, pp + 18);
      const after = f >= pp + 18;
      stand(out, cam, t, NAR, [MAILBOX[0] - 0.62, 0.12, MAILBOX[2] - 0.1], {
        expr: after ? (id === 26 ? "wink" : "smile_closed") : "smile", pose: after ? "pockets" : "post", poseK: after ? ramp(f, pp + 18, pp + 26) : k,
        item: f < pp ? "envelope" : undefined, look: after ? 0 : 1 });
      if (id === 26) strollers(out, cam, t, 0, 50, 4, 30);
      break;
    }
    case 6: {
      desk(out, f, ITEMS);
      break;
    }
    case 7: {
      desk(out, f, ALL_ITEMS, null);
      narAtDesk(out, cam, t, { expr: f < 530 ? "smile" : "content", pose: "hold", item: "walletOpen" });
      break;
    }
    case 8: {
      if (f < 634) {
        desk(out, f, ALL_ITEMS, null);
        narAtDesk(out, cam, t, { expr: f < 598 ? "smile" : "wink", pose: "holdUp", poseK: ramp(f, NOTE_UP - 6, NOTE_UP + 8), item: "note" });
      } else {
        desk(out, f, ALL_ITEMS, f < WALLET_SHUT ? "walletOpen" : "wallet");
        if (f < WALLET_SHUT - 2) {
          const u = easeOut((f - NOTE_IN) / 22);
          onTable(out, DESK, "note", 512, 512, thing("note"), 0.1 - 0.1 * u, 0.32 - 0.26 * u, 0.2 - 0.06 * u, 0.2 - 0.06 * u, 0.4 * (1 - u), 0.01);
        }
        if (f >= WALLET_SHUT && f < WALLET_SHUT + 6) card(out, `burst${q((f - WALLET_SHUT) / 6, 30)}`, 500, 500, (p) => fxBurst(p, q((f - WALLET_SHUT) / 6, 30)), [DESK[0], DESK[1] + 0.03, DESK[2] + 0.04], 0.4, 0.4);
      }
      break;
    }
    case 9: {
      const ex: Expr = f < 704 ? "neutral" : f < 736 ? "shock" : "worried";
      stand(out, cam, t, OWNER, [DOOR[0] + 0.85, 0.12, 0.75], { expr: ex, pose: "hold", item: "note", look: f < 724 ? 0 : -1 }, 1, [704 / FPS, 736 / FPS]);
      if (f >= 724) {
        const k = q(clamp01((f - 726) / 32), 30), p = before(0.95);
        card(out, `noteBig${k}`, 600, 520, (pp) => fxNoteBig(pp, k, 1), [p[0] + 0.03, p[1] - 0.1, p[2]], 0.3, 0.26, { rot: 0.05 });
      }
      break;
    }
    case 10: {
      if (f < 823) {
        stand(out, cam, t, { i: 61, o: citizen(7), okey: "newsboy" }, NEWS, { expr: f < 784 ? "talk" : "grin", pose: "holdUp", item: "paper", poseK: 1, tilt: q(3 * Math.sin(t * 8), 4) });
        strollers(out, cam, t, -40, 0, 6, 12);
        if (f >= 786) {
          const u = clamp01((f - 786) / 36), e = u * u, a: V3 = [NEWS[0] + 0.45, 1.5, NEWS[2] + 0.1], b = before(0.9);
          const p: V3 = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
          card(out, "paper0", 640, 860, paper(false), p, 0.3 + 0.3 * e, 0.4 + 0.4 * e, { rot: q(u * 14, 10) });
        }
      } else {
        strollers(out, cam, t, -40, 0, 6, 12);
        const g = f >= GENTLEMAN, p = before(1.0);
        card(out, g ? "paper1" : "paper0", 640, 860, paper(g), p, 0.42, 0.56, { rot: q(0.04 * Math.sin(t * 2), 100) });
        if (f >= GENTLEMAN - 1 && f < GENTLEMAN + 12) {
          const u = q((f - GENTLEMAN + 1) / 13, 20);
          card(out, `puff${u}`, 300, 300, (pp) => fxPuff(pp, u), [p[0] - fwd.x * 0.05, p[1] + 0.12, p[2] - fwd.z * 0.05], 0.3, 0.3, { soft: true });
        }
      }
      break;
    }
    case 11: copsLaugh(out, cam, t, f, 1.4); strollers(out, cam, t, -30, 30, 6, 0); break;
    case 12: {
      const sp: V3[] = [[-1.4, 0.12, 13.45], [0.2, 0.12, 13.0], [1.7, 0.12, 13.4]];
      if (f < RETURNING) {
        stand(out, cam, t, COPS[1], sp[1], { expr: f < 975 ? "worried" : "think", pose: "shrug", poseK: ramp(f, 950, 960), headTilt: q(6 * smooth((f - 950) / 10), 4) }, 1, [975 / FPS]);
        stand(out, cam, t, COPS[0], sp[0], { expr: "smile_closed" }); stand(out, cam, t, COPS[2], sp[2], { expr: "smile" });
      } else {
        const lol = f >= 1028;
        stand(out, cam, t, COPS[2], sp[2], { expr: lol ? "laugh" : "serious", pose: lol ? "belly" : "holdUp", item: lol ? undefined : "wallet", poseK: 1, tilt: lol ? q(4 * Math.sin(t * 13), 4) : 0 });
        stand(out, cam, t, COPS[1], sp[1], { expr: "laugh", pose: "belly", tilt: q(4 * Math.sin(t * 12 + 1), 4) });
        stand(out, cam, t, COPS[0], sp[0], { expr: "laugh", pose: "slap", tilt: q(4 * Math.sin(t * 11 + 2), 4) });
      }
      break;
    }
    case 13: {
      if (f < 1176) {
        for (let i = 0; i < 7; i++) {
          const x = PARADE_X(f) + i * 0.95 - 0.5 + 0.25 * hh(i, 3), z = i % 2 ? 1.3 : 0.7;
          walk(out, cam, t, folk(i + 1), x, 0.12, z, 1, 1.0, { expr: (["smile", "smile_closed", "grin", "smile"] as Expr[])[i % 4], wallet: true });
        }
        strollers(out, cam, t, -20, 40, 4, 40);
      } else {
        const x = PARADE_X(1190) + 6.1;
        stand(out, cam, t, folk(1), [x, 0.12, 0.9], { expr: f < 1190 ? "smile_closed" : "wink", pose: "holdUp", poseK: ramp(f, 1180, 1192), item: "wallet", look: -1 });
        walk(out, cam, t, folk(5), x - 2.4 + (f - 1176) / FPS, 0.12, 1.4, 1, 1.0, { expr: "smile", wallet: true });
      }
      break;
    }
    case 14: {
      const z = DTABLE[2] - 0.95, x = DTABLE[0];
      stand(out, cam, t, folk(4), [x, 0, z], { expr: f < 1262 ? "smile" : "grin", pose: "holdUp", poseK: ramp(f, 1232, 1246), item: "note", tilt: q(-3 * smooth((f - 1262) / 8), 4) });
      stand(out, cam, t, folk(1), [x - 0.8, 0, z + 0.05], { expr: f < 1270 ? "talk" : "shock", pose: "hold", item: undefined, look: 1 });
      stand(out, cam, t, folk(6), [x + 0.82, 0, z - 0.02], { expr: "laugh", pose: "belly", tilt: q(3 * Math.sin(t * 12), 4) });
      stand(out, cam, t, folk(9), [x - 1.6, 0, z - 0.05], { expr: "smile_closed", pose: "cheer", poseK: 0.5 + 0.5 * Math.abs(Math.sin(t * 7)) });
      stand(out, cam, t, folk(3), [x + 1.62, 0, z + 0.04], { expr: f < 1280 ? "smile" : "shock", look: -1 });
      break;
    }
    case 15: {
      let n = 100; for (const [f0, k] of PILE_N) if (f >= f0) n = k;
      if (n < 300) stand(out, cam, t, NAR, [PILE[0] - 1.05, 0, PILE[2] + 0.45], { expr: n === 100 ? "content" : "grin", pose: n === 100 ? "pockets" : "point", poseK: n === 100 ? 1 : ramp(f, 1380, 1390), look: 1 });
      else stand(out, cam, t, NAR, [PILE[0] - 0.05, 0.62, PILE[2] + 0.1], { expr: "laugh", pose: "cheer", poseK: ramp(f, 1415, 1424), tilt: q(3 * Math.sin(t * 10), 4) });
      break;
    }
    case 16: {
      if (f < 1520) {
        walk(out, cam, t, NAR, 38 - 0.9 * (f - 1464) / FPS, 0, 8.2, -1, 0.9, { expr: "smile" });
      } else {
        const closer = f >= 1576;
        DOORS.filter((x) => x > 18 && x < 80).forEach((dx, k) => {
          const f0 = CLONES + 3 * k, all = f >= ALL_AT_ONCE;
          if (f < f0) return;
          const p: V3 = [dx + 0.05, 0.12, 0.42];
          if (cam.pos.distanceTo(tmp.set(p[0], 1.2, p[2])) < 3) return;
          stand(out, cam, t, { ...NAR, i: 100 + k }, p, { expr: all ? "grin" : "wink", pose: all ? "reach" : "pockets", poseK: all ? ramp(f, ALL_AT_ONCE, ALL_AT_ONCE + 5) : 1, item: all ? "key" : undefined }, 1);
          if (f < f0 + 10) { const u = q((f - f0) / 10, 20); card(out, `puff${u}`, 300, 300, (pp) => fxPuff(pp, u), [p[0], 1.0, p[2] + 0.2], 1.4, 1.4, { soft: true }); }
          if (all && f < ALL_AT_ONCE + 8 + 2) { const u = q(clamp01((f - ALL_AT_ONCE - 2) / 8), 30); if (u > 0) card(out, `burst${u}`, 500, 500, (pp) => fxBurst(pp, u), [p[0] + 0.3, 1.1, p[2] + 0.1], 0.8, 0.8); }
        });
        void closer;
      }
      break;
    }
    case 17: {
      if (f < 1652) {
        const u = clamp01((f - 1624) / 22);
        if (u > 0 && u < 1) card(out, "glint", 400, 400, fxGlint, [WIN[0] - 0.55 + 1.1 * u, WIN[1], WIN[2] + 0.06], 0.5, 1.2, { soft: true, euler: [0, 0, 0] });
      } else stand(out, cam, t, COPS[0], [DOOR[0] + 0.95, 0.12, 0.55], { expr: f < 1672 ? "squint" : "think", pose: "holdUp", item: "glass", look: -1 });
      break;
    }
    case 18: {
      // key: slides in, turns, and rides the door as it swings
      const open = smooth((f - DOOR_OPEN) / 30) * 1.15, th = -open, hx = DOOR[0] - 0.55, hz = DOOR[2] + 0.07, lx = 0.93, lz = 0.052;
      const kx = hx + lx * Math.cos(th) + lz * Math.sin(th), kz = hz - lx * Math.sin(th) + lz * Math.cos(th);
      const ins = 0.12 * (1 - easeOut((f - KEY_IN) / 12)) - 0.03, turn = -Math.PI / 2 * smooth((f - KEY_TURN) / 7);
      if (f >= KEY_IN - 4) {
        const d = 0.054 + ins; // card centre sits 0.054 m behind the tip
        card(out, "keySide", 600, 220, fxKeySide, [kx - Math.sin(th) * 0 + Math.sin(-th) * 0, LOCK[1], kz + d * Math.cos(th)], 0.12, 0.044, { euler: [0, Math.PI / 2 + th, turn] });
      }
      if (f >= KEY_TURN + 6 && f < KEY_TURN + 14) { const u = q((f - KEY_TURN - 6) / 8, 30); card(out, `burst${u}`, 500, 500, (p) => fxBurst(p, u), [LOCK[0], LOCK[1] + 0.05, LOCK[2] + 0.08], 0.16, 0.16); }
      break;
    }
    case 19: case 20: {
      onTable(out, KTABLE, "note", 512, 512, thing("note"), 0.05, 0.08, 0.16, 0.16, 0.3, 0.004);
      if (id === 20) stand(out, cam, t, PJ, [KTABLE[0], 0, KTABLE[2] - 0.75], { expr: f < 1922 ? "shock" : "sad", pose: "hold", item: "note" }, 1, [1922 / FPS]);
      break;
    }
    case 21: {
      narAtDesk(out, cam, t, { expr: "squint", pose: "shrug", poseK: ramp(f, 1954, 1964) });
      for (let k = 0; k < 6; k++) {
        const u = ((f - 1952) / 45 + hh(k, 2) * 0.6) % 1, x = DEN[0] - 0.7 + 1.4 * hh(k, 3);
        card(out, "bill", 300, 160, fxBill, [x + 0.08 * Math.sin(u * 9 + k), 2.3 - 1.5 * u, DEN[2] - 1.85], 0.2, 0.11, { rot: q(0.6 * Math.sin(u * 7 + k), 20) });
      }
      break;
    }
    case 22: {
      if (f < 2044) narAtDesk(out, cam, t, { expr: f < 2030 ? "talk" : "smile", pose: "two", poseK: ramp(f, 2004, 2014) });
      else { desk(out, f, {}, "walletOpen"); }
      break;
    }
    case 23: {
      desk(out, f, {}, "walletOpen");
      const u = easeOut((f - ID_OUT) / 10), glow = q(ramp(f, 2106, 2114), 10);
      onTable(out, DESK, `id${glow}`, 620, 400, (p) => fxIdCard(p, face(OWNER.o, "neutral"), glow), -0.06, 0.04 - 0.16 * u, 0.24, 0.155, 0.04, 0.008);
      break;
    }
    case 24: {
      desk(out, f, {}, "walletOpen");
      onTable(out, DESK, "id1", 620, 400, (p) => fxIdCard(p, face(OWNER.o, "neutral"), 1), -0.06, -0.12, 0.24, 0.155, 0.04, 0.008);
      const u = easeOut((f - KEY_OUT) / 18);
      onTable(out, DESK, "key", 512, 512, thing("key"), 0.06 + 0.16 * u, 0.04 + 0.08 * u, 0.16, 0.16, 0.5 - 0.3 * u, 0.006);
      if (f >= GLINT && f < GLINT + 12) { const v = q((f - GLINT) / 12, 20); onTable(out, DESK, `spark${v}`, 300, 300, (p) => fxSpark(p, v), 0.27, 0.13, 0.14, 0.14, 0, 0.02); }
      break;
    }
    case 25: {
      const sx = -0.5, sz = 0.1;
      const pressed = f >= PRESS0 && f < PRESS1, done = f >= PRESS1;
      onTable(out, DESK, `soap${done ? 1 : 0}`, 520, 360, (p) => fxSoap(p, done ? 1 : 0), sx, sz, 0.2, 0.14, 0, 0.004);
      const up = f < PRESS0 ? 1 - ramp(f, PRESS0 - 8, PRESS0) : done ? ramp(f, PRESS1, PRESS1 + 8) : 0;
      onTable(out, DESK, "key", 512, 512, thing("key"), sx + 0.02 + (done ? 0.12 * up : 0), sz + 0.0 - 0.03 * up, 0.15 * (1 + 0.15 * up), 0.15 * (1 + 0.15 * up), 0.0, 0.01 + 0.08 * up);
      if (pressed && f < PRESS0 + 6) { const u = q((f - PRESS0) / 6, 30); onTable(out, DESK, `burst${u}`, 500, 500, (p) => fxBurst(p, u), sx, sz, 0.3, 0.3, 0, 0.03); }
      const sec = q(Math.min(30, (30 * (f - 2222)) / 64), 1);
      onTable(out, DESK, `watch${sec}`, 400, 460, (p) => fxStopwatch(p, sec), sx + 0.27, sz - 0.08, 0.13, 0.15, -0.15, 0.004);
      break;
    }
    case 27: stand(out, cam, t, OWNER, [KTABLE[0], 0, KTABLE[2] - 0.75], { expr: f < 2380 ? "think" : "relief", pose: "hold", item: "walletOpen" }, 1, [2380 / FPS]); break;
    case 28: {
      const p: V3 = [DOOR[0] + 0.62, 0.12, 0.35];
      stand(out, cam, t, OWNER, p, { expr: f < 2436 ? "smile" : "content", pose: f < 2436 ? "reach" : "pockets", poseK: f < 2436 ? hold(f, 2412, 2420, 2430, 2436) : ramp(f, 2436, 2444), item: f < 2436 ? "key" : undefined, look: -1 });
      if (f >= 2456) stand(out, cam, t, NAR, [DOOR[0] - 3.55, 0.12, 12.9], { expr: f < 2470 ? "smile" : "wink", pose: "pockets", look: 1 });
      if (f >= 2456) strollers(out, cam, t, 20, 70, 4, 50);
      break;
    }
    case 29: walk(out, cam, t, NAR, 30 + 1.0 * (f - 2490) / FPS, 0, 7.6, 1, 1.0, { expr: "content" }); break;
    case 30: {
      narAtDesk(out, cam, t, { expr: f < 2590 ? "smile" : "content", pose: "hold", item: "letters" });
      for (let k = 0; k < 9; k++) onTable(out, DESK, "env", 512, 512, thing("envelope"), -0.7 + 0.17 * k + 0.03 * hh(k, 1), 0.1 + 0.12 * hh(k, 2), 0.22, 0.22, (hh(k, 3) - 0.5) * 0.8, 0.003 + 0.001 * k);
      for (let k = 0; k < 5; k++) {
        const u = ((f - 2564) / 60 + hh(k, 5)) % 1;
        if (u < 0.05) continue;
        card(out, "heart", 200, 200, fxHeart, [DEN[0] - 0.6 + 0.3 * k, 1.4 + 0.9 * u, DEN[2] - 2.0], 0.12 * Math.min(1, u * 5), 0.12 * Math.min(1, u * 5), { rot: q(0.3 * Math.sin(u * 6 + k), 20) });
      }
      break;
    }
  }
  void INK; void STATION; void D0; void RETURNING; void LOCK; void ID_OUT;
  return out;
};
export { FPS, D0, clamp01 };
