// Props: the katana (procedural curved blade whose edge can crumple, hot glow for the forge), whetstones, tomato
// (whole / halves), soaked straw mat on its stand (whole / cut on a slanted plane), a hair, a sheet of paper that
// bends, obsidian core + flake, macuahuitl with obsidian teeth, hammer, steam / spark / glint sprites.
import * as THREE from "three";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { ctex, rng } from "./paint";
import { V3 } from "./story";

const cache = new Map<string, THREE.Material>();
export const tmat = (key: string, make: () => THREE.MeshLambertMaterial | THREE.MeshPhongMaterial, soft = 0.25) => {
  let m = cache.get(key);
  if (!m) { m = twoTone(make(), 1, soft); cache.set(key, m); }
  return m;
};
export const lamC = (col: string, soft = 0.25) => tmat("c" + col + soft, () => new THREE.MeshLambertMaterial({ color: col }), soft);
export const phongC = (col: string, shin = 40, spec = "#ffffff", soft = 0.25) => tmat("p" + col + shin + spec + soft, () => new THREE.MeshPhongMaterial({ color: col, shininess: shin, specular: spec }), soft);
export const mk = (g: THREE.BufferGeometry, m: THREE.Material, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o; };

// ---------------- katana ----------------
const BL = 0.74, NS = 60;
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
export class Katana {
  group = new THREE.Group(); // origin at the tsuba, blade along +y, edge toward +x
  blade: THREE.Mesh; private pos: Float32Array; private base: Float32Array;
  private hotMat: THREE.MeshBasicMaterial; private coldMat: THREE.Material;
  handle: THREE.Group;
  crumple = 0;
  constructor(withHandle = true) {
    // cross-section: spine (2 verts), shinogi ridge (2), edge (1)
    const ring = 5;
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    for (let i = 0; i <= NS; i++) {
      const s = i / NS, y = s * BL;
      const tip = Math.max(0, (s - 0.9) / 0.1);
      const W = (0.044 - 0.01 * s) * (1 - 0.15 * tip);
      const T = 0.009 - 0.0035 * s;
      const sori = -0.022 * s * s;                    // curve back toward the spine
      const kis = tip > 0 ? Math.sqrt(Math.max(0, 1 - tip * tip)) : 1; // kissaki: edge sweeps up to the spine
      const ew = W * (tip > 0 ? 0.25 + 0.75 * kis : 1), sw = tip > 0 ? W * 0.25 * (1 - tip) : 0;
      const pts = [[sori + sw * 0, T / 2], [sori + 0.3 * ew, T / 2 * kis + 0.0004], [sori + ew, 0], [sori + 0.3 * ew, -T / 2 * kis - 0.0004], [sori, -T / 2]];
      if (i === NS) pts.forEach((p) => { p[0] = sori + 0.12 * W; p[1] = 0; });
      for (let k = 0; k < ring; k++) {
        pos.push(pts[k][0], y, pts[k][1]);
        const edge = k === 2 ? 1 : k === 1 || k === 3 ? 0.35 : 0;
        col.push(0.78 + 0.22 * edge, 0.82 + 0.18 * edge, 0.88 + 0.12 * edge);
      }
    }
    for (let i = 0; i < NS; i++) for (let k = 0; k < ring; k++) {
      const a = i * ring + k, b = i * ring + ((k + 1) % ring), c = (i + 1) * ring + ((k + 1) % ring), d = (i + 1) * ring + k;
      idx.push(a, b, c, a, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    this.pos = g.attributes.position.array as Float32Array; this.base = this.pos.slice();
    this.coldMat = tmat("steel", () => new THREE.MeshPhongMaterial({ color: "#d8dfe8", vertexColors: true, shininess: 90, specular: "#ffffff", side: THREE.DoubleSide }), 0.35);
    this.hotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.2, 0.3), side: THREE.DoubleSide });
    this.blade = mk(g, this.coldMat);
    this.group.add(this.blade);
    // habaki, tsuba, handle
    const habaki = mk(new THREE.BoxGeometry(0.04, 0.035, 0.014), phongC("#d4a640", 60)); habaki.position.set(0.016, 0.017, 0);
    this.group.add(habaki);
    this.handle = new THREE.Group(); this.group.add(this.handle);
    const tsuba = mk(new THREE.CylinderGeometry(0.046, 0.046, 0.009, 28), lamC("#3a3029")); tsuba.scale.set(1, 1, 0.8); tsuba.position.set(0.014, -0.004, 0);
    const rim = mk(new THREE.TorusGeometry(0.046, 0.004, 6, 28), phongC("#c9a04a", 50)); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 0.8, 1); rim.position.copy(tsuba.position);
    const tsuka = mk(new THREE.CylinderGeometry(0.0165, 0.018, 0.27, 16), tmat("tsuka", () => new THREE.MeshLambertMaterial({ map: tsukaTex() }), 0.3));
    tsuka.scale.set(1, 1, 0.78); tsuka.position.set(0.014, -0.142, 0);
    const kashira = mk(new THREE.SphereGeometry(0.019, 12, 8), phongC("#2e2620", 30)); kashira.scale.set(1, 0.6, 0.8); kashira.position.set(0.014, -0.28, 0);
    this.handle.add(tsuba, rim, tsuka, kashira);
    this.handle.visible = withHandle;
  }
  setHot(k: number) { this.blade.material = k > 0.02 ? this.hotMat : this.coldMat; this.hotMat.color.setRGB(0.6 + 2.8 * k, 0.25 + 1.0 * k, 0.1 + 0.25 * k); }
  /** foil-like crumple along the middle of the edge (0 = straight) */
  setCrumple(k: number) {
    if (k === this.crumple) return;
    this.crumple = k;
    const p = this.pos, b = this.base, r = rng(11);
    const waves = Array.from({ length: 9 }, () => [r() * 6.28, 0.6 + r() * 0.8]);
    for (let i = 0; i <= NS; i++) {
      const s = i / NS, w = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (s - 0.22) / 0.6))));
      let wob = 0; waves.forEach(([ph, a], j) => { wob += a * Math.sin(s * (40 + j * 9) + ph) / waves.length; });
      for (let kk = 0; kk < 5; kk++) {
        const o = (i * 5 + kk) * 3, e = kk === 2 ? 1 : kk === 1 || kk === 3 ? 0.35 : 0;
        p[o] = b[o] - k * w * e * (0.009 + 0.006 * Math.abs(wob));
        p[o + 2] = b[o + 2] + k * w * e * 0.014 * wob * 2.2;
      }
    }
    this.blade.geometry.attributes.position.needsUpdate = true;
    this.blade.geometry.computeVertexNormals();
  }
  /** place: grip point (the hand), blade direction, edge direction (both world) */
  hold(hand: THREE.Vector3, dir: V3, edge: V3, grip = 0.075) {
    _y.set(...dir).normalize(); _x.set(...edge); _x.addScaledVector(_y, -_x.dot(_y)).normalize(); _z.crossVectors(_x, _y);
    _m.makeBasis(_x, _y, _z);
    this.group.quaternion.setFromRotationMatrix(_m);
    this.group.position.copy(hand).addScaledVector(_y, grip).addScaledVector(_x, -0.014);
  }
  tipWorld(out = new THREE.Vector3()) { return this.group.localToWorld(out.set(-0.02, BL, 0)); }
  pointWorld(s: number, out = new THREE.Vector3()) { return this.group.localToWorld(out.set(0.03 - 0.022 * s * s, s * BL, 0)); }
}
const tsukaTex = () => ctex("tsuka", 128, 512, (g) => {
  g.fillStyle = "#efe7d2"; g.fillRect(0, 0, 128, 512);
  g.fillStyle = "#1d1a22";
  for (let y = -64; y < 576; y += 64) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 26); g.lineTo(128, y); g.lineTo(128, y + 30); g.lineTo(64, y + 56); g.lineTo(0, y + 30); g.fill();
    g.beginPath(); g.moveTo(0, y + 34); g.lineTo(64, y + 62); g.lineTo(128, y + 34); g.lineTo(128, y + 64); g.lineTo(0, y + 64); g.fill();
  }
});

