// Static scenery: merged batches (one mesh per material), box-section strands rebuilt along a path every frame
// (chains, rails), and the town on both banks: gabled houses with painted facades, church, mill + chimneys, quay,
// hills and CC0 Kenney props (trees, lanterns, stalls, hedges).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { D0, STATION, MAILBOX, DOOR, WIN, ROOM_W, ROOM_D, ROOM_H, DEN, KITCHEN, DINING, DESK, KTABLE, DTABLE } from "./story";
import { brick, rng, ctex, rep, facadeHD, roofHD, stoneHD, cobbleHD, beam, grassHD, planksHD } from "./paint";
import { twoTone } from "./shade";

export type Kit = Record<string, THREE.Object3D>;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------------- materials (shared, cached) ----------------
const mats = new Map<string, THREE.Material>();
/** materials whose Strands are built as real interlocking chain links (MAT pass) instead of a textured box tube */
const CHAIN_MATS = new WeakSet<THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    if (key === "chainHD") {
      // MAT pass: the chain material (world.ts) becomes slate blue-grey iron with a soft painted-metal highlight;
      // its Strands switch to link geometry, so links read in close-ups (bank f1780, overhead f1650)
      const c = twoTone(new THREE.MeshPhongMaterial({ color: "#7a8490", specular: "#6c727b", shininess: 30 }));
      CHAIN_MATS.add(c);
      m = c as unknown as THREE.MeshLambertMaterial;
    } else m = twoTone(new THREE.MeshLambertMaterial(make()));
    mats.set(key, m);
  }
  return m;
};
const lamOf = new Map<string, THREE.MeshLambertMaterial>();
// the nature kit ships a teal palette; our valley wants storybook greens and browns
const GREENS = ["#62ae4c", "#56a447", "#72b853"];
const RECOLOR: Record<string, string> = { grass: "#6aab4f", leafsDark: "#4a9142", woodBark: "#8a5a3c", woodInner: "#e8cfa4", wood: "#a8724a",
  woodDark: "#7a4f33", dirt: "#8a6a4a", stone: "#b7b4ad" };
/** Kenney GLB materials -> Lambert, so the whole world shares one lighting model */
const toLambert = (m: THREE.Material) => {
  let l = lamOf.get(m.uuid);
  if (!l) {
    const s = m as THREE.MeshStandardMaterial;
    const col = m.name === "leafsGreen" ? GREENS[lamOf.size % 3] : RECOLOR[m.name];
    l = twoTone(new THREE.MeshLambertMaterial({ color: col ? new THREE.Color(col) : s.color?.clone() ?? new THREE.Color("#ffffff"), map: s.map ?? null, side: s.side, alphaTest: s.alphaTest }));
    lamOf.set(m.uuid, l);
  }
  return l;
};

// ---------------- geometry pieces ----------------
const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};
/** quad a,b,c,d counter-clockwise seen from its front; uv (u0,v0) at a, (u1,v1) at c */
export const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u1 = 1, v1 = 1, u0 = 0, v0 = 0) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2, 3, 4, 5].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  return g;
};
export const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  return g;
};
/** axis box from min to max, texture tiled every `tile` metres (0 = one image per face) */
export const boxGeo = (min: THREE.Vector3, max: THREE.Vector3, tile = 0, bottom = false) => {
  const [x0, y0, z0] = [min.x, min.y, min.z], [x1, y1, z1] = [max.x, max.y, max.z];
  const t = (a: number) => (tile ? a / tile : 1);
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const faces = [
    quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), t(w), t(h)),
    quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), t(w), t(h)),
    quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), t(d), t(h)),
    quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), t(d), t(h)),
    quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), t(w), t(d)),
  ];
  if (bottom) faces.push(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), t(w), t(d)));
  return mergeGeometries(faces, false);
};

/** collects pieces by material and merges them into one static mesh per material */
export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal)); else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x); else this.g.set(mat, [x]);
  }
  addObject(o: THREE.Object3D, m: THREE.Matrix4) {
    o.updateMatrixWorld(true);
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      this.add(mesh.geometry, toLambert(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material), new THREE.Matrix4().multiplyMatrices(m, mesh.matrixWorld));
    });
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}

// ---------------- strands: box-section tube along a path, rebuilt in place ----------------
// chain-link template (MAT pass): a stadium-shaped ring tube in link space (x along the chain, y in the ring plane,
// z across), NS centre-line samples x NR tube sides, smooth normals (clean ink silhouettes, no facet creases)
const LNS = 16, LNR = 6;
type LinkT = { p: Float32Array; n: Float32Array; idx: number[]; pitch: number };
const linkTemplate = (h: number): LinkT => {
  const ow = h * 0.85, rb = ow * 0.14, ol = ow * 1.62, rc = ow / 2 - rb, hl = ol / 2 - rb - rc;
  const p = new Float32Array(LNS * LNR * 3), n = new Float32Array(LNS * LNR * 3), idx: number[] = [];
  for (let j = 0; j < LNS; j++) {
    const th = (2 * Math.PI * (j + 0.5)) / LNS, nx = Math.cos(th), ny = Math.sin(th);
    const cx = rc * nx + Math.sign(nx) * hl, cy = rc * ny;
    for (let k = 0; k < LNR; k++) {
      const ph = (2 * Math.PI * k) / LNR, cp = Math.cos(ph), sp = Math.sin(ph), o = (j * LNR + k) * 3;
      p[o] = cx + rb * cp * nx; p[o + 1] = cy + rb * cp * ny; p[o + 2] = rb * sp;
      n[o] = cp * nx; n[o + 1] = cp * ny; n[o + 2] = sp;
      const a = j * LNR + k, b = j * LNR + ((k + 1) % LNR), c = ((j + 1) % LNS) * LNR + ((k + 1) % LNR), d = ((j + 1) % LNS) * LNR + k;
      idx.push(a, d, c, a, c, b); // outward winding
    }
  }
  return { p, n, idx, pitch: ol - 4 * rb };
};

export class Strand {
  mesh: THREE.Mesh;
  private pos: Float32Array; private nor: Float32Array; private uv: Float32Array;
  private lt: LinkT | null = null; private maxLinks = 0;
  constructor(public n: number, public w: number, public h: number, mat: THREE.Material, public tile = 1, cast = true) {
    const g = new THREE.BufferGeometry();
    if (CHAIN_MATS.has(mat)) {
      // link mode: up to maxLinks interlocking links laid along the path every frame (draw range = links used)
      const lt = (this.lt = linkTemplate(h)), nv = LNS * LNR;
      this.maxLinks = 440;
      this.pos = new Float32Array(this.maxLinks * nv * 3); this.nor = new Float32Array(this.maxLinks * nv * 3); this.uv = new Float32Array(this.maxLinks * nv * 2);
      const idx = new Uint32Array(this.maxLinks * lt.idx.length);
      for (let l = 0; l < this.maxLinks; l++) for (let i = 0; i < lt.idx.length; i++) idx[l * lt.idx.length + i] = lt.idx[i] + l * nv;
      g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(this.nor, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.setDrawRange(0, 0);
    } else {
      this.pos = new Float32Array(n * 12); this.nor = new Float32Array(n * 12); this.uv = new Float32Array(n * 8);
      g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(this.nor, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2));
      const idx: number[] = [];
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < 4; k++) {
        const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = (i + 1) * 4 + ((k + 1) % 4), d = (i + 1) * 4 + k;
        idx.push(a, b, c, a, c, d);
      }
      g.setIndex(idx);
    }
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false; this.mesh.castShadow = cast; this.mesh.receiveShadow = true;
  }
  private T = new THREE.Vector3(); private S = new THREE.Vector3(); private N = new THREE.Vector3();
  /** link mode: links every `pitch` along the polyline, centred, alternating ring plane (vertical / horizontal) */
  private setLinks(pts: THREE.Vector3[], lt: LinkT) {
    const { T, S, N } = this, nv = LNS * LNR;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = cum[cum.length - 1], count = Math.max(0, Math.min(this.maxLinks, Math.floor(total / lt.pitch)));
    const s0 = (total - (count - 1) * lt.pitch) / 2;
    let seg = 1;
    for (let l = 0; l < count; l++) {
      const s = s0 + l * lt.pitch;
      while (seg < pts.length - 1 && cum[seg] < s) seg++;
      const a = pts[seg - 1], b = pts[seg], u = (s - cum[seg - 1]) / Math.max(1e-6, cum[seg] - cum[seg - 1]);
      const px = a.x + (b.x - a.x) * u, py = a.y + (b.y - a.y) * u, pz = a.z + (b.z - a.z) * u;
      T.subVectors(b, a).normalize();
      S.set(-T.z, 0, T.x); // T x up
      if (S.lengthSq() < 1e-6) S.set(1, 0, 0);
      S.normalize(); N.crossVectors(S, T).normalize();
      const odd = l % 2 === 1;
      // ring plane: (T, N) for even links, (T, S) for odd links; z (thickness) across it
      const yx = odd ? S.x : N.x, yy = odd ? S.y : N.y, yz = odd ? S.z : N.z;
      const zx = odd ? -N.x : S.x, zy = odd ? -N.y : S.y, zz = odd ? -N.z : S.z;
      const base = l * nv * 3;
      for (let v = 0; v < nv * 3; v += 3) {
        const x = lt.p[v], y = lt.p[v + 1], z = lt.p[v + 2], o = base + v;
        this.pos[o] = px + T.x * x + yx * y + zx * z;
        this.pos[o + 1] = py + T.y * x + yy * y + zy * z;
        this.pos[o + 2] = pz + T.z * x + yz * y + zz * z;
        const nx = lt.n[v], ny = lt.n[v + 1], nz = lt.n[v + 2];
        this.nor[o] = T.x * nx + yx * ny + zx * nz;
        this.nor[o + 1] = T.y * nx + yy * ny + zy * nz;
        this.nor[o + 2] = T.z * nx + yz * ny + zz * nz;
      }
    }
    const g = this.mesh.geometry;
    g.setDrawRange(0, count * lt.idx.length);
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  }
  set(pts: THREE.Vector3[]) {
    if (this.lt) { this.setLinks(pts, this.lt); return; }
    const { T, S, N } = this;
    let len = 0;
    for (let i = 0; i < this.n; i++) {
      const p = pts[Math.min(i, pts.length - 1)];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      T.subVectors(b, a).normalize();
      S.crossVectors(T, V(0, 1, 0));
      if (S.lengthSq() < 1e-6) S.set(1, 0, 0);
      S.normalize(); N.crossVectors(S, T).normalize();
      if (i) len += p.distanceTo(pts[Math.min(i - 1, pts.length - 1)]);
      for (let k = 0; k < 4; k++) {
        const sx = k === 0 || k === 3 ? -1 : 1, sy = k < 2 ? -1 : 1, j = (i * 4 + k) * 3;
        this.pos[j] = p.x + S.x * sx * this.w / 2 + N.x * sy * this.h / 2;
        this.pos[j + 1] = p.y + S.y * sx * this.w / 2 + N.y * sy * this.h / 2;
        this.pos[j + 2] = p.z + S.z * sx * this.w / 2 + N.z * sy * this.h / 2;
        const nx = S.x * sx + N.x * sy, ny = S.y * sx + N.y * sy, nz = S.z * sx + N.z * sy, nl = Math.hypot(nx, ny, nz);
        this.nor[j] = nx / nl; this.nor[j + 1] = ny / nl; this.nor[j + 2] = nz / nl;
        this.uv[(i * 4 + k) * 2] = k / 4; this.uv[(i * 4 + k) * 2 + 1] = len / this.tile;
      }
    }
    const g = this.mesh.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; g.attributes.uv.needsUpdate = true;
  }
}

