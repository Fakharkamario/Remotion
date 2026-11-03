// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxNote, fxBurst, fxCreak, fxShadow, fxContact, fxPuff, INK, SKINS,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, smooth, clamp01, DECK, H1, SLEEPER, HOST_CABIN, STEWARD, KNOCK_F, TURN_F, OFFICERS, BAND, LOWER, HOST_HALL,
  RAFT, SWIM, LAST, SEA_BOATS, BUST_D, SCRAPE_F, iceX, ICE_Z, BREAK_X, BREAK_F, halvesAt, sinkAt,
} from "./story";
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
  tint(c?: [number, number, number]) { const [r, g, b] = c ?? [1, 1, 1]; this.mat.color.setRGB(r, g, b); this.soft.color.setRGB(r, g, b); }
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
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean;
  /** camera-relative placement [right, up, forward] in metres (busts) */ cam?: [number, number, number];
  tint?: [number, number, number]; upright?: boolean; mirror?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; up?: THREE.Vector3; fwd?: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
// ---------------- 1912: passengers in night clothes, crew, the band ----------------
const PJ = ["#cfdcef", "#e9dcc4", "#d7e6d2", "#efd2d2", "#c9c4e6", "#8a3b4a", "#e6e2f0"];
const HAIR = ["#5a3b2a", "#2a1e1a", "#8a5a2a", "#c9a050", "#3a2a20", "#6a4a30"];
const passenger = (v = 0): Outfit => {
  const o: Outfit = { jacket: PJ[v % 7], pants: PJ[(v + (v % 3 ? 0 : 3)) % 7], boots: "#6a4a3a", hat: "hair", hair: HAIR[v % 6], skin: SKINS[v % 4] };
  if (v % 3 === 1) { const d = ["#f1ebe0", "#e9d6e6", "#dfe6f1", "#8a3b4a", "#5a6a9a"][v % 5]; return { ...o, dress: d, jacket: d }; }
  if (v % 5 === 4) return { ...o, moustache: "#4a3426" };
  return o;
};
const FOLK = Array.from({ length: 14 }, (_, v) => passenger(v));
const STEWARD_O: Outfit = { jacket: "#f1eee6", pants: "#1f2a44", boots: "#1a1820", hat: "hair", hair: "#3a2a20", buttons: "#c9a24a", skin: SKINS[0] };
const OFFICER_O: Outfit = { jacket: "#1d2740", pants: "#1d2740", boots: "#141218", hat: "cap", cap: "#1d2740", buttons: "#d9b45a", build: "stout", moustache: "#e8e4dc", skin: SKINS[2] };
const OFFICER2_O: Outfit = { jacket: "#1d2740", pants: "#1d2740", boots: "#141218", hat: "cap", cap: "#1d2740", buttons: "#d9b45a", skin: SKINS[1] };
const MUSIC = (v: number): Outfit => ({ jacket: "#23262e", pants: "#23262e", boots: "#141218", hat: "hair", hair: HAIR[(v + 1) % 6], buttons: "#f1eee6", skin: SKINS[v % 4], moustache: v % 2 ? "#3a2a20" : undefined });
const BELT = (v: number): Outfit => ({ ...passenger(v), jacket: "#f2efe6", dress: undefined });

// ---------------- the host (the user's character, cut from the sheet) ----------------
export const HOST_IMG: Record<string, HTMLImageElement> = {};
const HOST_H = 1.78; // metres, crown to soles
const tintOf = (light: "day" | "golden", dk = 0): [number, number, number] =>
  (light === "golden" ? [1.0, 0.9, 0.8] : [0.84, 0.88, 1.02]).map((v) => v * (1 - 0.32 * dk)) as [number, number, number];
const hostFx = (name: string): Pick<FxPlace, "key" | "cw" | "ch" | "draw"> | null => {
  const im = HOST_IMG[name];
  if (!im) return null;
  return { key: `host|${name}`, cw: im.naturalWidth, ch: im.naturalHeight, draw: (p) => p.g.drawImage(im, 0, 0) };
};
/** full-body host standing at (x, y, z) in the shot frame, yaw-billboarded */
const hostBody = (out: Stage, name: "front" | "three", x: number, y: number, z: number, tint: [number, number, number], mirror = false) => {
  const h = hostFx(name);
  if (!h) return;
  const w = (HOST_H * h.cw) / h.ch;
  out.fx.push({ ...h, x, y: y + HOST_H / 2 - 0.01, z, w, h: HOST_H, upright: true, tint, mirror });
  blob(out, x, y, z, 1.05);
};
/** bust close-up held in front of the lens: fills the frame width, bottom edge below the frame */
const hostBust = (out: Stage, name: "smile" | "shock" | "think" | "laugh", fov: number, tint: [number, number, number], k = 0.98, dx = 0, mirror = false) => {
  const h = hostFx(name);
  if (!h) return;
  const hh = BUST_D * Math.tan((fov * Math.PI) / 360), hw = hh * (9 / 16), w = 2 * hw * k, ht = (w * h.ch) / h.cw;
  out.fx.push({ ...h, x: 0, y: 0, z: 0, w, h: ht, cam: [dx * hw, -hh - 0.012 + ht / 2, BUST_D], tint, mirror });
};
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