export const orient = (o: THREE.Object3D, pos: THREE.Vector3 | V3, dirY: V3, dirX: V3) => {
  _y.set(...dirY).normalize(); _x.set(...dirX); _x.addScaledVector(_y, -_x.dot(_y)).normalize(); _z.crossVectors(_x, _y);
  _m.makeBasis(_x, _y, _z); o.quaternion.setFromRotationMatrix(_m);
  if (pos instanceof THREE.Vector3) o.position.copy(pos); else o.position.set(...pos);
};

// ---------------- sprites (no ink): steam, sparks, glints ----------------
const softTex = () => ctex("soft", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.85)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const puffTex = () => ctex("puff", 256, 256, (g) => {
  // cartoon cloud puff: three overlapping discs, soft rim
  g.fillStyle = "#ffffff";
  for (const [x, y, r] of [[128, 140, 80], [86, 118, 56], [172, 112, 60], [128, 92, 58]] as const) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(170,185,215,0.55)"; g.beginPath(); g.ellipse(140, 200, 120, 50, 0, 0, Math.PI * 2); g.fill();
});
const starTex = () => ctex("star4", 256, 256, (g) => {
  g.translate(128, 128);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.15, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  for (let k = 0; k < 2; k++) { g.save(); g.rotate((k * Math.PI) / 2); g.beginPath(); g.moveTo(0, -128); g.quadraticCurveTo(8, 0, 0, 128); g.quadraticCurveTo(-8, 0, 0, -128); g.fill(); g.restore(); }
  g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
});
export class SpritePool {
  private list: THREE.Sprite[] = []; private n = 0;
  constructor(private parent: THREE.Object3D) {}
  begin() { this.n = 0; }
  add(kind: "soft" | "puff" | "star", p: V3 | THREE.Vector3, size: number, col: [number, number, number], alpha = 1, rot = 0, additive = false) {
    let s = this.list[this.n];
    if (!s) {
      s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
      s.layers.set(NOINK); s.frustumCulled = false; s.renderOrder = 6; this.parent.add(s); this.list.push(s);
    }
    this.n++;
    const m = s.material as THREE.SpriteMaterial;
    m.map = kind === "soft" ? softTex() : kind === "puff" ? puffTex() : starTex();
    m.color.setRGB(...col); m.opacity = alpha; m.rotation = rot;
    m.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    s.visible = true;
    if (p instanceof THREE.Vector3) s.position.copy(p); else s.position.set(...p);
    s.scale.set(size, size, 1);
  }
  end() { for (let i = this.n; i < this.list.length; i++) this.list[i].visible = false; }
}