// ---------------- set dressing around the lens ----------------
/** a sight line of the film: from the lens toward the shot's subject, `len` along d (d has unit forward component) */
export type Ray = { o: THREE.Vector3; d: THREE.Vector3; len: number; core: boolean };
let sight: Ray[] = [];
/** does any sight line pass through this box? (centre lines only for small props, so they can still frame a shot) */
const inTheWay = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, coreOnly = false) => {
  for (const { o, d, len, core } of sight) {
    if (coreOnly && !core) continue;
    let t0 = 0, t1 = len;
    for (const [oo, dd, a, b] of [[o.x, d.x, x0, x1], [o.y, d.y, y0, y1], [o.z, d.z, z0, z1]]) {
      if (Math.abs(dd) < 1e-9) { if (oo < a || oo > b) t0 = Infinity; continue; }
      const ta = (a - oo) / dd, tb = (b - oo) / dd;
      t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (t0 <= t1) return true;
  }
  return false;
};

// ---------------- cartoon vegetation (MAT pass) ----------------
// Kenney's faceted low-poly trees and box hedges -> rounded storybook shapes: clustered smooth spheres for canopies
// (the two-tone sun term gives each lobe a lit cap and a cool belly), tapered trunks, rounded-box hedges. Smooth
// normals mean the world ink draws clean silhouettes and lobe-to-lobe folds instead of a crease on every facet.
type VegKind = "round" | "fat" | "tall" | "cone" | "bush" | "hedge";
const VEG: Record<string, VegKind> = {
  tree_oak: "round", tree_default: "round", tree_detailed: "round", tree_fat: "fat", "tree-high-round": "tall", tree: "tall",
  tree_cone: "cone", plant_bushLarge: "bush", plant_bushDetailed: "bush", plant_bush: "bush", hedge: "hedge",
};
const LEAF = ["#5aa83c", "#4c9a37", "#69b545", "#55a243", "#3f8f3c"];
/** canopy paint (equal px per metre on a unit sphere: 256 around x 128 pole to pole): light crown, darker belly,
 *  soft leaf-clump dabs (kept low contrast: the two-tone sun term does the main modelling) */
const leafTex = (i: number) => ctex("leafHD" + i, 256, 128, (g, r) => {
  const base = new THREE.Color(LEAF[i]), top = base.clone().offsetHSL(0.012, 0.03, 0.08), bot = base.clone().offsetHSL(-0.015, 0.0, -0.08);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(0.42, "#" + base.getHexString()); gr.addColorStop(1, "#" + bot.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  for (let k = 0; k < 46; k++) {
    const x = r() * 256, y = 10 + r() * 108, rad = 5 + r() * 9, light = y < 64 ? r() < 0.7 : r() < 0.25;
    for (const ox of [-256, 0, 256]) {
      g.strokeStyle = light ? "rgba(225,255,170,0.22)" : "rgba(20,70,30,0.2)"; g.lineWidth = 2.5; g.lineCap = "round";
      g.beginPath(); g.arc(x + ox, y + rad * 0.6, rad, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    }
  }
});
const leafMat = (i: number) => lam("leafHD" + i, () => ({ map: leafTex(i) }));
const barkMat = () => lam("barkHD", () => ({ color: "#8f5d3b" }));
const vegGeo = new Map<string, THREE.BufferGeometry>();
const lobeGeo = (q: number) => {
  const k = "lobe" + q;
  let g = vegGeo.get(k);
  if (!g) { g = new THREE.SphereGeometry(1, [20, 14, 10][q], [14, 10, 7][q]); vegGeo.set(k, g); }
  return g;
};
const trunkGeo = () => {
  let g = vegGeo.get("trunk");
  if (!g) { g = new THREE.CylinderGeometry(0.6, 1, 1, 10, 1, true).translate(0, 0.5, 0); vegGeo.set("trunk", g); }
  return g;
};
/** rounded box (exact: inner box + radius), unit size along x, smooth normals; used for hedges */
const hedgeGeo = () => {
  let g = vegGeo.get("hedge");
  if (!g) {
    g = new THREE.BoxGeometry(1, 1, 1, 18, 10, 10);
    const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute;
    // per-axis rounding radii in unit space (~0.35 m at the ends, ~0.45 m on top / sides at 3.3 x 1.56 x 1.17 m);
    // flat bottom (it sits on the lawn)
    const R = [0.106, 0.29, 0.385], v = new THREE.Vector3(), e = new THREE.Vector3(), q = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      for (let a = 0; a < 3; a++) {
        const c = v.getComponent(a), lim = a === 1 && c < 0 ? 0.5 : 0.5 - R[a];
        q[a] = THREE.MathUtils.clamp(c, -lim, lim); e.setComponent(a, (c - q[a]) / R[a]);
      }
      const L = e.length();
      if (L < 1e-6) continue;
      e.divideScalar(L);
      p.setXYZ(i, q[0] + e.x * R[0], q[1] + e.y * R[1], q[2] + e.z * R[2]);
      const nn = new THREE.Vector3(e.x / R[0], e.y / R[1], e.z / R[2]).normalize();
      n.setXYZ(i, nn.x, nn.y, nn.z);
    }
    g.translate(0, 0.5, 0);
    vegGeo.set("hedge", g);
  }
  return g;
};
const yawQ = (a: number) => new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
/** half-width of a cartoon plant of kind k and height h (for the sight-line test) */
const vegRad = (k: VegKind, h: number) => (k === "hedge" ? 1.7 : k === "bush" ? 0.85 * h : k === "tall" ? 0.2 * h : k === "cone" ? 0.27 * h : k === "fat" ? 0.44 * h : 0.39 * h);
/** add one cartoon plant to a batch: base at (x, y, z), height h, q = lobe detail (0 near .. 2 far) */
const addVeg = (b: Batch, k: VegKind, x: number, y: number, z: number, h: number, seed: number, q = 0) => {
  const r = rng(Math.abs(Math.floor(seed)) % 200000 + 7), U = (a: number, c: number) => a + (c - a) * r();
  const leaf = leafMat(k === "cone" ? 4 : k === "hedge" ? 1 : Math.floor(r() * 4)), lobe = lobeGeo(q), yaw = r() * 6.28;
  const put = (px: number, py: number, pz: number, rad: number, sy = 0.9) =>
    b.add(lobe, leaf, new THREE.Matrix4().compose(V(x + px, y + py, z + pz), yawQ(r() * 6.28), V(rad, rad * sy, rad)));
  const trunk = (th: number, tr: number) =>
    b.add(trunkGeo(), barkMat(), new THREE.Matrix4().compose(V(x, y - 0.15, z), yawQ(yaw), V(tr, th + 0.15, tr)));
  const ring = (n: number, dist: number, r0: number, r1: number, cy: number, dy: number) => {
    const a0 = r() * 6.28;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i * 6.28) / n + U(-0.35, 0.35), dd = dist * U(0.85, 1.12);
      put(Math.cos(a) * dd, cy + U(-dy, dy), Math.sin(a) * dd, U(r0, r1));
    }
  };
  if (k === "round" || k === "fat") {
    const f = k === "fat";
    trunk((f ? 0.4 : 0.48) * h, 0.055 * h);
    const cy = (f ? 0.58 : 0.64) * h;
    put(0, cy, 0, (f ? 0.29 : 0.26) * h);
    ring(f ? 5 : 4, (f ? 0.22 : 0.18) * h, (f ? 0.19 : 0.17) * h, (f ? 0.23 : 0.21) * h, cy - 0.05 * h, 0.04 * h);
    put(U(-0.05, 0.05) * h, cy + (f ? 0.15 : 0.17) * h, U(-0.05, 0.05) * h, (f ? 0.19 : 0.17) * h);
  } else if (k === "tall") {
    trunk(0.34 * h, 0.045 * h);
    put(0, 0.47 * h, 0, 0.17 * h, 1.3);
    put(U(-0.03, 0.03) * h, 0.65 * h, U(-0.03, 0.03) * h, 0.15 * h, 1.3);
    put(0, 0.82 * h, 0, 0.11 * h, 1.25);
    ring(3, 0.1 * h, 0.1 * h, 0.12 * h, 0.55 * h, 0.06 * h);
  } else if (k === "cone") {
    trunk(0.2 * h, 0.05 * h);
    put(0, 0.3 * h, 0, 0.26 * h, 0.62);
    put(0, 0.5 * h, 0, 0.2 * h, 0.66);
    put(0, 0.68 * h, 0, 0.14 * h, 0.75);
    put(0, 0.84 * h, 0, 0.08 * h, 1.0);
  } else if (k === "bush") {
    put(0, 0.46 * h, 0, 0.5 * h);
    ring(3, 0.42 * h, 0.32 * h, 0.38 * h, 0.32 * h, 0.04 * h);
  } else { // hedge segment, 3.3 m along local x
    b.add(hedgeGeo(), leaf, new THREE.Matrix4().compose(V(x, y - 0.06, z), new THREE.Quaternion(), V(3.3, h + 0.06, Math.max(0.9, h * 0.78))));
  }
};