// ---------------- people by shot (positions in the shot's own frame) ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const folk = (i: number): Who => ({ i, o: FOLK[i % FOLK.length], okey: `p${i % FOLK.length}` });
const swap = (t: number, f: number) => t >= f / FPS - LEAD;
const front = (view = false) => ({ side: false, mirror: view });

/** people standing about (front view): [x, y, z, expr, facing?, look?] */
type Spot = [number, number, number, Expr, (-1 | 0 | 1)?, number?];
const standers = (cam: CamInfo, t: number, out: Stage, spots: Spot[], base: number, who: (i: number) => Who = (i) => folk(base + i), opts: (i: number) => Partial<FrontOpts> = () => ({}), noBlob = false) =>
  spots.forEach(([x, y, z, expr, facing, look], i) => {
    const fo: FrontOpts = { mode: "stand", expr, blink: lidAt(t, base + i), look: look ?? Math.round((hh(i + base, 5) - 0.5) * 2), facing: facing ?? 0, ...opts(i) };
    out.places.push(person(cam, who(i), x, y, z, front(), fo, {}));
    if (!noBlob) blob(out, x, y, z);
  });
/** breath in the freezing air: a puff every ~1.4 s drifting up and to the side */
const breath = (cam: CamInfo, t: number, out: Stage, x: number, y: number, z: number, i: number) => {
  const u = ((t + hh(i, 11) * 1.4) % 1.4) / 1.4;
  if (u > 0.6) return;
  const v = u / 0.6, pv = q(0.45 + 0.55 * v, 20);
  out.fx.push({ key: `puff${pv}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pv), x: x + cam.right.x * (0.25 + 0.25 * v), y: y + 0.2 * v, z: z + cam.right.z * (0.25 + 0.25 * v), w: 0.2 + 0.3 * v, h: 0.2 + 0.3 * v, soft: true });
};
/** a chunk of ice (white polygon, ink outline) */
const fxIce = (p: Pen, seed: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, r = 70 + 40 * hh(seed, i); pts.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r * 0.8]); }
  p.ol = 10; p.poly(pts, "#eef4fb"); p.poly(pts.slice(0, 4).map(([x, y]) => [x * 0.9 + 12, y * 0.9 + 14] as [number, number]), "#c8dcf0", 0);
};
const iceShower = (cam: CamInfo, f: number, out: Stage) => {
  for (let i = 0; i < 14; i++) {
    const f0 = SCRAPE_F + 4 + Math.floor(hh(i, 21) * 34), age = (f - f0) / FPS;
    if (age < 0 || age > 1.4) continue;
    const x0 = iceX(f0) + 4 * (hh(i, 22) - 0.5), y0 = 14 + 6 * hh(i, 23), z0 = ICE_Z - 4;
    const y = y0 - 4.9 * age * age + 1.5 * age, x = x0 - 2 * age, z = z0 - 5 * age;
    if (y < 10.2) continue;
    const s = 0.6 + 0.9 * hh(i, 24);
    out.fx.push({ key: `ice${i % 4}`, cw: 256, ch: 256, draw: (p) => fxIce(p, i % 4), x, y, z, w: s, h: s, rot: age * 3 * (hh(i, 25) - 0.5) });
  }
  for (const k of [SCRAPE_F, 184, 196]) if (f >= k && f < k + 6) {
    const u = (f - k) / 6;
    out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30), "#eef6ff"), x: iceX(f) + 3, y: 2.5, z: 11.6, w: 7, h: 7 });
  }
};
const MUS_NOTES = (cam: CamInfo, t: number, out: Stage, x: number, y: number, z: number, n: number, seed: number) => {
  for (let k = 0; k < n; k++) {
    const age = (t * 0.8 + k / n + hh(seed, k)) % 1, pop = Math.min(1, age * 6) * (age > 0.8 ? (1 - age) / 0.2 : 1);
    if (pop <= 0.02) continue;
    const kind = (k + seed) % 2;
    out.fx.push({ key: `note${kind}`, cw: 220, ch: 260, draw: (p) => fxNote(p, kind, "#f6e7b0"), x: x + cam.right.x * (0.6 * age - 0.2) + 0.3 * Math.sin(age * 5 + k), y: y + 1.4 * age, z: z + cam.right.z * (0.6 * age - 0.2),
      w: 0.22 * pop, h: 0.26 * pop, rot: 0.3 * Math.sin(age * 6 + k) });
  }
};

const CROWD6: Spot[] = [[25.5, DECK, 6.9, "dazed"], [27.4, DECK, 8.2, "nervous", 1], [23.0, DECK, 8.0, "neutral", -1], [30.6, DECK, 6.3, "neutral"], [21.2, DECK, 6.6, "dazed", 1],
  [33.0, DECK, 8.3, "nervous", -1], [19.0, DECK, 8.4, "neutral"], [29.0, DECK, 8.6, "smile_closed"], [17.0, DECK, 6.5, "nervous"], [15.0, DECK, 8.1, "neutral", 1]];
const CROWD14: Spot[] = Array.from({ length: 24 }, (_, i) => {
  const x = 28 - i * 1.35 + 0.5 * hh(i, 30), z = 5.7 + 3.0 * hh(i, 31);
  return [x, DECK, z, (["shock", "nervous", "pained", "shock", "stern"] as Expr[])[i % 5], ((i % 3) - 1) as -1 | 0 | 1] as Spot;
});

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS), tint = tintOf(s.light, s.dark ?? 0);
  LNAME = s.light;
  findSun(cam, SUN);
  switch (id) {
    case 1:
      hostBody(out, "front", H1[0], H1[1], H1[2], tint);
      standers(cam, t, out, [[18.5, DECK, 7.6, "smile", 1], [17.4, DECK, 8.3, "smile_closed", -1]], 2, (i) => ({ i: 200 + i, o: { ...MUSIC(i + 3), hat: i ? "bonnet" : "tophat", dress: i ? "#7a3a5a" : undefined }, okey: `eve${i}` }));
      break;
    case 3: iceShower(cam, f, out); break;
    case 4: {
      const rolled = swap(t, 241), hop = f >= 239 && f < 249 ? 0.05 * Math.sin(((f - 239) / 10) * Math.PI) : 0;
      const fo: FrontOpts = { mode: "stand", expr: "neutral", blink: 1, facing: rolled ? -1 : 1, headTilt: rolled ? 8 : -6 };
      const p = person(cam, folk(0), SLEEPER[0], SLEEPER[1] + hop, SLEEPER[2], front(), fo, {});
      out.places.push({ ...p, yaw: 0, roll: Math.PI / 2 });
      hostBody(out, "three", HOST_CABIN[0], HOST_CABIN[1], HOST_CABIN[2], tint, true);
      break;
    }
    case 5: {
      const turned = swap(t, TURN_F), knocking = f >= KNOCK_F - 8 && f < KNOCK_F + 10;
      const fo: FrontOpts = { mode: "stand", expr: turned ? "stern" : "neutral", blink: lidAt(t, 90), facing: turned ? 0 : -1, look: turned ? 0 : -1,
        wave: knocking ? q(Math.sin(((f - KNOCK_F) / 5) * Math.PI), 10) : undefined };
      out.places.push(person(cam, { i: 90, o: STEWARD_O, okey: "steward" }, STEWARD[0], STEWARD[1], STEWARD[2], front(), fo, {}));
      blob(out, STEWARD[0], STEWARD[1], STEWARD[2]);
      for (const k of [KNOCK_F, KNOCK_F + 5]) if (f >= k && f < k + 5) {
        const u = (f - k) / 5;
        out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: STEWARD[0] - 0.35, y: 1.45, z: -1.0, w: 0.6, h: 0.6 });
      }
      if (f > 372) standers(cam, t, out, [[-7.2, 0, 0.75, "dazed", 1]], 95);
      break;
    }
    case 6: standers(cam, t, out, CROWD6, 10); break;
    case 7: standers(cam, t, out, CROWD6, 10); hostBust(out, "think", 40, tint, 0.92, 0.04); break;
    case 8: {
      const knows = swap(t, 494);
      standers(cam, t, out, [[OFFICERS[0][0], DECK, OFFICERS[0][2], knows ? "stern" : "neutral", 1, 1], [OFFICERS[1][0], DECK, OFFICERS[1][2], knows ? "nervous" : "stern", -1, -1]], 30,
        (i) => ({ i: 30 + i, o: i ? OFFICER2_O : OFFICER_O, okey: `off${i}` }));
      break;
    }
    case 9: standers(cam, t, out, CROWD6.slice(0, 6).map(([x, y, z, , fc]) => [x - 5, y, z, "smile", fc] as Spot), 10); hostBust(out, "laugh", 40, tint, 0.98, 0.0); break;
    case 10: {
      const spots: Spot[] = [0, 1, 2, 3, 4].map((k) => [BAND[0] - 2.2 + k * 1.1, DECK, BAND[2] + (k % 2) * 0.25, (["smile", "grin", "whistle", "smile_closed", "grin"] as Expr[])[k], 0] as Spot);
      standers(cam, t, out, spots, 40, (i) => ({ i: 40 + i, o: MUSIC(i), okey: `mus${i}` }), (i) => ({ tilt: q(4 * Math.sin(t * 7.5 + i * 1.3), 4), wave: i % 2 ? q(Math.sin(t * 9 + i), 10) : undefined }));
      MUS_NOTES(cam, t, out, BAND[0], DECK + 1.9, BAND[2], 7, 3);
      standers(cam, t, out, [[19.4, DECK, 8.2, "smile_closed", 1], [18.2, DECK, 6.9, "neutral", 1], [17.0, DECK, 8.6, "smile", 1]], 50);
      break;
    }
    case 11: {
      const u = smooth((f - LOWER.f0 + 10) / (LOWER.f1 - LOWER.f0 + 30)), by = DECK + 1.6 - 9.0 * u - 0.85;
      standers(cam, t, out, [[LOWER.x - 2.4, by, 11.3, "nervous", 0], [LOWER.x + 1.2, by, 11.0, "pained", 1], [LOWER.x + 2.6, by, 11.6, "dazed", -1]], 60, undefined, undefined, true);
      standers(cam, t, out, [[37.5, DECK, 8.9, "nervous"], [44.6, DECK, 8.8, "shock"], [46, DECK, 8.6, "neutral"]], 64);
      break;
    }
    case 12: hostBody(out, "three", HOST_HALL[0], HOST_HALL[1], HOST_HALL[2], tint, true); break;
    case 13: standers(cam, t, out, CROWD14.slice(0, 10).map(([x, y, z, e, fc]) => [x - 3, y, z, e, fc] as Spot), 70); hostBust(out, "shock", 40, tint, 0.98, 0.0); break;
    case 14: standers(cam, t, out, CROWD14, 70, undefined, (i) => ({ wave: i % 4 === 0 ? q(Math.sin(t * 6 + i), 10) : undefined, tilt: q(3 * Math.sin(t * 3 + i), 4) })); break;
    case 16: {
      if (f >= BREAK_F && f < BREAK_F + 8) {
        const p = halvesAt(f).back, a = (p.pitch * Math.PI) / 180, u = (f - BREAK_F) / 8;
        const hx = BREAK_X - 12 * Math.sin(a), hy = p.y + 12 * Math.cos(a);
        out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (pp) => fxBurst(pp, q(u, 30), "#ffd890", 12), x: hx, y: hy, z: 12, w: 26, h: 26 });
      }
      break;
    }
    case 17: {
      const [bx, bz, yaw] = SEA_BOATS[1], ax = Math.cos(yaw), az = -Math.sin(yaw);
      const spots: Spot[] = [-2.6, -1.2, 0.3, 1.6, 2.8].map((d, k) => [bx + ax * d, -0.25, bz + az * d + (k % 2 ? 0.3 : -0.3), (["dazed", "pained", "dazed", "nervous", "pained"] as Expr[])[k], 0] as Spot);
      standers(cam, t, out, spots, 100, undefined, undefined, true);
      spots.forEach(([x, , z], k) => breath(cam, t, out, x, 1.45, z, k));
      break;
    }
    case 18: {
      const spots: Spot[] = Array.from({ length: 8 }, (_, k) => [SWIM[0] - 2.5 + 5 * hh(k, 40), -1.0, SWIM[2] - 2.5 + 4.5 * hh(k, 41), (["pained", "shock", "pained", "nervous"] as Expr[])[k % 4], 0] as Spot);
      standers(cam, t, out, spots, 120, (i) => ({ i: 120 + i, o: BELT(i), okey: `belt${i}` }), (i) => ({ tilt: q(5 * Math.sin(t * 22 + i * 2), 4), wave: i % 3 === 0 ? q(Math.sin(t * 5 + i), 10) : undefined }), true);
      spots.forEach(([x, , z], k) => breath(cam, t, out, x, 0.75, z, k + 20));
      break;
    }
    case 19: {
      const [bx, bz, yaw] = SEA_BOATS[0], ax = Math.cos(yaw), az = -Math.sin(yaw);
      const spots: Spot[] = [-3.0, -2.5, -1.9].map((d, k) => [bx + ax * d, -0.25, bz + az * d + (k - 1) * 0.35, (["dazed", "pained", "dazed"] as Expr[])[k], 1] as Spot);
      standers(cam, t, out, spots, 140, undefined, undefined, true);
      spots.forEach(([x, , z], k) => breath(cam, t, out, x, 1.45, z, k + 40));
      break;
    }
  }
  return out;
};
export { FPS, D0, clamp01, sinkAt };
