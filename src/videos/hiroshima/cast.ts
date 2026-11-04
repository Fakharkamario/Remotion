// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPuff, NARRATOR, GRANDPA, GRANDMA, jkid, jfolk,
  Outfit, Expr, FrontOpts, SideOpts, Pose,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, smooth, clamp01, W, NAR1, NAR4, NAR7, NAR9, NAR_END, SIREN, GRANDPA_SIT, GRANDMA_SIT, GRANDPA_WIN, GRANDPA_UP, GRANDMA_UP,
  TABLE, planeAt, STREET_Z0, STREET_Z1,
} from "./story";
import { ampAt } from "./speech";
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
const FOLK = Array.from({ length: 12 }, (_, v) => jfolk(v));
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

// ---------------- cast by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const folk = (i: number): Who => ({ i, o: FOLK[i % 12], okey: `f${i % 12}` });
const NAR: Who = { i: 7, o: NARRATOR, okey: "nar" }, GPA: Who = { i: 11, o: GRANDPA, okey: "gpa" }, GMA: Who = { i: 13, o: GRANDMA, okey: "gma" };
const at = (f: number, w: number) => f >= w - 2; // reactions land 0-3 f before the word
const FRONT = { side: false, mirror: false };

/** mouth from the voice loudness (held 2 frames so it does not chatter): closed / small / open */
const say = (f: number, closed: Expr, small: Expr, open: Expr) => {
  const a = Math.max(ampAt(f - (f % 2)), ampAt(f - (f % 2) + 1));
  return a < 0.18 ? closed : a < 0.55 ? small : open;
};
/** one front-facing figure, standing or sitting, with a contact shadow when on the ground */
const fig = (cam: CamInfo, t: number, out: Stage, who: Who, pos: V3, fo: FrontOpts, scale = 1, shadow = true) => {
  const blink = fo.blink ?? (fo.expr === "laugh" || fo.expr === "shock" || fo.expr === "smile_closed" || fo.expr === "grin" ? 0 : lidAt(t, who.i));
  out.places.push(person(cam, who, pos[0], pos[1], pos[2], FRONT, { ...fo, blink }, {}, scale));
  if (shadow) blob(out, pos[0], pos[1], pos[2], scale * (fo.mode === "sit" ? 1.25 : 1));
};

