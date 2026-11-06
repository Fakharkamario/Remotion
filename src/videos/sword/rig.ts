// Real 3D toon characters (no billboards): a jointed rig built from lathed / capsule / sphere meshes in the world's
// two-tone shading, outlined by the world ink pass like everything else. The Narrator follows the sheet: round head,
// a mop of brown curls (spheres with painted spiral strokes), big round eyes, black hoodie (hood, drawstrings,
// kangaroo pocket), thin grey jeans, dark shoes with grey soles. Arms and legs are 2-bone IK chains, so poses are
// given as hand / foot targets. The face is a canvas texture on a sphere cap (face.ts), redrawn per frame for
// expressions, blinks and lip-sync.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { twoTone } from "./shade";
import { drawFace, FaceState, CAP_A, CAP_T0, CAP_TL, FACE_W, FACE_H } from "./face";
import { rng } from "./paint";

export type V3 = [number, number, number];
export type HairKind = "curls" | "smith" | "polisher" | "aztec";
export type Outfit = "hoodie" | "kimono" | "aztec";
export type Look = {
  skin: string; hair: HairKind; hairCol: string; outfit: Outfit; top: string; top2: string; pants: string; shoes: string; sole: string;
  wide?: boolean; glasses?: boolean; beard?: string | null; brow?: string; band?: string; scale?: number;
};
export const NARRATOR: Look = { skin: "#f6dcc6", hair: "curls", hairCol: "#4a3226", outfit: "hoodie", top: "#222127", top2: "#1a191e", pants: "#6a6e78", shoes: "#2a2c34", sole: "#8a8e98" };
export const SMITH: Look = { skin: "#eac3a2", hair: "smith", hairCol: "#1e1a1c", outfit: "kimono", top: "#3b4f7a", top2: "#e9e1cf", pants: "#3a3a44", shoes: "#5a4434", sole: "#3a2c22", wide: true, band: "#f2efe6", beard: null, scale: 1.02 };
export const POLISHER: Look = { skin: "#efcdb0", hair: "polisher", hairCol: "#cfccc6", outfit: "kimono", top: "#8a7354", top2: "#efe8d6", pants: "#4c4038", shoes: "#5a4434", sole: "#3a2c22", wide: true, glasses: true, brow: "#9a958e" };
export const AZTEC: Look = { skin: "#c98f62", hair: "aztec", hairCol: "#18141a", outfit: "aztec", top: "#efe6cf", top2: "#c0392b", pants: "#c98f62", shoes: "#8a5a34", sole: "#5a3a22", band: "#2a9d8f", scale: 1.04 };

// body metrics (metres)
const HIP = 0.7, THIGH = 0.33, SHIN = 0.31, UARM = 0.25, FARM = 0.23, HEAD_R = 0.25, NECK = 0.5;
export const RIG = { HIP, THIGH, SHIN, UARM, FARM, HEAD_R, NECK };

const mats = new Map<string, THREE.MeshLambertMaterial>();
const mat = (col: string, map?: THREE.Texture) => {
  const key = col + (map ? map.uuid : "");
  let m = mats.get(key);
  if (!m) { m = twoTone(new THREE.MeshLambertMaterial({ color: col, map: map ?? null }), 0.3, 0.4); mats.set(key, m); }
  return m;
};
const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; };
/** capsule hanging from the origin along -y */
const limb = (len: number, r0: number, r1: number) => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * r1, -len - Math.cos(a) * r1 * 0.9)); }
  for (let i = 6; i >= 0; i--) { const a = (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * r0, Math.cos(a) * r0 * 0.9)); }
  return new THREE.LatheGeometry(pts, 14);
};