// ---------------- painted cloth banner (MAT round 3) ----------------
// The Kenney banner is one flat face of the saturated colour atlas: in golden light it kept a uniform, hot red and
// read as pasted on. Ours is a hanging cloth with real folds (smooth normals, so the two-tone light rolls across
// them), a swallow-tail hem, a muted crimson (sat ~-25 %) with an ochre border and a diamond like the tower flags.
const BANNER_COL: Record<string, string> = { "banner-red": "#b8553a", "banner-green": "#4f8a5a" }; // warm red: no purple in shade
const FOLD = 0.27, CLOTH_W = 1.1, CLOTH_H = 2.6; // fold period across the cloth, cloth size (m)
const bannerTex = (col: string) => ctex("bannerHD" + col, 256, 700, (g) => {
  const W = 256, H = 700, base = new THREE.Color(col);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#" + base.clone().offsetHSL(0, 0, 0.04).getHexString()); gr.addColorStop(1, "#" + base.clone().offsetHSL(0, 0, -0.06).getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x++) { // painted fold shading, in phase with the geometry folds
    const s = Math.sin((x / W) * (CLOTH_W / FOLD) * Math.PI * 2);
    g.fillStyle = s > 0 ? `rgba(255,235,215,${0.1 * s})` : `rgba(60,15,15,${-0.12 * s})`; g.fillRect(x, 0, 1, H);
  }
  g.fillStyle = "#" + base.clone().offsetHSL(0, -0.05, -0.12).getHexString(); g.fillRect(0, 0, W, 54); // top hem
  g.strokeStyle = "#d1aa5c"; g.lineWidth = 9; g.strokeRect(20, 66, W - 40, H - 86);                 // ochre border
  g.strokeStyle = "rgba(60,30,20,0.45)"; g.lineWidth = 2; g.strokeRect(14, 60, W - 28, H - 74); g.strokeRect(26, 72, W - 52, H - 98);
  g.fillStyle = "#d1aa5c"; g.fillRect(0, 46, W, 8);
  const cx = W / 2, cy = 250; // emblem: diamond (the tower flags' motif) on a light disc
  g.fillStyle = "#efe2c2"; g.beginPath(); g.arc(cx, cy, 62, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(60,30,20,0.55)"; g.lineWidth = 3; g.stroke();
  g.fillStyle = "#d1aa5c"; g.beginPath(); g.moveTo(cx, cy - 46); g.lineTo(cx + 34, cy); g.lineTo(cx, cy + 46); g.lineTo(cx - 34, cy); g.closePath(); g.fill();
  g.strokeStyle = "rgba(60,30,20,0.6)"; g.lineWidth = 2.5; g.stroke();
});
const bannerGeo = () => {
  let geo = vegGeo.get("banner");
  if (!geo) {
    const w = CLOTH_W, hh = CLOTH_H, notch = 0.42;
    geo = new THREE.PlaneGeometry(w, hh, 16, 20).translate(0, -hh / 2, 0); // top edge at y = 0
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), t = -y / hh; // 0 top .. 1 bottom
      p.setY(i, y + notch * (1 - Math.abs(x) / (w / 2)) * t * t);                              // swallow-tail hem
      p.setZ(i, (0.025 + 0.055 * t) * Math.sin((x / FOLD) * Math.PI * 2 + 0.6) + 0.04 * t * t); // folds deepen downwards
    }
    geo.computeVertexNormals();
    vegGeo.set("banner", geo);
  }
  return geo;
};
/** gonfalon on a pole where the Kenney banner plate stood: its plate hung 0.4 x scale beside the placement point,
 *  facing local +-x, so the pole goes there (same framing) and the cloth faces that way */
const bannerProp = (b: Batch, name: string, x0: number, y: number, z0: number, h: number, yaw0: number) => {
  const off = 0.4 * (h / 0.84), x = x0 + Math.cos(yaw0) * off, z = z0 - Math.sin(yaw0) * off, yaw = yaw0 + Math.PI / 2;
  if (inTheWay(x - 0.7, x + 0.7, y, y + h, z - 0.7, z + 0.7, true)) return;
  const col = BANNER_COL[name] ?? "#b4524b";
  const M = (px: number, py: number, pz: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z).multiply(new THREE.Matrix4().makeTranslation(px, py, pz));
  const pole = lam("bannerPole", () => ({ color: "#6e4b33" })), gold = lam("bannerGold", () => ({ color: "#c9a24e" }));
  b.add(new THREE.CylinderGeometry(0.045, 0.06, h, 10).translate(0, h / 2, 0), pole, M(0, 0, 0));
  b.add(new THREE.SphereGeometry(0.1, 14, 10), gold, M(0, h + 0.06, 0));
  b.add(new THREE.CylinderGeometry(0.03, 0.03, CLOTH_W + 0.2, 8).rotateZ(Math.PI / 2), pole, M(0, h - 0.18, 0.06));
  for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.045, 10, 8), gold, M(s * (CLOTH_W / 2 + 0.12), h - 0.18, 0.06));
  b.add(bannerGeo(), lam("bannerHD" + col, () => ({ map: bannerTex(col), side: THREE.DoubleSide })), M(0, h - 0.2, 0.1));
};

// ---------------- Kenney props ----------------
const boxes = new Map<THREE.Object3D, THREE.Box3>();
/** place a Kenney model with its base on y, scaled to height h (left out when it would stand in front of the lens).
 *  Trees, bushes and hedges are drawn as cartoon vegetation, banners as painted cloth instead (MAT pass). */
export const prop = (b: Batch, kit: Kit, name: string, x: number, y: number, z: number, h: number, yaw = 0) => {
  if (name.startsWith("banner")) { bannerProp(b, name, x, y, z, h, yaw); return; }
  const vk = VEG[name];
  if (vk) {
    const rad = vegRad(vk, h);
    if (inTheWay(x - rad, x + rad, y, y + h, z - rad, z + rad, true)) return;
    const d = Math.hypot(x, z);
    addVeg(b, vk, x, y, z, h, x * 92.7 + z * 31.3 + yaw * 1000, d > 200 ? 2 : Math.abs(z) > 45 && d > 60 ? 1 : 0);
    return;
  }
  const o = kit[name];
  if (!o) return;
  let box = boxes.get(o);
  if (!box) { box = new THREE.Box3().setFromObject(o); boxes.set(o, box); }
  const s = h / Math.max(0.01, box.max.y - box.min.y), r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * s * 0.5;
  if (inTheWay(x - r, x + r, y, y + h, z - r, z + r, true)) return;
  b.addObject(o, new THREE.Matrix4().compose(V(x, y - box.min.y * s, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(s, s, s)));
};

/** a Kenney model as its own object (two-tone materials), base at y = 0, scaled to height h (no sight-line test:
 *  used for the CAM agent's FOREGROUND framing objects, which are meant to stand in front of the lens) */
export const kitClone = (kit: Kit, name: string, h: number): THREE.Object3D | null => {
  const vk = VEG[name];
  if (vk) { // cartoon plant as its own object (MAT pass), base at y = 0
    const vb = new Batch(), grp = new THREE.Group();
    addVeg(vb, vk, 0, 0, 0, h, name.length * 977 + h * 131, 0);
    vb.build(grp, false);
    grp.traverse((x) => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = true; } });
    return grp;
  }
  const o = kit[name];
  if (!o) return null;
  let box = boxes.get(o);
  if (!box) { box = new THREE.Box3().setFromObject(o); boxes.set(o, box); }
  const c = o.clone(true), s = h / Math.max(0.01, box.max.y - box.min.y);
  c.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.isMesh) { m.material = toLambert(Array.isArray(m.material) ? m.material[0] : m.material); m.castShadow = false; m.receiveShadow = true; }
  });
  const g = new THREE.Group();
  c.position.y = -box.min.y * s; c.scale.setScalar(s);
  g.add(c);
  return g;
};

// ---------------- houses ----------------
type Style = { wall: string; shutter: string; roof: string; timber?: boolean; brick?: boolean };
// MAT pass: warm ochre / cream / sandstone / salmon walls + one blue-grey (the old pinks, whites and grey-blues read
// lavender: the two-tone shade multiplies by a blue-violet, so a near-neutral albedo turns lilac on every shaded face)
// round 3: saturation -35 % on every wall (neutral warm grey / beige; the salmon became a warm greige)
// round 4: the pale greiges still read lavender-grey in shade -> a muted brick / cream / ochre / terracotta spread
const STYLES: Style[] = [
  { wall: "#ecdab2", shutter: "#3f6fb5", roof: "#d27a62" },              // cream
  { wall: "#d8a95f", shutter: "#2f6a43", roof: "#b8644f" },              // ochre
  { wall: "#c47a5c", shutter: "#2f5f6a", roof: "#8f97a8" },              // muted brick-red plaster
  { wall: "#efdcb8", shutter: "#2f5f6a", roof: "#c9775a", timber: true }, // cream timber frame
  { wall: "#ddbd78", shutter: "#5a3b2a", roof: "#d27a62" },              // straw ochre
  { wall: "#cc9a6c", shutter: "#3f6fb5", roof: "#8e7aa0" },              // terracotta sand
  { wall: "#e2c49a", shutter: "#8c3b4a", roof: "#c9775a" },              // warm sandstone
  { wall: "#e3d2b8", shutter: "#2f6a43", roof: "#8f97a8", brick: true },
];
const roofMat = (col: string) => lam("roof" + col, () => ({ map: roofHD(col, col === "#8f97a8"), side: THREE.DoubleSide }));

/** gabled house: front facade (local +z) at width w, depth d, wall height h, ridge along local x (left out if it blocks a shot) */
/** night window glows collected while houses are built (thief short): lit fraction, batch */
export const GLOW: { b: Batch | null; lit: number; seed: number } = { b: null, lit: 0.45, seed: 1 };
const glowMats = [new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.7, 0.75) }), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.35, 0.55) }),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 1.3, 2.4) })];
export const house = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, h: number, si: number, y = D0, force = false): boolean => {
  const across = Math.abs(Math.sin(yaw)) > 0.5, hx = (across ? d : w) / 2 + (across ? 0.1 : 0.6), hz = (across ? w : d) / 2 + (across ? 0.6 : 0.1);
  if (!force && inTheWay(x - hx, x + hx, y, y + h + d * 0.42 + 1.2, z - hz, z + hz)) return false;
  const st = STYLES[si % STYLES.length];
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const front = lam(`hf${si}_${w}_${h}`, () => ({ map: facadeHD(`hf${si}_${w}_${h}`, w, h, { ...st, door: true }) }));
  const side = lam(`hs${si}_${h}`, () => ({ map: facadeHD(`hs${si}_${h}`, 8, h, st) }));
  const wall = lam("wall" + st.wall, () => ({ color: st.brick ? "#c8643f" : st.wall }));
  const hw = w / 2, hd = d / 2, rh = d * 0.42, o = 0.35;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), side, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  b.add(tri(V(-hw, h, -hd), V(-hw, h, hd), V(-hw, h + rh, 0)), wall, m);
  b.add(tri(V(hw, h, hd), V(hw, h, -hd), V(hw, h + rh, 0)), wall, m);
  const ru = (w + 2 * o) / 4, rv = Math.hypot(hd + o, rh) / 4, rm = roofMat(st.roof);
  b.add(quad(V(-hw - o, h - 0.25, hd + o), V(hw + o, h - 0.25, hd + o), V(hw + o, h + rh, 0), V(-hw - o, h + rh, 0), ru, rv), rm, m);
  b.add(quad(V(hw + o, h - 0.25, -hd - o), V(-hw - o, h - 0.25, -hd - o), V(-hw - o, h + rh, 0), V(hw + o, h + rh, 0), ru, rv), rm, m);
  const cx = hw * 0.45 * (si % 2 ? 1 : -1);
  b.add(boxGeo(V(cx - 0.4, h + rh * 0.3, -hd * 0.35 - 0.4), V(cx + 0.4, h + rh + 1.1, -hd * 0.35 + 0.4), 2), lam("chim", () => ({ map: rep(brick(), 1, 1) })), m);
  houseDetail(b, m, w, d, h, rh, cx);
  if (GLOW.b && !force) { // night (not on the owner's house: its 3D window pane would z-fight the glow): some front windows glow (facadeHD layout: nWin per floor, sill fl * 2.8 + 0.9, 0.85 x 1.25 m)
    const n = Math.max(1, Math.floor(w / 2.2)), floors = Math.max(1, Math.floor(h / 2.8)), q = new THREE.PlaneGeometry(0.85, 1.25);
    for (let fl = 0; fl < floors; fl++) for (let i = 0; i < n; i++) {
      if (fl === 0 && i === Math.floor(n / 2)) continue;
      const v = Math.sin((x * 12.9898 + z * 78.233 + fl * 37.7 + i * 11.3 + GLOW.seed) * 43758.5453), u = v - Math.floor(v);
      if (u > GLOW.lit) continue;
      GLOW.b.add(q, glowMats[u < 0.05 ? 2 : u < GLOW.lit * 0.5 ? 0 : 1], m.clone().multiply(new THREE.Matrix4().makeTranslation(-hw + ((i + 0.5) * w) / n, fl * 2.8 + 0.9 + 0.625, hd + 0.03)));
    }
  }
  return true;
};