// ---------------- tomato ----------------
const tomatoCut = () => ctex("tomatoCut", 256, 256, (g) => {
  g.fillStyle = "#e5392c"; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f2685a"; g.beginPath(); g.arc(128, 128, 110, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    g.fillStyle = "#f7c4a0"; g.beginPath(); g.ellipse(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58, 30, 22, a, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f4e27a"; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(128 + Math.cos(a) * (46 + j * 6), 128 + Math.sin(a) * (46 + j * 6) + (j % 2 ? 6 : -6), 4, 6, a, 0, Math.PI * 2); g.fill(); }
  }
  g.strokeStyle = "#e5392c"; g.lineWidth = 10; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4 + Math.PI / 4; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.stroke(); }
  g.fillStyle = "#f8d0b0"; g.beginPath(); g.arc(128, 128, 18, 0, Math.PI * 2); g.fill();
});
export class Tomato {
  group = new THREE.Group(); whole: THREE.Group; halves: THREE.Group[] = [];
  constructor(r = 0.065) {
    const red = phongC("#e23b2e", 70, "#ffd8d0", 0.3), green = lamC("#3f8a35");
    const stem = () => { const s = new THREE.Group(); for (let k = 0; k < 5; k++) { const l = mk(new THREE.ConeGeometry(0.012, 0.045, 4), green); l.rotation.set(Math.PI / 2 - 0.3, 0, 0); l.position.set(0, 0, 0.02); const p = new THREE.Group(); p.rotation.y = (k / 5) * Math.PI * 2; p.add(l); s.add(p); } const c = mk(new THREE.CylinderGeometry(0.005, 0.006, 0.025, 6), green); c.position.y = 0.012; s.add(c); s.position.y = r * 0.86; return s; };
    this.whole = new THREE.Group();
    const w = mk(new THREE.SphereGeometry(r, 28, 20), red); w.scale.set(1, 0.86, 1); this.whole.add(w, stem());
    this.group.add(this.whole);
    for (const sgn of [-1, 1]) {
      const h = new THREE.Group();
      const hemi = mk(new THREE.SphereGeometry(r, 24, 18, sgn < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), red); hemi.scale.set(1, 0.86, 1);
      const face = mk(new THREE.CircleGeometry(r * 0.995, 28), tmat("tomatoFace", () => new THREE.MeshLambertMaterial({ map: tomatoCut() }), 0.4));
      face.rotation.y = sgn < 0 ? Math.PI / 2 : -Math.PI / 2; face.scale.set(1, 0.86, 1);
      // SphereGeometry phi 0..pi spans -x..(+z)..+x? keep the cut face on the x = 0 plane facing the gap
      h.add(hemi, face);
      if (sgn > 0) h.add(stem());
      this.halves.push(h); this.group.add(h);
    }
  }
  /** 0 = whole, >0 = cut: halves fall apart (u 0..1) */
  set(cut: boolean, u: number) {
    this.whole.visible = !cut;
    this.halves.forEach((h, i) => {
      h.visible = cut;
      const s = i ? 1 : -1, k = Math.min(1, u);
      h.position.set(s * 0.03 * k, -0.01 * k, 0); h.rotation.set(0, 0, -s * 1.2 * k * k);
    });
  }
}