// ---------------- textures ----------------
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const curlTex = (base: string) => canvasTex(256, 128, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 128);
  // spiral strokes around the pole: v rises linearly with u (equirect mapping of a spiral)
  const lines = (col: string, w: number, off: number) => {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round";
    for (let k = -2; k < 5; k++) { g.beginPath(); g.moveTo(0, k * 26 + off); g.lineTo(256, k * 26 + 26 + off); g.stroke(); }
  };
  lines("rgba(30,18,12,0.85)", 4.5, 4);
  lines("rgba(140,100,75,0.45)", 3, 15);
  g.fillStyle = base; g.fillRect(0, 100, 256, 28); // the lower half of the curl (hidden side) stays plain
});
const bodyTex = (L: Look) => canvasTex(1024, 512, (g) => {
  const W = 1024, H = 512, cx = W / 2;
  g.fillStyle = L.top; g.fillRect(0, 0, W, H);
  g.lineCap = "round"; g.lineJoin = "round";
  if (L.outfit === "hoodie") {
    // kangaroo pocket (front, lower), hem rib, faint fabric folds
    g.fillStyle = L.top2;
    g.beginPath(); g.moveTo(cx - 120, H - 70); g.lineTo(cx - 95, H - 230); g.lineTo(cx + 95, H - 230); g.lineTo(cx + 120, H - 70); g.closePath(); g.fill();
    g.strokeStyle = "#141418"; g.lineWidth = 7; g.stroke();
    g.fillStyle = "#1a1a1f"; g.fillRect(0, H - 40, W, 40);
    g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 6;
    for (const x of [cx - 200, cx + 210, cx - 330, cx + 320]) { g.beginPath(); g.moveTo(x, H - 60); g.quadraticCurveTo(x + 20, H / 2, x - 10, 80); g.stroke(); }
  } else if (L.outfit === "kimono") {
    // crossed collar (left over right), white under-collar, obi belt
    g.fillStyle = L.top2;
    g.beginPath(); g.moveTo(cx - 110, 0); g.lineTo(cx + 30, H * 0.55); g.lineTo(cx + 80, H * 0.55); g.lineTo(cx - 40, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + 110, 0); g.lineTo(cx - 10, H * 0.45); g.lineTo(cx + 30, H * 0.45); g.lineTo(cx + 160, 0); g.closePath(); g.fill();
    g.strokeStyle = "rgba(20,15,20,0.55)"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx - 40, 0); g.lineTo(cx + 80, H * 0.55); g.stroke();
    g.fillStyle = "#2a2226"; g.fillRect(0, H * 0.55, W, 70);
    g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(0, H * 0.55 + 10, W, 8);
  } else {
    // quilted cotton armour: diamond quilting + red band at the hem
    g.strokeStyle = "rgba(120,100,70,0.45)"; g.lineWidth = 4;
    for (let k = -20; k < 30; k++) { g.beginPath(); g.moveTo(k * 60, 0); g.lineTo(k * 60 + H, H); g.stroke(); g.beginPath(); g.moveTo(k * 60, H); g.lineTo(k * 60 + H, 0); g.stroke(); }
    g.fillStyle = L.top2; g.fillRect(0, H - 70, W, 50);
    g.fillStyle = "#f2c14e"; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, H - 70); g.lineTo(x + 20, H - 45); g.lineTo(x + 40, H - 70); g.fill(); }
  }
});

// ---------------- IK ----------------
const _d = new THREE.Vector3(), _n = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _x = new THREE.Vector3(), _z = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _qi = new THREE.Quaternion(), DOWN = new THREE.Vector3(0, -1, 0);
/** points a 2-bone chain (both bones along local -y) from its root at `root` (parent space) to `target`, the
 *  middle joint bending toward `pole`. Sets the root bone's quaternion (parent space) and the joint's (bone space). */