// round 4: real 3D relief on every house (was a flat window-textured box): stone plinth, cornice under the eaves,
// window sills + lintel hoods matching facadeHD's window layout, front door step + door hood, chimney cap and pot
const UB = new THREE.BoxGeometry(1, 1, 1);
const trimM = () => lam("trimStone", () => ({ color: "#efe3c8" }));
const capM = () => lam("chimCap", () => ({ color: "#9a8778" }));
const plinthM = () => lam("plinthHD", () => ({ map: stoneHD("copeHD") }));
const ub = (b: Batch, mat: THREE.Material, m: THREE.Matrix4, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  b.add(UB, mat, m.clone().multiply(new THREE.Matrix4().compose(V((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), new THREE.Quaternion(), V(x1 - x0, y1 - y0, z1 - z0))));
const houseDetail = (b: Batch, m: THREE.Matrix4, w: number, d: number, h: number, rh: number, chx: number) => {
  const hw = w / 2, hd = d / 2, tm = trimM(), floors = Math.max(1, Math.floor(h / 2.8));
  b.add(boxGeo(V(-hw - 0.07, -0.05, -hd - 0.07), V(hw + 0.07, 0.45, hd + 0.07), 2), plinthM(), m);          // plinth
  ub(b, tm, m, -hw - 0.12, hw + 0.12, h - 0.52, h - 0.25, hd, hd + 0.17);                                   // cornice front
  ub(b, tm, m, -hw - 0.12, hw + 0.12, h - 0.52, h - 0.25, -hd - 0.17, -hd);                                 // cornice back
  for (const s of [-1, 1]) ub(b, tm, m, s < 0 ? -hw - 0.17 : hw, s < 0 ? -hw : hw + 0.17, h - 0.52, h - 0.25, -hd - 0.12, hd + 0.12);
  // windows: facadeHD puts nWin = floor(width / 2.2) per floor at (i + 0.5) / nWin, sill line fl * 2.8 + 0.9 m
  const wins = (len: number, door: boolean, at: (u: number) => [number, number], out: [number, number]) => {
    const n = Math.max(1, Math.floor(len / 2.2));
    for (let fl = 0; fl < floors; fl++) for (let i = 0; i < n; i++) {
      const [px, pz] = at((i + 0.5) / n), yb = fl * 2.8 + 0.9;
      if (door && fl === 0 && i === Math.floor(n / 2)) {
        const along = (k: number) => [px + out[1] * k, pz - out[0] * k] as const; // along the wall (perpendicular to out)
        const [ax, az] = along(-0.82), [bx, bz] = along(0.82), [cx2, cz2] = along(-0.78), [dx2, dz2] = along(0.78);
        ub(b, plinthM(), m, Math.min(ax, bx, ax + out[0] * 0.5), Math.max(ax, bx, ax + out[0] * 0.5), 0, 0.2, Math.min(az, bz, az + out[1] * 0.5), Math.max(az, bz, az + out[1] * 0.5)); // step
        ub(b, tm, m, Math.min(cx2, dx2, cx2 + out[0] * 0.34), Math.max(cx2, dx2, cx2 + out[0] * 0.34), 2.3, 2.44, Math.min(cz2, dz2, cz2 + out[1] * 0.34), Math.max(cz2, dz2, cz2 + out[1] * 0.34)); // hood
        continue;
      }
      for (const [y0, y1, dep, half] of [[yb - 0.2, yb - 0.08, 0.14, 0.6], [yb + 1.33, yb + 1.43, 0.08, 0.55]] as const) {
        const ax = px - out[1] * half, az = pz + out[0] * half, bx = px + out[1] * half, bz = pz - out[0] * half;
        ub(b, tm, m, Math.min(ax, bx, ax + out[0] * dep), Math.max(ax, bx, ax + out[0] * dep), y0, y1, Math.min(az, bz, az + out[1] * dep), Math.max(az, bz, az + out[1] * dep));
      }
    }
  };
  wins(w, true, (u) => [-hw + u * w, hd], [0, 1]);            // front (+z), u from -x to +x
  wins(8, false, (u) => [hw - u * w, -hd], [0, -1]);          // back: side texture (8 m layout) stretched over w
  wins(8, false, (u) => [-hw, -hd + u * d], [-1, 0]);         // left side (-x): side texture is always the 8 m layout
  wins(8, false, (u) => [hw, hd - u * d], [1, 0]);            // right side (+x)
  // chimney cap + pot
  const cz = -hd * 0.35, top = h + rh + 1.1;
  ub(b, capM(), m, chx - 0.52, chx + 0.52, top, top + 0.16, cz - 0.52, cz + 0.52);
  b.add(new THREE.CylinderGeometry(0.13, 0.16, 0.42, 10).translate(0, 0.21, 0), lam("chimPot", () => ({ color: "#b8684a" })), m.clone().multiply(new THREE.Matrix4().makeTranslation(chx, top + 0.16, cz)));
};

// ---------------- painted extras ----------------
const chapelTex = () => ctex("chapel", 512, 512, (g) => {
  g.fillStyle = "#e9e0cc"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(0,0,0,.06)"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 512, 2);
  for (const cx of [128, 384]) {
    g.fillStyle = "#33406b"; g.strokeStyle = "rgba(40,30,40,.85)"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx - 40, 430); g.lineTo(cx - 40, 190); g.arc(cx, 190, 40, Math.PI, 0); g.lineTo(cx + 40, 430); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "rgba(160,200,255,.35)"; g.fillRect(cx - 30, 200, 16, 220);
    g.strokeStyle = "#d9c9a0"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 160); g.lineTo(cx, 430); g.moveTo(cx - 40, 300); g.lineTo(cx + 40, 300); g.stroke();
  }
});
const clockTex = () => ctex("clock", 256, 256, (g) => {
  g.fillStyle = "#f7f1e1"; g.strokeStyle = "#221f2e"; g.lineWidth = 12;
  g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); g.stroke();
  g.lineCap = "round";
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.lineWidth = 8; g.beginPath(); g.moveTo(128 + 80 * Math.cos(a), 128 + 80 * Math.sin(a)); g.lineTo(128 + 96 * Math.cos(a), 128 + 96 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 62); g.stroke();
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(178, 150); g.stroke();
});
/** round 4: St George's cross (England, 1831): white field, red cross (the old red + yellow diamond read as Vietnam's flag) */
export const flagTex = () => ctex("flagStGeorge", 256, 160, (g) => {
  g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#c8323a"; g.fillRect(0, 62, 256, 36); g.fillRect(110, 0, 36, 160);
  g.fillStyle = "rgba(120,100,90,0.10)"; g.fillRect(0, 150, 256, 10); // soft hem shade
});