/** townsfolk strolling along the street edges (side view walking cycle) */
const strollers = (cam: CamInfo, t: number, out: Stage, x0: number, x1: number, n: number, base: number) => {
  for (let i = 0; i < n; i++) {
    const dir = i % 2 ? 1 : -1, sp = 0.9 + 0.4 * hh(i + base, 6), span = x1 - x0;
    const x = x0 + ((((hh(i + base, 7) * span + dir * sp * t) % span) + span) % span), z = dir > 0 ? STREET_Z0 + 1.6 + 1.4 * hh(i, 8) : STREET_Z1 - 1.8 - 1.4 * hh(i, 8);
    if (cam.pos.distanceTo(tmp.set(x, 1, z)) < 3.2) continue;
    const phase = q(((t * sp) / 1.4 + hh(i, 9)) % 1, 120), view = viewOf(cam, x, z, dir, 0);
    const expr: Expr = (["smile", "smile_closed", "neutral", "smile"] as Expr[])[i % 4];
    const fo: FrontOpts = { mode: "stroll", phase, expr, blink: lidAt(t, base + i) }, so: SideOpts = { mode: "march", phase, expr, stomp: 0.55, stride: 0.875 * view.fs, blink: lidAt(t, base + i) };
    out.places.push(person(cam, folk(base + i), x, 0, z, view, fo, so));
    blob(out, x, 0, z);
  }
};
/** schoolkids running down the street toward the lens (front view, laughing) */
const kids = (cam: CamInfo, t: number, f: number, out: Stage) => {
  const t0 = W.children / FPS - 0.4;
  for (let i = 0; i < 5; i++) {
    const v = 2.3 + 0.4 * hh(i, 21), x = -1 + 2.4 * i + 1.5 * hh(i, 22) - v * (t - t0), z = -1.6 + 3.6 * hh(i, 23);
    if (x < cam.pos.x + 3 || x > 40) continue;
    const ph = q((t * 2.3 + hh(i, 24)) % 1, 60), w2: Who = { i: 30 + i, o: jkid(i), okey: `k${i}` };
    const expr: Expr = (["laugh", "grin", "relief_open", "laugh", "grin"] as Expr[])[i];
    out.places.push(person(cam, w2, x, 0, z, FRONT, { mode: "march", phase: ph, lift: 80, expr, blink: 0, look: i % 2 ? -1 : 1, tilt: 4 * Math.sin(t * 5 + i) }, {}, 1));
    blob(out, x, 0, z, 0.8);
  }
};
/** steam curling off the tea cups on the low table */
const steam = (t: number, out: Stage, cam: CamInfo) => {
  for (const [dx, k] of [[-0.2, 0], [0.25, 1]] as const) {
    for (let n = 0; n < 2; n++) {
      const u = ((t * 0.55 + k * 0.37 + n * 0.5) % 1), pv = q(0.25 + 0.65 * u, 20);
      out.fx.push({ key: `puff${pv}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, pv), x: TABLE[0] + dx + cam.right.x * 0.04 * Math.sin(u * 6), y: TABLE[1] + 0.48 + 0.4 * u,
        z: TABLE[2] - 0.1 + cam.right.z * 0.04 * Math.sin(u * 6), w: 0.14 + 0.2 * u, h: 0.14 + 0.2 * u, soft: true });
    }
  }
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, _ts: number | null, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light === "golden" || s.light === "dusk" ? "golden" : "day";
  findSun(cam, SUN);
  const room = s.light === "room";
  if (room && id < 18) steam(t, out, cam);
  switch (id) {
    case 1: { // narrator in the street, talking to the lens
      const k = smooth((f - 4) / 14);
      fig(cam, t, out, NAR, NAR1, { mode: "stand", pose: f < W.hiroshima - 2 ? "pocket" : "open", k, expr: say(f, "smile", "talk", "sayA"), look: 0 });
      strollers(cam, t, out, -30, 40, 8, 20);
      break;
    }
    case 2: strollers(cam, t, out, -120, 120, 22, 40); break;
    case 3: case 5: case 6: case 10: {
      // breakfast: grandpa reads, grandma sips (CU on "sips"), both laugh on "laughs"
      const sip = id === 3 && f >= W.sips - 2 ? smooth((f - (W.sips - 2)) / 12) * (1 - smooth((f - (W.tea + 4)) / 10)) : 0;
      const laugh = id === 6 && at(f, W.laughs);
      const gmE: Expr = laugh ? "laugh" : sip > 0.6 ? "smile_closed" : "smile";
      fig(cam, t, out, GMA, GRANDMA_SIT, { mode: "sit", pose: "cup", k: id === 3 ? sip : 0.15, expr: gmE, look: 1, facing: 1 }, 1, false);
      let gpE: Expr = id === 6 ? (laugh ? "grin" : say(f, "smile", "talk", "sayA")) : "smile_closed";
      let gpPose: Pose = id === 10 ? "cup" : "paper", look = id === 6 ? -1 : 0, lookY = 0, tilt = 0;
      if (id === 10) { gpE = at(f, W.drone2) ? (at(f, W.heavier) ? "worry" : "think") : "neutral"; lookY = at(f, W.drone2) ? -1 : 0; tilt = at(f, W.drone2) ? -5 : 0; look = at(f, W.drone2) ? -1 : 0; }
      fig(cam, t, out, GPA, GRANDPA_SIT, { mode: "sit", pose: gpPose, k: 0.1, expr: gpE, look, lookY, headTilt: tilt, facing: -1 }, 1, false);
      break;
    }
    case 4: { // the silent siren; narrator points at it, shrugs on "false alarm"; CU "or so everyone thought"
      const cu = f >= W.orSo - 2;
      const pose: Pose = cu ? "pocket" : at(f, W.falseAlarm) ? "shrug" : "pointL";
      const expr: Expr = cu ? say(f, "sad", "sadO", "sadO") : at(f, W.falseAlarm) ? "smile" : "talk2";
      fig(cam, t, out, NAR, NAR4, { mode: "stand", pose, k: smooth((f - 256) / 10), expr, look: cu ? 0 : -1, lookY: cu ? 0 : -0.6, headTilt: cu ? 0 : -3 });
      if (!cu) strollers(cam, t, out, -40, 30, 6, 60);
      break;
    }
    case 7: { // kids running past; the narrator watches them go (smile -> sad)
      kids(cam, t, f, out);
      fig(cam, t, out, NAR, NAR7, { mode: "stand", pose: "pocket", expr: at(f, W.klass) ? "sad" : "smile_closed", look: 1 });
      standersAt(cam, t, out, [[-4, 0, 6.1], [6, 0, -6.2], [15, 0, 6.3]], 70);
      break;
    }
    case 8: break;
    case 9: { // nobody looks up: the street goes on; the narrator thinks, then looks up
      const up = at(f, W.planes);
      fig(cam, t, out, NAR, NAR9, { mode: "stand", pose: "chin", expr: up ? "worry" : "think", look: up ? -1 : 1, lookY: up ? -1 : 0, headTilt: up ? -6 : 0 });
      strollers(cam, t, out, -10, 40, 12, 80);
      break;
    }
    case 11: { // grandpa at the window pushes the shoji open, looks up
      const k = smooth((f - (W.pushes - 4)) / 22);
      fig(cam, t, out, GPA, GRANDPA_WIN, { mode: "stand", pose: k < 1 ? "reachL" : "brow", k, expr: k < 1 ? "think" : "worry", lookY: -1, headTilt: -4, look: -1 }, 1, false);
      break;
    }
    case 12: { // the bombers glint
      for (let i = 0; i < 3; i++) {
        const g0 = W.glint + i * 5;
        if (f >= g0 && f < g0 + 10) {
          const u = (f - g0) / 10, p = planeAt(f, i);
          out.fx.push({ key: `glint${q(u, 20)}`, cw: 500, ch: 500, draw: (pp) => fxBurst(pp, q(u, 20), "#ffffff", 8, 30, 240), x: p[0] + 4, y: p[1] + 2, z: p[2], w: 26, h: 26 });
        }
      }
      break;
    }
    case 13: { // "why aren't the sirens ringing?" grandpa at the window; grandma pats his arm
      const talking = f >= W.why - 2 && f < W.pats - 6;
      fig(cam, t, out, GPA, GRANDPA_WIN, { mode: "stand", pose: "brow", expr: talking ? say(f, "worry", "talk", "worryA") : "worry", lookY: -1, headTilt: -4, look: -1 }, 1, false);
      const pat = at(f, W.pats);
      fig(cam, t, out, GMA, GRANDMA_SIT, { mode: "sit", pose: pat ? "pat" : "cup", k: pat ? clamp01((f - W.pats) / 26) : 0.1, expr: pat ? "smile" : "neutral", look: 1, facing: 1 }, 1, false);
      break;
    }
    case 14: { // "Sit down. Finish your tea."
      fig(cam, t, out, GMA, GRANDMA_SIT, { mode: "sit", pose: "cup", k: 0.15, expr: say(f, "smile", "talk2", "smileA"), look: 1, facing: 1 }, 1, false);
      fig(cam, t, out, GPA, GRANDPA_SIT, { mode: "sit", pose: "cup", k: 0.05, expr: "worry", look: -1, lookY: -0.5, facing: -1 }, 1, false);
      break;
    }
    case 17: // the narrator sees it: shock
      fig(cam, t, out, NAR, NAR1, { mode: "stand", pose: "shrug", expr: "shock", lookY: -1, headTilt: -8, look: 0, blink: 0 });
      break;
    case 18: { // FIVE: he stands up slowly
      const up = f >= W.stands - 2;
      if (up) fig(cam, t, out, GPA, [GRANDPA_SIT[0], GRANDPA_SIT[1], GRANDPA_SIT[2] - 0.15], { mode: "stand", expr: "worry", lookY: -1, look: -1, headTilt: -3 }, 1, false);
      else fig(cam, t, out, GPA, GRANDPA_SIT, { mode: "sit", pose: "cup", k: 0.05, expr: "worry", lookY: -1, look: -1, facing: -1 }, 1, false);
      fig(cam, t, out, GMA, GRANDMA_SIT, { mode: "sit", pose: "cup", k: 0.1, expr: up ? "worry" : "neutral", look: 1, lookY: up ? -0.6 : 0, facing: 1 }, 1, false);
      break;
    }
    case 19: case 20: { // THREE: he takes her hand; ONE: they look to the window
      const k = id === 20 ? 1 : smooth((f - (W.takes - 4)) / 16);
      const e: Expr = id === 20 ? "worry" : at(f, W.hand) ? "sad" : "worry";
      fig(cam, t, out, GPA, GRANDPA_UP, { mode: "stand", pose: "reachL", k, expr: e, look: id === 20 ? 0 : -1, lookY: id === 20 ? -0.4 : 0, facing: -1 }, 1, false);
      fig(cam, t, out, GMA, GRANDMA_UP, { mode: "stand", pose: "reach", k, expr: e, look: id === 20 ? 0 : 1, lookY: id === 20 ? -0.4 : 0, facing: 1 }, 1, false);
      break;
    }
    case 22: { // the hill: narrator, the last line, to the lens
      fig(cam, t, out, NAR, NAR_END, { mode: "stand", pose: "pocket", expr: f >= W.year - 20 && f < W.gone + 14 ? say(f, "sad", "sadO", "sadO") : "sad", look: 0 });
      break;
    }
  }
  return out;
};
/** people standing about (front view) */
const standersAt = (cam: CamInfo, t: number, out: Stage, spots: V3[], base: number) =>
  spots.forEach((p, i) => fig(cam, t, out, folk(base + i), p, { mode: "stand", expr: (["neutral", "smile", "smile_closed"] as Expr[])[i % 3], look: Math.round((hh(i, 5) - 0.5) * 2) }));
export { FPS, D0, clamp01 };