function ik2(rootQ: THREE.Quaternion, jointQ: THREE.Quaternion, root: THREE.Vector3, target: THREE.Vector3, pole: THREE.Vector3, L1: number, L2: number) {
  _d.subVectors(target, root);
  let dist = _d.length();
  dist = Math.min(Math.max(dist, Math.abs(L1 - L2) + 1e-3), L1 + L2 - 1e-4);
  _d.normalize();
  _n.copy(pole).addScaledVector(_d, -pole.dot(_d));
  if (_n.lengthSq() < 1e-8) _n.set(0, 0, 1).addScaledVector(_d, -_d.z);
  _n.normalize();
  const a1 = Math.acos(THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  _u.copy(_d).multiplyScalar(Math.cos(a1)).addScaledVector(_n, Math.sin(a1)); // upper bone direction
  const ex = root.x + _u.x * L1, ey = root.y + _u.y * L1, ez = root.z + _u.z * L1;
  _f.set(root.x + _d.x * dist - ex, root.y + _d.y * dist - ey, root.z + _d.z * dist - ez).normalize(); // lower bone
  // root frame: local -y -> u, local x -> bend axis (u x f)
  _x.crossVectors(_u, _f);
  if (_x.lengthSq() < 1e-8) _x.crossVectors(_u, _n);
  _x.normalize();
  const y = _u.clone().negate();
  _z.crossVectors(_x, y).normalize();
  _m.makeBasis(_x, y, _z);
  rootQ.setFromRotationMatrix(_m);
  _qi.copy(rootQ).invert();
  const fl = _f.clone().applyQuaternion(_qi);
  jointQ.setFromUnitVectors(DOWN, fl);
}

export type Pose = {
  pos: V3; yaw: number;
  lean?: number; twist?: number; side?: number; drop?: number; // torso pitch fwd, yaw, roll; hip drop (m)
  head?: [number, number, number];                              // yaw, pitch (down +), roll
  handL?: V3; handR?: V3;                                       // torso-space targets (default: hanging)
  handWL?: THREE.Vector3; handWR?: THREE.Vector3;               // world-space targets (override handL / handR)
  elbowL?: V3; elbowR?: V3;                                     // pole directions
  footL?: V3; footR?: V3;                                       // hip-space targets (default: standing)
  knee?: V3;
  walk?: number;                                                // walk phase (rad), adds stride + bob
  face: FaceState;
  squash?: number;                                              // vertical squash for impacts (1 = none)
};

export class Character {
  root = new THREE.Group();
  hips = new THREE.Group(); torso = new THREE.Group(); neck = new THREE.Group(); head = new THREE.Group();
  shL = new THREE.Group(); shR = new THREE.Group(); elL = new THREE.Group(); elR = new THREE.Group();
  hL = new THREE.Group(); hR = new THREE.Group();
  hipL = new THREE.Group(); hipR = new THREE.Group(); knL = new THREE.Group(); knR = new THREE.Group(); ftL = new THREE.Group(); ftR = new THREE.Group();
  hairPivot = new THREE.Group();
  private faceCv: HTMLCanvasElement; private faceG: CanvasRenderingContext2D; private faceTex: THREE.CanvasTexture;
  private lastFace = "";
  constructor(public look: Look) {
    const L = look, s = L.scale ?? 1;
    this.root.scale.setScalar(s);
    const R = this.root;
    R.add(this.hips); this.hips.position.y = HIP;
    this.hips.add(this.torso);
    // ---- body ----
    const prof = L.outfit === "hoodie"
      ? [[0, -0.05], [0.16, -0.045], [0.225, 0.0], [0.25, 0.1], [0.25, 0.22], [0.235, 0.33], [0.2, 0.42], [0.13, 0.49], [0, 0.52]]
      : L.outfit === "kimono"
      ? [[0, -0.12], [0.2, -0.12], [0.25, -0.06], [0.255, 0.08], [0.25, 0.22], [0.24, 0.34], [0.2, 0.43], [0.13, 0.49], [0, 0.52]]
      : [[0, -0.08], [0.2, -0.08], [0.245, -0.02], [0.25, 0.12], [0.245, 0.26], [0.23, 0.36], [0.19, 0.44], [0.12, 0.5], [0, 0.52]];
    const bg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40, Math.PI, Math.PI * 2);
    bg.scale(1, 1, 0.8);
    const body = mesh(bg, mat("#ffffff", bodyTex(L)));
    this.torso.add(body);
    if (L.outfit === "hoodie") {
      const hood = mesh(new THREE.TorusGeometry(0.145, 0.06, 12, 32), mat(L.top));
      hood.rotation.x = Math.PI / 2 - 0.12; hood.position.set(0, 0.475, -0.015); hood.scale.set(1, 0.85, 1);
      this.torso.add(hood);
      const back = mesh(new THREE.SphereGeometry(0.15, 20, 14), mat(L.top));
      back.position.set(0, 0.43, -0.12); back.scale.set(1.05, 0.75, 0.6); this.torso.add(back);
      for (const sx of [-1, 1]) { // drawstrings
        const str = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.15, 6), mat("#b8bcc4"));
        str.position.set(sx * 0.045, 0.39, 0.21); str.rotation.x = -0.25; this.torso.add(str);
        const tip = mesh(new THREE.SphereGeometry(0.016, 8, 6), mat("#d8dce2"));
        tip.position.set(sx * 0.045, 0.31, 0.225); this.torso.add(tip);
      }
    } else if (L.outfit === "kimono") {
      const col = mesh(new THREE.TorusGeometry(0.13, 0.035, 10, 28), mat(L.top2));
      col.rotation.x = Math.PI / 2; col.position.set(0, 0.48, 0); this.torso.add(col);
    } else {
      const col = mesh(new THREE.TorusGeometry(0.13, 0.03, 10, 28), mat(L.top2));
      col.rotation.x = Math.PI / 2; col.position.set(0, 0.48, 0); this.torso.add(col);
    }
    // ---- head ----
    this.torso.add(this.neck); this.neck.position.set(0, NECK - 0.04, 0.0);
    this.neck.add(this.head); this.head.position.set(0, 0.24, 0.02);
    const headM = mat(L.skin);
    const skull = mesh(new THREE.SphereGeometry(HEAD_R, 40, 28), headM);
    skull.scale.set(1, 0.97, 0.96);
    this.head.add(skull);
    this.faceCv = document.createElement("canvas"); this.faceCv.width = FACE_W; this.faceCv.height = FACE_H;
    this.faceG = this.faceCv.getContext("2d")!;
    this.faceTex = new THREE.CanvasTexture(this.faceCv); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.anisotropy = 8;
    const cap = mesh(new THREE.SphereGeometry(HEAD_R * 1.004, 48, 36, Math.PI / 2 - CAP_A, 2 * CAP_A, CAP_T0, CAP_TL), twoTone(new THREE.MeshLambertMaterial({ map: this.faceTex }), 0.3, 0.4));
    cap.scale.copy(skull.scale); cap.castShadow = false;
    this.head.add(cap);
    this.head.add(this.hairPivot);
    this.buildHair(L);
    // ---- arms ----
    const sleeve = L.outfit === "aztec" ? L.skin : L.top, sr = L.wide ? 0.065 : 0.056;
    for (const [sh, el, hd, sx] of [[this.shL, this.elL, this.hL, -1], [this.shR, this.elR, this.hR, 1]] as const) {
      this.torso.add(sh); sh.position.set(sx * 0.2, 0.38, 0);
      sh.add(mesh(limb(UARM, sr, sr * 0.95), mat(sleeve)));
      if (L.outfit === "aztec") { const pad = mesh(new THREE.SphereGeometry(0.075, 14, 10), mat(L.top)); pad.scale.set(1, 0.8, 1); sh.add(pad); }
      sh.add(el); el.position.y = -UARM;
      el.add(mesh(limb(FARM, sr * 0.95, sr * (L.wide ? 1.1 : 0.9)), mat(sleeve)));
      el.add(hd); hd.position.y = -FARM - 0.03;
      const hand = mesh(new THREE.SphereGeometry(0.052, 16, 12), mat(L.skin));
      hand.scale.set(0.9, 1.05, 0.95); hd.add(hand);
    }
    // ---- legs ----
    const lr = L.wide ? 0.075 : 0.043;
    for (const [hp, kn, ft, sx] of [[this.hipL, this.knL, this.ftL, -1], [this.hipR, this.knR, this.ftR, 1]] as const) {
      this.hips.add(hp); hp.position.set(sx * 0.09, 0, 0);
      hp.add(mesh(limb(THIGH, lr, lr * 0.95), mat(L.pants)));
      hp.add(kn); kn.position.y = -THIGH;
      kn.add(mesh(limb(SHIN, lr * 0.95, L.wide ? lr * 1.05 : lr * 0.88), mat(L.pants)));
      kn.add(ft); ft.position.y = -SHIN;
      // shoe: rounded box pointing +z, sole strip
      const shoe = mesh(new THREE.CapsuleGeometry(0.055, 0.12, 6, 12), mat(L.shoes));
      shoe.rotation.x = Math.PI / 2; shoe.scale.set(1, 1, 0.72); shoe.position.set(0, -0.025, 0.045);
      ft.add(shoe);
      const sole = mesh(new THREE.CapsuleGeometry(0.057, 0.12, 4, 12), mat(L.sole));
      sole.rotation.x = Math.PI / 2; sole.scale.set(1.02, 1.02, 0.25); sole.position.set(0, -0.058, 0.045);
      ft.add(sole);
    }
  }

  private buildHair(L: Look) {
    const P = this.hairPivot, r = HEAD_R;
    if (L.hair === "curls") {
      const tex = curlTex(L.hairCol), m = mat("#ffffff", tex);
      const geos: THREE.BufferGeometry[] = [], rnd = rng(7);
      const N = 230, up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < N; i++) {
        const yy = 1 - (2 * (i + 0.5)) / N, rr = Math.sqrt(1 - yy * yy), th = i * 2.399963;
        const d = new THREE.Vector3(Math.cos(th) * rr, yy, Math.sin(th) * rr);
        const lat = Math.asin(d.y), front = d.z;
        // face window: curls stop at the forehead in front, at the cheekbones on the sides, the nape at the back
        const fringe = 0.5 - 0.05 * Math.abs(d.x);
        if (front > 0.25 && lat < fringe + 0.12 + (1 - front) * -0.95) continue;
        if (lat < -0.25 && front > -0.2) continue;
        if (lat < -0.62) continue;
        const cr = 0.052 + 0.018 * rnd();
        const g = new THREE.SphereGeometry(cr, 14, 10);
        const q = new THREE.Quaternion().setFromUnitVectors(up, d).multiply(new THREE.Quaternion().setFromAxisAngle(up, rnd() * 6.28));
        const pos = d.clone().multiplyScalar(r * (0.88 + 0.06 * rnd()) + cr * 0.4);
        if (lat > 0.2) pos.y += 0.02;
        g.applyMatrix4(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1, 0.85, 1)));
        geos.push(g);
      }
      const hair = mesh(mergeGeometries(geos, false), m);
      P.add(hair);
    } else if (L.hair === "smith") {
      const capG = new THREE.SphereGeometry(r * 1.04, 32, 20, 0, Math.PI * 2, 0, 1.35);
      const cap = mesh(capG, mat(L.hairCol)); cap.rotation.x = -0.75; cap.position.set(0, 0.01, -0.02); P.add(cap);
      const knot = mesh(new THREE.CapsuleGeometry(0.04, 0.09, 4, 10), mat(L.hairCol));
      knot.rotation.x = Math.PI / 2 - 0.3; knot.position.set(0, r * 1.02, -0.02); P.add(knot);
      const band = mesh(new THREE.TorusGeometry(r * 0.99, 0.028, 8, 40), mat(L.band ?? "#ffffff"));
      band.rotation.x = Math.PI / 2 + 0.45; band.position.set(0, 0.15, -0.03); band.scale.setScalar(0.98); P.add(band);
      const tie = mesh(new THREE.BoxGeometry(0.03, 0.12, 0.02), mat(L.band ?? "#ffffff")); tie.position.set(0.04, 0.05, -r); tie.rotation.z = 0.5; P.add(tie);
    } else if (L.hair === "polisher") {
      const ring = mesh(new THREE.SphereGeometry(r * 1.035, 28, 10, Math.PI - 0.35, Math.PI + 0.7, 1.25, 0.75), mat(L.hairCol));
      P.add(ring);
      const bun = mesh(new THREE.SphereGeometry(0.05, 12, 10), mat(L.hairCol)); bun.position.set(0, 0.1, -r * 0.97); P.add(bun);
    } else if (L.hair === "aztec") {
      const capG = new THREE.SphereGeometry(r * 1.05, 32, 22, 0, Math.PI * 2, 0, 1.75);
      const cap = mesh(capG, mat(L.hairCol)); cap.rotation.x = -1.05; cap.position.set(0, 0.02, -0.03); P.add(cap);
      const band = mesh(new THREE.TorusGeometry(r * 1.02, 0.03, 8, 40), mat(L.band ?? "#2a9d8f"));
      band.rotation.x = Math.PI / 2 + 0.4; band.position.set(0, 0.15, -0.03); P.add(band);
      const cols = ["#2a9d8f", "#e63946", "#f2c14e", "#2a9d8f", "#e63946"];
      cols.forEach((c, i) => {
        const fth = mesh(new THREE.CapsuleGeometry(0.03, 0.32, 4, 8), mat(c));
        const a = (i - 2) * 0.32;
        fth.position.set(Math.sin(a) * 0.1, r + 0.12, -0.08 + Math.cos(a) * 0.0); fth.rotation.set(-0.4, 0, -a * 0.9); fth.scale.set(1, 1, 0.45);
        P.add(fth);
      });
    }
  }

  /** world position of a hand (call after pose()) */
  handWorld(side: "L" | "R", out = new THREE.Vector3()) { return (side === "L" ? this.hL : this.hR).getWorldPosition(out); }
  headWorld(out = new THREE.Vector3()) { return this.head.getWorldPosition(out); }

  pose(p: Pose) {
    const R = this.root;
    R.position.set(...p.pos); R.rotation.set(0, p.yaw, 0);
    const walk = p.walk;
    const bob = walk !== undefined ? 0.025 * Math.abs(Math.sin(walk)) : 0;
    this.hips.position.y = HIP - (p.drop ?? 0) + bob;
    const sq = p.squash ?? 1;
    this.hips.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    this.torso.rotation.set(p.lean ?? 0, p.twist ?? 0, p.side ?? 0, "YXZ");
    const [hy, hp, hr] = p.head ?? [0, 0, 0];
    this.neck.rotation.set(hp * 0.4, hy * 0.4, hr * 0.4, "YXZ");
    this.head.rotation.set(hp * 0.6, hy * 0.6, hr * 0.6, "YXZ");
    // arms: targets in torso space (world targets converted after the body transform is known)
    R.updateMatrixWorld(true);
    const toT = (v?: THREE.Vector3): V3 | undefined => { if (!v) return undefined; const l = this.torso.worldToLocal(v.clone()); return [l.x, l.y, l.z]; };
    const tL = toT(p.handWL) ?? p.handL, tR = toT(p.handWR) ?? p.handR;
    const sw = walk !== undefined ? Math.sin(walk) : 0;
    const hangL: V3 = [-0.25, -0.02 + 0.02 * Math.abs(sw), 0.03 - 0.12 * sw], hangR: V3 = [0.25, -0.02 + 0.02 * Math.abs(sw), 0.03 + 0.12 * sw];
    for (const [sh, el, tgt, pole, sx] of [[this.shL, this.elL, tL ?? hangL, p.elbowL, -1], [this.shR, this.elR, tR ?? hangR, p.elbowR, 1]] as const) {
      ik2(sh.quaternion, el.quaternion, sh.position, new THREE.Vector3(...tgt), new THREE.Vector3(...(pole ?? [sx * 0.6, -0.3, -1])), UARM, FARM + 0.03);
    }
    // legs: targets in hips space (ankle points)
    const legLen = THIGH + SHIN;
    let fl: V3 = p.footL ?? [-0.1, -(HIP - (p.drop ?? 0) + bob) + 0.085, 0.0], fr: V3 = p.footR ?? [0.1, -(HIP - (p.drop ?? 0) + bob) + 0.085, 0.0];
    if (walk !== undefined && !p.footL) {
      const st = 0.2, lift = 0.07;
      fl = [-0.1, fl[1] + lift * Math.max(0, Math.sin(walk + Math.PI)), st * Math.cos(walk + Math.PI / 2)];
      fr = [0.1, fr[1] + lift * Math.max(0, Math.sin(walk)), st * Math.cos(walk - Math.PI / 2)];
    }
    for (const [hp, kn, tgt] of [[this.hipL, this.knL, fl], [this.hipR, this.knR, fr]] as const) {
      ik2(hp.quaternion, kn.quaternion, hp.position, new THREE.Vector3(...tgt).sub(new THREE.Vector3(0, 0, 0)), new THREE.Vector3(...(p.knee ?? [0, 0.2, 1])), THIGH, Math.min(SHIN, legLen));
    }
    // keep the feet flat: undo the leg chain's rotation on the foot
    for (const [hp, kn, ft] of [[this.hipL, this.knL, this.ftL], [this.hipR, this.knR, this.ftR]] as const) {
      _q.copy(hp.quaternion).multiply(kn.quaternion).invert();
      ft.quaternion.copy(_q);
    }
    // face
    const key = JSON.stringify(p.face);
    if (key !== this.lastFace) {
      drawFace(this.faceG, { glasses: this.look.glasses, beard: this.look.beard, brow: this.look.brow, ...p.face }, this.look.skin);
      this.faceTex.needsUpdate = true; this.lastFace = key;
    }
    R.updateMatrixWorld(true);
  }
}