// ---------------- town ----------------
const inPark = (x: number, z: number) => z < 0 && x > 46 && x < 96 && z > -100 && z < -49;
const inMill = (x: number, z: number) => z < 0 && x > -66 && x < -14 && z > -90 && z < -54;
const inChurch = (x: number, z: number) => (z > 0 && x > 10 && x < 38 && z > 46 && z < 84) || (z > 0 && x > 86 && x < 110 && z > 60 && z < 84);

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(11);
  sight = rays;
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  for (const bank of [-1, 1]) {
    const away = bank > 0 ? Math.PI : 0; // fronts face the river
    // riverfront rows, fronts on the quay at |z| = 36.5
    for (const sx of [-1, 1]) {
      let x = 8.5;
      while (x < 134) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]), cx = sx * (x + w / 2), cz = bank * 40.5;
        house(b, cx, cz, away, w, 8, h, Math.floor(r() * 8));
        x += w + (r() < 0.25 ? 2.5 : 0.25);
      }
    }
    // main street, fronts on |x| = 6
    for (const sx of [-1, 1]) {
      let z = 46;
      while (z < 150) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]);
        if (!inChurch(sx * 10, bank * (z + w / 2))) house(b, sx * 10, bank * (z + w / 2), sx < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8, h, Math.floor(r() * 8));
        z += w + (r() < 0.2 ? 3 : 0.3);
      }
    }
    // back rows
    for (const zf of [52, 66, 80, 96]) for (const sx of [-1, 1]) {
      let x = 17 + r() * 4;
      while (x < 124) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]), cx = sx * (x + w / 2), cz = bank * (zf + 4 + r() * 2);
        if (r() > 0.22 && !inPark(cx, cz) && !inMill(cx, cz) && !inChurch(cx, cz)) house(b, cx, cz, away, w, 8, h, Math.floor(r() * 8));
        x += w + 1 + r() * 4;
      }
    }
  }
  // church on the far bank: nave, tower, spire, clock
  const ch = lam("chapel", () => ({ map: chapelTex() })), st = lam("towerstone", () => ({ map: stoneHD("tstoneHD") })); // 2048 canvas at its own repeat 0.5 (paint.ts)
  b.add(boxGeo(V(18.5, D0, 57), V(29.5, D0 + 9, 80), 6), ch);
  const sl = roofMat("#8f97a8");
  b.add(quad(V(18.1, D0 + 8.8, 57), V(18.1, D0 + 8.8, 80.4), V(24, D0 + 13.5, 80.4), V(24, D0 + 13.5, 57), 6, 2), sl);
  b.add(quad(V(29.9, D0 + 8.8, 80.4), V(29.9, D0 + 8.8, 57), V(24, D0 + 13.5, 57), V(24, D0 + 13.5, 80.4), 6, 2), sl);
  b.add(tri(V(18.5, D0 + 9, 80), V(29.5, D0 + 9, 80), V(24, D0 + 13.5, 80)), st);
  b.add(boxGeo(V(21.4, D0, 51.6), V(26.6, D0 + 19, 57), 4), st);
  b.add(boxGeo(V(21.1, D0 + 18.6, 51.3), V(26.9, D0 + 19.4, 57.3), 4), st);
  const spire = new THREE.ConeGeometry(4.0, 13, 4, 1);
  spire.rotateY(Math.PI / 4);
  b.add(spire, sl, new THREE.Matrix4().makeTranslation(24, D0 + 19.4 + 6.5, 54.3));
  b.add(tri(V(29.5, D0 + 9, 57), V(18.5, D0 + 9, 57), V(24, D0 + 13.5, 57)), st);
  b.add(quad(V(25.1, D0 + 12.4, 51.55), V(22.9, D0 + 12.4, 51.55), V(22.9, D0 + 14.6, 51.55), V(25.1, D0 + 14.6, 51.55)), lam("clock", () => ({ map: clockTex(), alphaTest: 0.5 })));
  // mill (near bank) + chimneys with smoke handled in the world
  const mill = lam("mill", () => ({ map: facadeHD("mill", 30, 13, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) }));
  const millS = lam("mills", () => ({ map: facadeHD("mills", 12, 13, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) }));
  b.add(quad(V(-58, D0, -70), V(-28, D0, -70), V(-28, D0 + 13, -70), V(-58, D0 + 13, -70)), mill);
  b.add(quad(V(-28, D0, -82), V(-58, D0, -82), V(-58, D0 + 13, -82), V(-28, D0 + 13, -82)), mill);
  b.add(quad(V(-58, D0, -82), V(-58, D0, -70), V(-58, D0 + 13, -70), V(-58, D0 + 13, -82)), millS);
  b.add(quad(V(-28, D0, -70), V(-28, D0, -82), V(-28, D0 + 13, -82), V(-28, D0 + 13, -70)), millS);
  b.add(quad(V(-58.4, D0 + 12.8, -69.6), V(-27.6, D0 + 12.8, -69.6), V(-27.6, D0 + 16.5, -76), V(-58.4, D0 + 16.5, -76), 8, 2), sl);
  b.add(quad(V(-27.6, D0 + 12.8, -82.4), V(-58.4, D0 + 12.8, -82.4), V(-58.4, D0 + 16.5, -76), V(-27.6, D0 + 16.5, -76), 8, 2), sl);
  b.add(tri(V(-58, D0 + 13, -82), V(-58, D0 + 13, -70), V(-58, D0 + 16.5, -76)), millS);
  b.add(tri(V(-28, D0 + 13, -70), V(-28, D0 + 13, -82), V(-28, D0 + 16.5, -76)), millS);
  const chim = lam("chimney", () => ({ map: rep(brick(), 2, 8) })), soot = lam("soot", () => ({ color: "#4a3442" }));
  for (const [x, z, hh] of [[-22, -77, 30], [-80, 93, 24]] as const) {
    b.add(new THREE.CylinderGeometry(0.95, 1.35, hh, 14, 1, true), chim, new THREE.Matrix4().makeTranslation(x, D0 + hh / 2, z));
    b.add(new THREE.CylinderGeometry(1.15, 1.1, 1.3, 14), soot, new THREE.Matrix4().makeTranslation(x, D0 + hh + 0.3, z));
  }
  house(b, -80, 100, Math.PI, 16, 10, 9.8, 7);
  // hills around the valley
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  ([[-360, 250, 190, 52, 120], [140, 380, 240, 64, 140], [430, 150, 170, 48, 130], [-440, -130, 190, 44, 150], [-90, -390, 250, 58, 140],
    [320, -330, 210, 54, 130], [520, -60, 160, 40, 120], [-560, 60, 200, 46, 140]] as const).forEach(([x, z, sx, sy, sz], i) =>
    b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  // trees: quays, gardens, valley, hilltops
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
  for (const bank of [-1, 1]) for (let x = -130; x <= 130; x += 22) if (Math.abs(x) > 12) prop(b, kit, pick(trees), x + r() * 4, D0, bank * 33.6, 7 + r() * 2.5, r() * 6);
  for (let i = 0; i < 140; i++) {
    const x = (r() - 0.5) * 520, z = (r() < 0.5 ? -1 : 1) * (48 + r() * 220);
    if (inPark(x, z) || inMill(x, z) || inChurch(x, z) || Math.abs(x) < 16) continue;
    prop(b, kit, pick(trees), x, D0, z, 7 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 230 + r() * 160;
    prop(b, kit, pick(["tree_cone", "tree_default", "tree_oak"]), Math.cos(a) * d * 1.3, D0, Math.sin(a) * d, 12 + r() * 6, r() * 6);
  }
  // quay furniture
  for (const bank of [-1, 1]) {
    for (let x = -126; x <= 126; x += 12) if (Math.abs(x) > 5) prop(b, kit, "lantern", x, D0, bank * 31.0, 2.8);
    prop(b, kit, "banner-red", 5.4, D0, bank * 31.6, 3.6, bank > 0 ? Math.PI : 0);
  }
  prop(b, kit, "stall-red", -14, D0, -34, 3.2);
  prop(b, kit, "stall-green", -21.5, D0, -34.4, 3.2, 0.1);
  // round 4: this cart sat blurred in shot 11's bottom-left corner (lens at 14, 10.5, -47) as a grey "mushroom"
  // (bed + handle + wheel); moved 3.5 m along the quay, out of that frame, still dressing the market
  prop(b, kit, "cart", 17.0, D0, -34.0, 2.2, 1.2);
  prop(b, kit, "stall-bench", 20, D0, -32.2, 1.0);
  prop(b, kit, "stall-green", 16, D0, 34, 3.2, Math.PI);
  prop(b, kit, "stall-red", 23.5, D0, 34.3, 3.2, Math.PI);
  prop(b, kit, "cart", -15, D0, 33.6, 2.2, 2.4);
  prop(b, kit, "windmill", 98, D0, 72, 16, -0.6);
  prop(b, kit, "canoe", -19, 0.02, 27.6, 0.7, 1.5);
  prop(b, kit, "canoe", 31, 0.02, -28.2, 0.7, -1.4);
  for (let i = 0; i < 14; i++) prop(b, kit, "lily_large", (r() - 0.5) * 120, 0.03, (r() < 0.5 ? -1 : 1) * (27.2 + r() * 2.2), 0.08, r() * 6);
  // park around the swing (near bank, x 50..92, z -96..-56)
  for (const [n, x, z, h] of [["tree_oak", 58, -66, 9.5], ["tree_fat", 84, -64, 8], ["tree_detailed", 54, -84, 9], ["tree_default", 88, -86, 9],
    ["tree_oak", 79, -95, 10], ["tree-high-round", 61, -94, 9], ["tree_default", 92, -73, 8.5]] as const) prop(b, kit, n, x, D0, z, h, x);
  for (let x = 50; x < 92; x += 3.2) prop(b, kit, "hedge", x, D0, -57, 1.5);
  for (const [x, z] of [[62, -76], [77, -71], [66, -82], [75, -80], [57, -73]]) prop(b, kit, pick(["plant_bushLarge", "plant_bushDetailed", "plant_bush"]), x, D0, z, 1.3);
  // flowers only (inked grass tufts read as green boxes), and none inside the swing's 4 m circle
  for (let i = 0; i < 26; i++) {
    const f = pick(["flower_redA", "flower_yellowA", "flower_purpleA"]), x = 56 + r() * 30, z = -60 - r() * 32;
    if (Math.hypot(x - 70, z + 75) > 4) prop(b, kit, f, x, D0, z, 0.5);
  }
  prop(b, kit, "stall-bench", 76.5, D0, -79.5, 1.0, Math.PI);
  prop(b, kit, "lantern", 64.5, D0, -71, 2.8);
  b.build(root);
  sight = [];
};

// ---------------- Boston North End waterfront, 1919 (molasses short) ----------------
// Commercial St runs along x (z 16..32) under the elevated railway (z = 24); four-storey brick blocks front it at
// z = 34; warehouses flank the tank yard on the harbour side (fronts at z = 12); the quay wall is at z = -24.
const BRICKY = [7, 2, 7, 1, 2, 7, 5, 0, 7, 2];
export const buildBoston = (root: THREE.Object3D, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(19);
  sight = rays;
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const cob = lam("cobbleHD", () => ({ map: cobbleHD() }));
  const pave = lam("paveHD", () => ({ map: stoneHD("copeHD", ["#d9cdb8", "#cfc2ac", "#e0d5c2", "#c8baa3"], "#a89a86") }));
  const yard = lam("yard", () => ({ map: stoneHD("wallHD", ["#bfae96", "#b3a28a", "#c7b8a2", "#ab9a82"], "#8f8070") }));
  const quayM = lam("quayHD", () => ({ map: stoneHD("towerHD") }));
  const wood = lam("wood", () => ({ map: beam() }));
  const flat = (x0: number, x1: number, z0: number, z1: number, y: number, m: THREE.Material, tile: number) =>
    b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), m);
  flat(-400, 400, STREET0, STREET1, 0.0, cob, 8);
  flat(-400, 400, 12, STREET0, 0.12, pave, 4);
  b.add(boxGeo(V(-400, 0, STREET0 - 0.15), V(400, 0.12, STREET0), 2), pave);
  flat(-400, 400, STREET1, 400, 0.12, pave, 4);
  b.add(boxGeo(V(-400, 0, STREET1), V(400, 0.12, STREET1 + 0.15), 2), pave);
  flat(-400, 400, -24, 12, 0.0, yard, 10);
  // quay wall + piers
  b.add(quad(V(400, -3, -24), V(-400, -3, -24), V(-400, 0, -24), V(400, 0, -24), 200, 1.5), quayM);
  b.add(boxGeo(V(-400, -0.1, -24.6), V(400, 0.25, -23.4), 2), lam("copeHD", () => ({ map: stoneHD("copeHD") })));
  for (const [x0, x1, z1] of [[-70, -58, -70], [36, 46, -64], [92, 102, -80]] as const) {
    b.add(boxGeo(V(x0, -0.35, z1), V(x1, 0.05, -24), 3), wood);
    for (let z = -28; z > z1; z -= 6) for (const x of [x0 + 0.4, x1 - 0.4]) b.add(boxGeo(V(x - 0.25, -3, z - 0.25), V(x + 0.25, -0.35, z + 0.25)), wood);
  }
  // north blocks: rows of tall brick houses; a side street at x 36..44 and -46..-38
  const gaps = [[34, 46], [-48, -36]];
  for (const [zf, rowH] of [[34, [9.8, 11.2, 12.6]], [52, [11.2, 12.6, 14]], [70, [9.8, 12.6, 14]]] as const) {
    let x = -170;
    while (x < 170) {
      const w = pick([7, 8, 9]), cx = x + w / 2;
      if (!gaps.some(([a, c]) => cx + w / 2 > a && cx - w / 2 < c)) house(b, cx, zf + 5, Math.PI, w, 10, pick(rowH as unknown as number[]), pick(BRICKY));
      x += w + (r() < 0.12 ? 1.5 : 0.15);
    }
  }
  // warehouses either side of the tank yard (harbour side)
  for (const sx of [-1, 1]) {
    let x = 20;
    while (x < 170) {
      const w = pick([12, 14]), cx = sx * (x + w / 2);
      house(b, cx, 4, 0, w, 16, pick([8.4, 9.8]), pick([7, 2, 7, 1]));
      x += w + 2.5;
    }
  }
  // the steeple on the hill behind (a white church tower with a tall spire)
  const st = lam("steeple", () => ({ color: "#eee6d6" })), sl = lam("roof#8f97a8", () => ({ map: roofHD("#8f97a8", true), side: THREE.DoubleSide }));
  const CX = -62, CZ = 128, base = 6;
  b.add(boxGeo(V(CX - 9, 0, CZ - 4), V(CX + 9, base + 10, CZ + 24), 4), lam("brickChurch", () => ({ map: facadeHD("brickChurch", 18, 16, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) })));
  b.add(boxGeo(V(CX - 4.5, 0, CZ - 9), V(CX + 4.5, base + 22, CZ)), lam("brickTower", () => ({ map: facadeHD("brickTower", 9, 28, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) })));
  b.add(boxGeo(V(CX - 3.6, base + 22, CZ - 8.1), V(CX + 3.6, base + 28, CZ - 0.9)), st);
  b.add(boxGeo(V(CX - 2.6, base + 28, CZ - 7.1), V(CX + 2.6, base + 32, CZ - 1.9)), st);
  const spire = new THREE.ConeGeometry(2.6, 16, 8); spire.translate(0, 8, 0);
  b.add(spire, sl, new THREE.Matrix4().makeTranslation(CX, base + 32, CZ - 4.5));
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  b.add(hill, lam("hillA", () => ({ color: "#8a9a6a" })), new THREE.Matrix4().compose(V(-40, -2, 160), new THREE.Quaternion(), V(130, 10, 60)));
  // elevated railway: lattice-girder deck on paired columns, dark green iron
  const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d4f46", specular: "#6a7a70", shininess: 40 }), 0.15);
  const Y = EL_Y0;
  for (let x = -198; x <= 198; x += 12) for (const z of [20.4, 27.6]) {
    b.add(boxGeo(V(x - 0.22, 0, z - 0.22), V(x + 0.22, Y, z + 0.22)), iron);
    b.add(boxGeo(V(x - 0.4, 0, z - 0.4), V(x + 0.4, 0.5, z + 0.4)), iron);
    b.add(boxGeo(V(x - 0.6, Y - 0.6, z - 0.15), V(x + 0.6, Y, z + 0.15), 0, true), iron); // knee brace
  }
  for (const z of [20.4, 27.6]) {
    b.add(boxGeo(V(-400, Y, z - 0.3), V(400, Y + 1.1, z + 0.3), 2, true), iron);
    for (let x = -396; x < 400; x += 3) b.add(beamBetween0(V(x, Y + 0.08, z + 0.32), V(x + 1.5, Y + 1.02, z + 0.32), 0.07), iron);
  }
  b.add(boxGeo(V(-400, Y + 1.1, 20), V(400, Y + 1.3, 28), 2, true), wood);
  for (let x = -398; x < 400; x += 2.4) b.add(boxGeo(V(x - 0.12, Y + 0.9, 20.2), V(x + 0.12, Y + 1.1, 27.8), 0, true), iron); // floor beams under the deck
  for (const z of [21.8, 23.2, 24.8, 26.2]) b.add(boxGeo(V(-400, Y + 1.3, z - 0.06), V(400, Y + 1.45, z + 0.06)), iron);
  b.build(root);
  sight = [];
};
const STREET0 = 16, STREET1 = 32, EL_Y0 = 6.4;
const beamBetween0 = (a: THREE.Vector3, c: THREE.Vector3, th: number) => {
  const g = new THREE.BoxGeometry(th, a.distanceTo(c), th);
  return g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
};