// ---------------- straw mat on its stand ----------------
const strawTex = (cut: boolean) => ctex(cut ? "strawCut" : "straw", 256, 256, (g, r) => {
  if (cut) {
    g.fillStyle = "#d9c27a"; g.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 14; k++) { g.strokeStyle = k % 2 ? "rgba(140,110,50,0.6)" : "rgba(250,235,170,0.6)"; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 8 + k * 9, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = "#4c3a22"; g.beginPath(); g.arc(128, 128, 10, 0, Math.PI * 2); g.fill();
    return;
  }
  g.fillStyle = "#c2b067"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 4) { g.fillStyle = `rgba(${r() < 0.5 ? "250,235,160" : "110,95,40"},${0.18 + r() * 0.25})`; g.fillRect(x, 0, 2, 256); }
  g.fillStyle = "rgba(95,80,40,0.55)"; for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 5); // binding cords
  g.fillStyle = "rgba(70,95,60,0.16)"; g.fillRect(0, 0, 256, 256); // soaked, a little green-grey
});
export class Mat {
  group = new THREE.Group(); private bot: THREE.Mesh; private top: THREE.Group; private topMesh: THREE.Mesh; private whole: THREE.Mesh;
  R = 0.085; H = 0.95; Y0 = 0.72; // mat bottom height (on the spike)
  cutY = 0.5; cutSlope = 0.55; // cut plane in mat space: y = cutY + slope * x
  constructor() {
    const wood = lamC("#8a5f3c"), dark = lamC("#5a3c26");
    const base = new THREE.Group();
    for (const a of [0, Math.PI / 2]) { const b = mk(new THREE.BoxGeometry(0.75, 0.08, 0.1), dark); b.rotation.y = a; b.position.y = 0.04; base.add(b); }
    const post = mk(new THREE.BoxGeometry(0.1, this.Y0, 0.1), wood); post.position.y = this.Y0 / 2; base.add(post);
    const spike = mk(new THREE.CylinderGeometry(0.008, 0.012, 0.4, 6), lamC("#6d6a66")); spike.position.y = this.Y0 + 0.2; base.add(spike);
    this.group.add(base);
    const side = tmat("strawM", () => new THREE.MeshLambertMaterial({ map: strawTex(false) }), 0.3);
    const capM = tmat("strawCutM", () => new THREE.MeshLambertMaterial({ map: strawTex(true) }), 0.35);
    const mkCyl = (keep: (y: number, py: number) => number) => {
      const g = new THREE.CylinderGeometry(this.R, this.R, this.H, 28, 40, true); g.translate(0, this.H / 2, 0);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setY(i, keep(y, this.cutY * this.H + this.cutSlope * x)); }
      g.computeVertexNormals(); return mk(g, side);
    };
    this.whole = mkCyl((y) => y); this.whole.position.y = this.Y0;
    this.bot = mkCyl((y, py) => Math.min(y, py)); this.bot.position.y = this.Y0;
    this.topMesh = mkCyl((y, py) => Math.max(y, py));
    const top = new THREE.Group(); top.add(this.topMesh); this.top = top;
    const cap = (down: boolean) => {
      const c = mk(new THREE.CircleGeometry(this.R, 28), capM); c.rotation.x = down ? Math.PI / 2 : -Math.PI / 2;
      const p = new THREE.Group(); const sx = new THREE.Group(); sx.scale.set(Math.sqrt(1 + this.cutSlope ** 2), 1, 1); sx.add(c); p.add(sx);
      p.rotation.z = Math.atan(this.cutSlope); p.position.y = this.cutY * this.H; return p;
    };
    top.add(cap(true)); this.bot.add(cap(false));
    const topTops = mk(new THREE.CircleGeometry(this.R, 28), capM); topTops.rotation.x = -Math.PI / 2; topTops.position.y = this.H; top.add(topTops);
    const wholeTop = mk(new THREE.CircleGeometry(this.R, 28), capM); wholeTop.rotation.x = -Math.PI / 2; wholeTop.position.y = this.H; this.whole.add(wholeTop);
    this.group.add(this.whole, this.bot, top);
  }
  /** state: whole, or cut with the top piece displaced: slide (m along the cut plane, downhill) and fall (s after leaving) */
  set(cut: boolean, slide: number, fall: number) {
    this.whole.visible = !cut; this.bot.visible = cut; this.top.visible = cut;
    if (!cut) return;
    const a = Math.atan(this.cutSlope);
    const dx = -slide * Math.cos(a), dy = -slide * Math.sin(a);
    const g = 4.9 * fall * fall;
    this.top.position.set(dx - 0.35 * fall, this.Y0 + dy - g, 0.05 * fall);
    this.top.rotation.set(0, 0, 2.2 * fall * fall + 0.04 * slide * 10);
  }
}

// ---------------- hair strand, paper ----------------
export class Hair {
  group = new THREE.Group(); halves: THREE.Mesh[] = [];
  constructor() {
    const m = lamC("#4a3226", 0.3);
    const curve = (a: number, b: number) => new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, i) => { const t = a + ((b - a) * i) / 6; return new THREE.Vector3(t * 0.16 - 0.08, 0.012 * Math.sin(t * 9), 0.01 * Math.cos(t * 7)); }));
    for (const [a, b] of [[0, 0.5], [0.5, 1]]) { const h = mk(new THREE.TubeGeometry(curve(a, b), 16, 0.0028, 6), m, false); this.halves.push(h); this.group.add(h); }
  }
  set(split: number) { this.halves[0].position.set(-0.01 * split, -0.03 * split * split, 0); this.halves[0].rotation.z = 0.5 * split; this.halves[1].position.set(0.01 * split, -0.035 * split * split, 0); this.halves[1].rotation.z = -0.6 * split; }
}
export class Paper {
  mesh: THREE.Mesh; private base: Float32Array;
  constructor() {
    const g = new THREE.PlaneGeometry(0.21, 0.28, 14, 14); g.rotateX(-Math.PI / 2);
    this.base = (g.attributes.position.array as Float32Array).slice();
    this.mesh = mk(g, tmat("paper", () => new THREE.MeshLambertMaterial({ color: "#fbf8ef", side: THREE.DoubleSide }), 0.5), false);
  }
  /** the sheet lies across the blade (local x along the blade); bend: both halves droop over the edge */
  set(bend: number) {
    const p = this.mesh.geometry.attributes.position, b = this.base;
    for (let i = 0; i < p.count; i++) {
      const x = b[i * 3], z = b[i * 3 + 2], d = Math.abs(z);
      p.setY(i, -bend * (d * 1.6) ** 1.6 * 0.9 - bend * 0.012 * Math.cos(x * 30));
      p.setZ(i, z * (1 - 0.25 * bend * d * 4));
    }
    p.needsUpdate = true; this.mesh.geometry.computeVertexNormals();
  }
}