// ---------------- the thief short: one main street, a police station, cars, lamps; open-fronted rooms ----------------
/** front doors of the south-side houses (x), for the night clones; filled by buildCity */
export const DOORS: number[] = [];
const asphalt = () => ctex("asphaltHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#6b6d74"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { const v = 90 + r() * 40; g.fillStyle = `rgba(${v},${v},${v + 6},0.35)`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 2 + r() * 4); }
  for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(40,40,48,${0.05 + 0.05 * r()})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 40 + r() * 120, 20 + r() * 60, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const laneTex = () => ctex("laneHD", 256, 64, (g) => {
  g.clearRect(0, 0, 256, 64); g.fillStyle = "#f2e6c2"; g.fillRect(0, 22, 150, 20);
});
const skyPanel = (night: boolean) => ctex("skyPanel" + night, 256, 384, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 384);
  if (night) { gr.addColorStop(0, "#141a40"); gr.addColorStop(1, "#4a4a8a"); } else { gr.addColorStop(0, "#5a96e0"); gr.addColorStop(1, "#cfe2f6"); }
  g.fillStyle = gr; g.fillRect(0, 0, 256, 384);
  if (night) {
    g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(170, 110, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#141a40"; g.beginPath(); g.arc(186, 98, 30, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 30; i++) { g.fillStyle = "#e8ecff"; g.fillRect((i * 97) % 256, (i * 61) % 300, 3, 3); }
  } else { g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(90, 150, 60, 22, 0, 0, Math.PI * 2); g.ellipse(130, 140, 50, 26, 0, 0, Math.PI * 2); g.fill(); }
  // roofs of the houses across the street
  g.fillStyle = night ? "#232448" : "#9a7a6a";
  g.beginPath(); g.moveTo(0, 384); g.lineTo(0, 300); g.lineTo(60, 250); g.lineTo(120, 300); g.lineTo(150, 270); g.lineTo(256, 280); g.lineTo(256, 384); g.fill();
});
const wallpaper = (col: string, stripe: string) => ctex("paper" + col, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = stripe; g.fillRect(x + 22, 0, 20, 512); }
  for (let y = 16; y < 512; y += 64) for (let x = 0; x < 512; x += 64) { g.fillStyle = stripe; g.beginPath(); g.arc(x + 8, y, 5, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${0.03 * r()})`; g.fillRect(r() * 512, r() * 512, 80, 80); }
});
const tiles = () => ctex("tilesHD", 512, 512, (g) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#e9e2d0" : "#7a8aa0"; g.fillRect(x * 64, y * 64, 64, 64); }
  g.strokeStyle = "rgba(40,40,50,0.25)"; g.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
});
const box = (b: Batch, mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0) =>
  b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
const cyl = (b: Batch, mat: THREE.Material, x: number, y0: number, z: number, r0: number, r1: number, h: number, n = 16) =>
  b.add(new THREE.CylinderGeometry(r1, r0, h, n).translate(0, h / 2, 0), mat, new THREE.Matrix4().makeTranslation(x, y0, z));

/** cartoon car: body, cabin, dark windows, wheels, lights; along x (yaw 0) */
const car = (b: Batch, x: number, z: number, yaw: number, col: string, police = false) => {
  if (inTheWay(x - 2.6, x + 2.6, 0, 1.7, z - 1.3, z + 1.3)) return;
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  const body = lam("car" + col, () => ({ color: col })), glass = lam("carGlass", () => ({ color: "#2a3448" }));
  const tyre = lam("tyre", () => ({ color: "#1e1e24" })), hub = lam("hub", () => ({ color: "#b8bcc6" }));
  const add = (g: THREE.BufferGeometry, mat: THREE.Material) => b.add(g, mat, m);
  add(new RoundedBox(4.3, 0.75, 1.8, 0.22).translate(0, 0.72, 0), body);
  add(new RoundedBox(2.3, 0.62, 1.62, 0.22).translate(-0.25, 1.36, 0), police ? lam("carW", () => ({ color: "#f2f2f4" })) : body);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(2.0, 0.42, 0.02).translate(-0.25, 1.38, s * 0.815), glass);
  add(new THREE.BoxGeometry(0.02, 0.42, 1.4).translate(0.92, 1.38, 0), glass);
  add(new THREE.BoxGeometry(0.02, 0.42, 1.4).translate(-1.42, 1.38, 0), glass);
  for (const sx of [-1.35, 1.35]) for (const sz of [-0.86, 0.86]) {
    add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 18).rotateX(Math.PI / 2).translate(sx, 0.36, sz), tyre);
    add(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 12).rotateX(Math.PI / 2).translate(sx, 0.36, sz), hub);
  }
  for (const sz of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.04, 0.16, 0.34).translate(2.15, 0.82, sz), lam("headl", () => ({ color: "#fff6d8" })));
  for (const sz of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.04, 0.14, 0.3).translate(-2.15, 0.82, sz), lam("taill", () => ({ color: "#d8332e" })));
  if (police) { add(new THREE.BoxGeometry(0.3, 0.14, 0.9).translate(-0.25, 1.74, -0.2), lam("pblue", () => ({ color: "#2f6ae0" }))); add(new THREE.BoxGeometry(0.3, 0.14, 0.4).translate(-0.25, 1.74, 0.45), lam("pred", () => ({ color: "#e03a3a" }))); }
};
class RoundedBox extends THREE.BufferGeometry {
  constructor(w: number, h: number, d: number, r: number) {
    super();
    const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
    s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, h / 2, x, h / 2);
    s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * 0.06, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 4 });
    g.translate(0, 0, -(d - 0.12) / 2);
    this.copy(g as unknown as THREE.BufferGeometry);
  }
}

/** street lamp: iron post, lantern; the glass glows at night (separate night batch) */
const lamp = (b: Batch, nb: Batch, x: number, z: number) => {
  if (inTheWay(x - 0.3, x + 0.3, 0, 4.4, z - 0.3, z + 0.3, true)) return;
  const iron = lam("lampIron", () => ({ color: "#2f3a36" }));
  cyl(b, iron, x, 0.12, z, 0.12, 0.07, 3.6, 10);
  cyl(b, iron, x, 0.12, z, 0.2, 0.18, 0.4, 10);
  b.add(new THREE.CylinderGeometry(0.18, 0.13, 0.5, 6).translate(x, 3.97, z), lam("lampGlass", () => ({ color: "#f4e8c0" })));
  b.add(new THREE.ConeGeometry(0.28, 0.3, 6).translate(x, 4.37, z), iron);
  nb.add(new THREE.CylinderGeometry(0.19, 0.14, 0.5, 6).translate(x, 3.97, z), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 1.1) }));
};

export type CityParts = { night: THREE.Group; door: THREE.Group; doorPanel: THREE.Object3D; keyhole: THREE.Object3D; mailbox: THREE.Object3D; blueLamp: THREE.Mesh };
export const buildCity = (root: THREE.Object3D, rays: Ray[] = []): CityParts => {
  const b = new Batch(), nb = new Batch(), r = rng(23);
  sight = rays;
  GLOW.b = nb;
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const road = lam("asphalt", () => ({ map: asphalt() }));
  const pave = lam("paveHD", () => ({ map: stoneHD("copeHD", ["#d9cdb8", "#cfc2ac", "#e0d5c2", "#c8baa3"], "#a89a86") }));
  const curb = lam("curb", () => ({ color: "#c8c2b6" }));
  const grassM = lam("grassHD", () => ({ map: grassHD() }));
  const flat = (x0: number, x1: number, z0: number, z1: number, y: number, m: THREE.Material, tile: number) =>
    b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), m);
  flat(-400, 400, 2, 12, 0, road, 9);
  flat(-400, 400, -60, 2, 0.12, pave, 4);
  flat(-400, 400, 12, 80, 0.12, pave, 4);
  b.add(boxGeo(V(-400, 0, 1.85), V(400, 0.13, 2.0)), curb);
  b.add(boxGeo(V(-400, 0, 12.0), V(400, 0.13, 12.15)), curb);
  const laneM = new THREE.MeshLambertMaterial({ map: rep(laneTex(), 1, 1), transparent: true, depthWrite: false });
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(800, 0.26).rotateX(-Math.PI / 2), twoTone(laneM));
  (laneM.map as THREE.Texture).repeat.set(800 / 4, 1); lane.position.set(0, 0.01, 7); lane.receiveShadow = true; root.add(lane);
  flat(-900, 900, -400, -60, 0.1, grassM, 12);
  flat(-900, 900, 80, 500, 0.1, grassM, 12);
  // south row (fronts at z = -0.5, facing +z) and north row (fronts at z = 14.5, facing -z)
  for (const side of [-1, 1]) {
    let x = -150;
    while (x < 170) {
      const w = pick([7, 8, 9]), h = pick([7, 8.4, 9.8]), cx = x + w / 2;
      if (side > 0 && Math.abs(cx - STATION[0]) < 10) { x += 1; continue; }
      const special = side < 0 && Math.abs(cx - DOOR[0]) < 6;
      if (special) { x = DOOR[0] - 1.125 - 4.5; }
      const W2 = special ? 9 : w, C2 = special ? DOOR[0] - 1.125 : cx, H2 = special ? 8.4 : h;
      const zc = side < 0 ? -5.5 : 19.5, yaw = side < 0 ? 0 : Math.PI;
      const ok = house(b, C2, zc, yaw, W2, 10, H2, special ? 0 : Math.floor(r() * 8), D0, special);
      if (ok && side < 0) { const n = Math.max(1, Math.floor(W2 / 2.2)); DOORS.push(C2 - W2 / 2 + ((Math.floor(n / 2) + 0.5) * W2) / n); }
      x += W2 + (r() < 0.3 ? 2.5 + r() * 2 : 0.3);
      if (r() < 0.22) { const tx = x - 1.2, tz = side < 0 ? -1.2 : 15.2; prop(b, {}, pick(["tree_oak", "tree_fat", "tree_default"]), tx, 0.12, tz, 6 + 2 * r()); }
    }
  }
  // police station: wide brick front, steps, blue lamp
  house(b, STATION[0], 19.5, Math.PI, 14, 10, 9.8, 7, D0, true);
  box(b, lam("stepsStone", () => ({ color: "#d9d2c4" })), STATION[0] - 1.6, 0.12, 14.2, STATION[0] + 1.6, 0.32, 14.9);
  const blueLamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.0, 3.2) }));
  blueLamp.position.set(STATION[0], 3.05, 14.25); root.add(blueLamp);
  box(b, lam("lampIron", () => ({ color: "#2f3a36" })), STATION[0] - 0.04, 2.9, 14.0, STATION[0] + 0.04, 3.0, 14.5);
  car(b, STATION[0] + 6.5, 10.6, 0, "#20232c", true);
  // parked cars along both kerbs, street lamps, trees
  const cols = ["#d8433a", "#3f6fb5", "#e8c45a", "#5aa86a", "#e8e4dc", "#7b5ac9", "#2f5f6a"];
  for (let x = -120; x < 140; x += 11 + Math.floor(r() * 9)) {
    if (r() < 0.55 && Math.abs(x - MAILBOX[0]) > 4 && Math.abs(x - DOOR[0]) > 5) car(b, x, 3.3, Math.PI, pick(cols));
    if (r() < 0.5 && Math.abs(x - STATION[0]) > 9) car(b, x + 4, 10.7, 0, pick(cols));
  }
  for (let x = -126; x < 150; x += 16) { lamp(b, nb, x, 1.55); lamp(b, nb, x + 8, 12.45); }
  // red pillar post box (slot faces the street, +z)
  const mailbox = new THREE.Group();
  const red = twoTone(new THREE.MeshPhongMaterial({ color: "#c9302c", specular: "#ffb0a0", shininess: 30 }));
  const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 1.22, 24).translate(0, 0.61, 0), red);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1).translate(0, 1.22, 0), red);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 24).translate(0, 1.2, 0), red);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 24).translate(0, 0.04, 0), lam("pbBase", () => ({ color: "#2a2a30" })));
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.04).translate(0, 1.02, 0.275), lam("slot", () => ({ color: "#1a1214" })));
  for (const o of [pb, cap, rim, base, slot]) { o.castShadow = true; o.receiveShadow = true; mailbox.add(o); }
  mailbox.position.set(...MAILBOX); root.add(mailbox);
  // the owner's 3D door (over the painted one), keyhole plate, window pane with glazing bars
  const door = new THREE.Group(), dw = 1.1, dh = 2.1;
  const frameM = lam("doorFrame", () => ({ color: "#efe6d4" }));
  const fr = new Batch();
  fr.add(boxGeo(V(-dw / 2 - 0.12, 0.2, -0.02), V(-dw / 2, dh + 0.32, 0.1)), frameM);
  fr.add(boxGeo(V(dw / 2, 0.2, -0.02), V(dw / 2 + 0.12, dh + 0.32, 0.1)), frameM);
  fr.add(boxGeo(V(-dw / 2 - 0.12, dh + 0.2, -0.02), V(dw / 2 + 0.12, dh + 0.32, 0.1)), frameM);
  fr.add(boxGeo(V(-dw / 2 - 0.2, 0, -0.02), V(dw / 2 + 0.2, 0.2, 0.55)), lam("stepsStone", () => ({ color: "#d9d2c4" })));
  fr.build(door);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), new THREE.MeshBasicMaterial({ color: "#120e16" }));
  dark.position.set(0, 0.2 + dh / 2, 0.005); door.add(dark);
  const panelM = lam("doorPanel", () => ({ color: "#2f6a4a" })), brass = twoTone(new THREE.MeshPhongMaterial({ color: "#d9b04a", specular: "#fff0b0", shininess: 60 }));
  const pivot = new THREE.Group(); pivot.position.set(-dw / 2, 0.2, 0.03);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.06).translate(dw / 2, dh / 2, 0), panelM);
  for (const [y0, y1] of [[0.25, 0.95], [1.15, 1.95]]) for (const [x0, x1] of [[0.12, 0.5], [0.6, 0.98]]) {
    const inset = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.02).translate((x0 + x1) / 2, (y0 + y1) / 2, 0.035), lam("doorInset", () => ({ color: "#286044" })));
    pivot.add(inset);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10).translate(dw - 0.14, 0.95, 0.08), brass);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.02).translate(dw - 0.17, 0.82, 0.04), brass);
  const keyhole = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12).translate(dw - 0.17, 0.82, 0.052), new THREE.MeshBasicMaterial({ color: "#100c0c" }));
  const slotK = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.03).translate(dw - 0.17, 0.8, 0.052), new THREE.MeshBasicMaterial({ color: "#100c0c" }));
  for (const o of [panel, knob, plate]) { o.castShadow = true; o.receiveShadow = true; pivot.add(o); }
  pivot.add(keyhole, slotK);
  door.add(pivot);
  door.position.set(DOOR[0], DOOR[1] - 0.12, DOOR[2] + 0.04); root.add(door);
  const winG = new THREE.Group();
  const glassM = twoTone(new THREE.MeshPhongMaterial({ color: "#7e8fd0", specular: "#ffffff", shininess: 90 }));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.25), glassM); pane.position.z = 0.02; winG.add(pane);
  const bars = new Batch(), barM = lam("winBar", () => ({ color: "#f7f2e8" }));
  bars.add(boxGeo(V(-0.02, -0.62, 0), V(0.02, 0.62, 0.06)), barM); bars.add(boxGeo(V(-0.42, -0.02, 0), V(0.42, 0.02, 0.06)), barM);
  bars.add(boxGeo(V(-0.5, -0.7, 0), V(0.5, -0.62, 0.1)), barM); bars.add(boxGeo(V(-0.5, 0.62, 0), V(0.5, 0.7, 0.08)), barM);
  bars.add(boxGeo(V(-0.5, -0.7, 0), V(-0.42, 0.7, 0.08)), barM); bars.add(boxGeo(V(0.42, -0.7, 0), V(0.5, 0.7, 0.08)), barM);
  bars.build(winG); winG.position.set(WIN[0], WIN[1], WIN[2] + 0.01); root.add(winG);
  b.build(root);
  const night = new THREE.Group();
  nb.build(night, false);
  night.traverse((o) => { o.layers.set(3); (o as THREE.Mesh).castShadow = false; });
  root.add(night);
  GLOW.b = null;
  sight = [];
  return { night, door, doorPanel: pivot, keyhole, mailbox, blueLamp };
};

/** open-fronted rooms (back wall + two side walls, no ceiling) at DEN / KITCHEN / DINING, with furniture */
export const buildRooms = (root: THREE.Object3D) => {
  const out: Record<string, THREE.Group> = {};
  const planksM = lam("floorPlanks", () => ({ map: rep(planksHD(), 1, 1) }));
  const rooms: [string, [number, number, number], string, string, boolean][] = [
    ["den", DEN, "#5e7a6a", "#557060", false], ["kitchen", KITCHEN, "#e2c98e", "#d8bc80", true], ["dining", DINING, "#b85a4a", "#a8503f", false],
  ];
  const wood = lam("furnWood", () => ({ map: rep(beam(), 3, 2), color: "#c4946a" })), dk = lam("furnDark", () => ({ color: "#5a3a26" }));
  const trim = lam("roomTrim", () => ({ color: "#f2e8d6" }));
  for (const [name, o, col, stripe, kitchen] of rooms) {
    const g = new THREE.Group(), b = new Batch(), [ox, , oz] = o, hw = ROOM_W / 2, hd = ROOM_D / 2;
    const wallM = lam("wall" + name, () => ({ map: wallpaper(col, stripe) }));
    b.add(quad(V(ox - hw, 0, oz + hd + 4), V(ox + hw, 0, oz + hd + 4), V(ox + hw, 0, oz - hd), V(ox - hw, 0, oz - hd), ROOM_W / 2, (ROOM_D + 4) / 2), kitchen ? lam("tiles", () => ({ map: tiles() })) : planksM);
    b.add(quad(V(ox - hw, 0, oz - hd), V(ox + hw, 0, oz - hd), V(ox + hw, ROOM_H, oz - hd), V(ox - hw, ROOM_H, oz - hd), ROOM_W / 1.6, ROOM_H / 1.6), wallM);
    b.add(quad(V(ox - hw, 0, oz + hd + 4), V(ox - hw, 0, oz - hd), V(ox - hw, ROOM_H, oz - hd), V(ox - hw, ROOM_H, oz + hd + 4), (ROOM_D + 4) / 1.6, ROOM_H / 1.6), wallM);
    b.add(quad(V(ox + hw, 0, oz - hd), V(ox + hw, 0, oz + hd + 4), V(ox + hw, ROOM_H, oz + hd + 4), V(ox + hw, ROOM_H, oz - hd), (ROOM_D + 4) / 1.6, ROOM_H / 1.6), wallM);
        // wainscot, skirting, picture rail
    box(b, trim, ox - hw, 0, oz - hd, ox + hw, 0.14, oz - hd + 0.03);
    box(b, trim, ox - hw, 0.95, oz - hd, ox + hw, 1.0, oz - hd + 0.04);
    box(b, trim, ox - hw, 2.6, oz - hd, ox + hw, 2.65, oz - hd + 0.04);
    for (const s of [-1, 1]) { box(b, trim, ox + s * hw - (s > 0 ? 0.03 : 0), 0, oz - hd, ox + s * hw + (s < 0 ? 0.03 : 0), 0.14, oz + hd + 4); }
    // window in the back wall (night / day panel), offset to the side
    const wx = name === "den" ? ox + 1.6 : ox + 1.4;
    box(b, trim, wx - 0.75, 1.15, oz - hd, wx + 0.75, 2.55, oz - hd + 0.06);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.2), new THREE.MeshBasicMaterial({ map: skyPanel(name !== "dining") }));
    sky.position.set(wx, 1.85, oz - hd + 0.065); sky.layers.set(3); g.add(sky);
    box(b, trim, wx - 0.03, 1.2, oz - hd, wx + 0.03, 2.5, oz - hd + 0.1); box(b, trim, wx - 0.68, 1.82, oz - hd, wx + 0.68, 1.88, oz - hd + 0.1);
    box(b, trim, wx - 0.85, 1.12, oz - hd, wx + 0.85, 1.2, oz - hd + 0.18);
    if (name === "den") {
      const [dx, dy, dz] = DESK;
      box(b, wood, dx - 0.9, dy - 0.05, dz - 0.42, dx + 0.9, dy, dz + 0.42);
      box(b, dk, dx - 0.85, 0, dz - 0.38, dx - 0.35, dy - 0.05, dz + 0.36); box(b, dk, dx + 0.35, 0, dz - 0.38, dx + 0.85, dy - 0.05, dz + 0.36);
      for (const yy of [0.25, 0.5]) box(b, lam("drawer", () => ({ color: "#7a5236" })), dx + 0.4, yy, dz + 0.36, dx + 0.8, yy + 0.2, dz + 0.38);
      // desk lamp
      cyl(b, lam("lampBrass", () => ({ color: "#c9a04a" })), dx - 0.68, dy, dz - 0.2, 0.09, 0.09, 0.03);
      b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.42).translate(dx - 0.68, dy + 0.24, dz - 0.2), lam("lampBrass", () => ({ color: "#c9a04a" })));
      b.add(new THREE.ConeGeometry(0.16, 0.16, 16, 1, true).translate(dx - 0.68, dy + 0.48, dz - 0.2), lam("lampShade", () => ({ color: "#2f6a4a", side: THREE.DoubleSide })));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.2, 1.8) }));
      bulb.position.set(dx - 0.68, dy + 0.42, dz - 0.2); bulb.layers.set(3); g.add(bulb);
      // bookshelf on the left wall
      box(b, dk, ox - hw + 0.02, 0, oz - 1.6, ox - hw + 0.42, 2.2, oz + 0.4);
      for (let i = 0; i < 4; i++) for (let k = 0; k < 9; k++) {
        const c = ["#8c3b4a", "#3f6fb5", "#d9a441", "#5d7a3a", "#e8e4dc"][(i * 3 + k) % 5];
        box(b, lam("book" + c, () => ({ color: c })), ox - hw + 0.44, 0.15 + i * 0.52, oz - 1.5 + k * 0.2, ox - hw + 0.46 + 0.02, 0.15 + i * 0.52 + 0.3 + 0.08 * ((k * 7) % 3), oz - 1.5 + k * 0.2 + 0.14);
      }
      // rug
      b.add(quad(V(ox - 1.6, 0.005, oz + 1.2), V(ox + 1.6, 0.005, oz + 1.2), V(ox + 1.6, 0.005, oz - 0.6), V(ox - 1.6, 0.005, oz - 0.6)), lam("rug", () => ({ color: "#8c3b4a" })));
    } else if (name === "kitchen") {
      const [tx, ty, tz] = KTABLE;
      box(b, wood, tx - 0.65, ty - 0.05, tz - 0.42, tx + 0.65, ty, tz + 0.42);
      for (const sx of [-0.58, 0.58]) for (const sz of [-0.36, 0.36]) box(b, dk, tx + sx - 0.035, 0, tz + sz - 0.035, tx + sx + 0.035, ty - 0.05, tz + sz + 0.035);
      for (const sx of [-1, 1]) { box(b, dk, tx + sx * 0.95 - 0.22, 0.45, tz - 0.2, tx + sx * 0.95 + 0.22, 0.5, tz + 0.24); box(b, dk, tx + sx * 0.95 + (sx > 0 ? 0.17 : -0.22), 0.5, tz - 0.2, tx + sx * 0.95 + (sx > 0 ? 0.22 : -0.17), 1.0, tz + 0.24);
        for (const sz of [-0.17, 0.2]) box(b, dk, tx + sx * 0.95 - 0.2, 0, tz + sz, tx + sx * 0.95 - 0.16, 0.45, tz + sz + 0.04); }
      // counter + cabinets along the back wall, fridge on the left
      const cab = lam("cabinet", () => ({ color: "#f0ead8" })), top2 = lam("counterTop", () => ({ color: "#8a8a92" }));
      box(b, cab, ox - 2.6, 0, oz - hd, ox + 0.4, 0.88, oz - hd + 0.62); box(b, top2, ox - 2.65, 0.88, oz - hd, ox + 0.45, 0.93, oz - hd + 0.66);
      box(b, cab, ox - 2.6, 1.55, oz - hd, ox + 0.4, 2.3, oz - hd + 0.36);
      for (let k = 0; k < 5; k++) { const x0 = ox - 2.55 + k * 0.6; box(b, lam("cabLine", () => ({ color: "#cfc6b0" })), x0 + 0.27, 0.05, oz - hd + 0.62, x0 + 0.3, 0.84, oz - hd + 0.64); }
      box(b, lam("fridge", () => ({ color: "#e8eef2" })), ox - hw + 0.05, 0, oz - 0.9, ox - hw + 0.8, 1.9, oz - 0.15);
      box(b, lam("fridgeH", () => ({ color: "#9aa0a8" })), ox - hw + 0.8, 0.9, oz - 0.3, ox - hw + 0.84, 1.4, oz - 0.26);
    } else {
      const [tx, ty, tz] = DTABLE;
      box(b, lam("tablecloth", () => ({ color: "#f4efe4" })), tx - 1.6, ty - 0.06, tz - 0.55, tx + 1.6, ty, tz + 0.55);
      for (const sx of [-1.5, 1.5]) for (const sz of [-0.45, 0.45]) box(b, dk, tx + sx - 0.04, 0, tz + sz - 0.04, tx + sx + 0.04, ty - 0.06, tz + sz + 0.04);
      for (let k = -2; k <= 2; k++) {
        b.add(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20).translate(tx + k * 0.62, ty + 0.008, tz + 0.18), lam("plate", () => ({ color: "#ffffff" })));
        b.add(new THREE.CylinderGeometry(0.03, 0.025, 0.14, 10).translate(tx + k * 0.62 + 0.2, ty + 0.07, tz - 0.05), lam("glassW", () => ({ color: "#cfe2ee" })));
      }
      for (const k of [-0.7, 0.7]) {
        cyl(b, lam("lampBrass", () => ({ color: "#c9a04a" })), tx + k, ty, tz - 0.15, 0.05, 0.03, 0.05);
        b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.24).translate(tx + k, ty + 0.17, tz - 0.15), lam("candle", () => ({ color: "#f6f0e0" })));
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6).scale(1, 1.6, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1) }));
        fl.position.set(tx + k, ty + 0.32, tz - 0.15); fl.layers.set(3); g.add(fl);
      }
      for (const px of [-2.2, 0, 2.2]) { box(b, lam("frameGold", () => ({ color: "#c9a04a" })), ox + px - 0.4, 1.5, oz - hd, ox + px + 0.4, 2.2, oz - hd + 0.04);
        box(b, lam("painting" + px, () => ({ color: ["#3f6fb5", "#5d7a3a", "#d9a441"][(px + 2.2) / 2.2] })), ox + px - 0.33, 1.57, oz - hd + 0.02, ox + px + 0.33, 2.13, oz - hd + 0.05); }
    }
    b.build(g);
    root.add(g);
    out[name] = g;
  }
  return out;
};