// ---------------- obsidian, macuahuitl, hammer ----------------
const rock = (r: number, seed: number, sx = 1, sy = 1, sz = 1) => {
  const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position, rr = rng(seed);
  const map = new Map<string, number>();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    let s = map.get(k); if (s === undefined) { s = 0.8 + 0.35 * rr(); map.set(k, s); }
    p.setXYZ(i, p.getX(i) * s * sx, p.getY(i) * s * sy, p.getZ(i) * s * sz);
  }
  g.computeVertexNormals(); return g;
};
export const obsidianM = () => phongC("#1d1b26", 120, "#9fb4ff", 0.3);
export const obsidianCore = () => mk(rock(0.075, 3, 1.15, 0.9, 0.85), obsidianM());
export const obsidianFlake = () => { const g = rock(0.05, 9, 1.2, 0.22, 0.8); return mk(g, obsidianM()); };
export class Macuahuitl {
  group = new THREE.Group(); teeth: { m: THREE.Mesh; p: THREE.Vector3; v: THREE.Vector3; spin: THREE.Vector3 }[] = [];
  constructor() {
    const wood = lamC("#7a4a2a"), r = rng(5);
    const paddle = mk(new THREE.BoxGeometry(0.11, 0.78, 0.035), wood); paddle.position.y = 0.39 + 0.18; this.group.add(paddle);
    const grip = mk(new THREE.CylinderGeometry(0.02, 0.022, 0.22, 10), lamC("#5a341c")); grip.position.y = 0.07; this.group.add(grip);
    const knob = mk(new THREE.SphereGeometry(0.03, 10, 8), lamC("#5a341c")); knob.position.y = -0.04; this.group.add(knob);
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) {
      const g = new THREE.ConeGeometry(0.022, 0.06, 3); g.rotateZ(-sx * Math.PI / 2);
      const m = mk(g, obsidianM());
      const p = new THREE.Vector3(sx * 0.075, 0.24 + i * 0.075, 0);
      m.position.copy(p); m.scale.set(1, 1.2, 0.35);
      this.group.add(m);
      this.teeth.push({ m, p, v: new THREE.Vector3(sx * (0.8 + r() * 1.6), 0.5 + r() * 2.2, (r() - 0.5) * 2.4), spin: new THREE.Vector3(r() * 20, r() * 20, r() * 20) });
    }
  }
  /** t = seconds since the hit (<0 intact): teeth on the striking (+x) side burst into shards */
  shatter(t: number) {
    for (const th of this.teeth) {
      const hit = th.p.x > 0 && t >= 0;
      if (!hit) { th.m.position.copy(th.p); th.m.rotation.set(0, 0, 0); th.m.scale.set(1, 1.2, 0.35); continue; }
      th.m.position.set(th.p.x + th.v.x * t, th.p.y + th.v.y * t - 4.9 * t * t, th.p.z + th.v.z * t);
      th.m.rotation.set(th.spin.x * t, th.spin.y * t, th.spin.z * t);
      th.m.scale.set(0.6, 0.7, 0.3);
    }
  }
}
export const hammer = () => {
  const g = new THREE.Group();
  const h = mk(new THREE.CylinderGeometry(0.014, 0.016, 0.36, 8), lamC("#8a5f3c")); h.position.y = 0.12; g.add(h);
  const head = mk(new THREE.BoxGeometry(0.13, 0.055, 0.055), phongC("#4a4a52", 30)); head.position.y = 0.3; g.add(head);
  return g;
};
