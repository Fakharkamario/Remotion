// The whole place as one three.js scene: the pithead on the surface (headframe + sheave wheel over the shaft at the
// origin, lift cage, engine house + chimney, sheds, coal heaps, rails, hills) and, 200 m below, the gallery: a
// timbered tunnel with rough rock walls, rails, hanging lamps (emissive bulbs that bloom and dim on cue) and the coal
// face at x = -90. Cast + effect cards come from cast.ts. update(id, f, camera) poses everything (pure in id + f).
import * as THREE from "three";
import { V, lam, Kit, boxGeo, Batch, quad } from "./build";
import { ctex, cloudHD, beamHD, rng, roofHD } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { CARD_K } from "./cardshade";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, V3, ShotDef, Y0, FACE_X, TW, TH, POST1, POST10, dimAt } from "./story";

let kitP: Promise<Kit> | null = null;
export const loadKit = () => { if (!kitP) kitP = Promise.resolve({} as Kit); return kitP; };

const haloTex = () => ctex("lampHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128, a = 0.5 * Math.exp(-((u / 0.22) ** 2)) + 0.3 * Math.exp(-((u / 0.55) ** 2));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)))));
  }
  g.putImageData(im, 0, 0);
});
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// ---------------- painted textures ----------------
const blot = (g: CanvasRenderingContext2D, r: () => number, x: number, y: number, rad: number, col: string) => {
  g.beginPath();
  const n = 7 + Math.floor(r() * 4);
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, k = rad * (0.7 + 0.5 * r()); const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k * 0.8; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.closePath(); g.fillStyle = col; g.fill();
};
const rockTex = () => ctex("rockHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#6a5a4e"; g.fillRect(0, 0, 1024, 1024);
  const cols = ["#7a685a", "#5e5048", "#73665c", "#665446", "#806e5e", "#584a42"];
  for (let i = 0; i < 160; i++) blot(g, r, r() * 1024, r() * 1024, 40 + r() * 90, cols[i % cols.length]);
  // a dark coal band and cracks
  g.fillStyle = "rgba(30,26,30,0.85)";
  g.beginPath(); g.moveTo(0, 610); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, 600 + 30 * Math.sin(x * 0.01) + 10 * r()); g.lineTo(1024, 720);
  for (let x = 1024; x >= 0; x -= 64) g.lineTo(x, 700 + 25 * Math.sin(x * 0.013 + 1) + 10 * r()); g.closePath(); g.fill();
  g.strokeStyle = "rgba(35,25,28,0.7)"; g.lineCap = "round";
  for (let i = 0; i < 40; i++) {
    let x = r() * 1024, y = r() * 1024; g.lineWidth = 3 + r() * 4; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += 20 + r() * 50; g.lineTo(x, y); }
    g.stroke();
  }
});
const coalTex = () => ctex("coalHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#24222a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 220; i++) {
    const x = r() * 1024, y = r() * 1024, s = 30 + r() * 70;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s * 0.3 * r()); g.lineTo(x + s * 0.6, y + s); g.lineTo(x - s * 0.2, y + s * 0.6); g.closePath();
    g.fillStyle = ["#2e2c36", "#1a191f", "#3a3846", "#26242c"][i % 4]; g.fill();
    if (r() < 0.3) { g.strokeStyle = "rgba(170,175,200,0.45)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 4, y + 2); g.lineTo(x + s * 0.7, y + s * 0.2); g.stroke(); }
  }
});
const dirtTex = (key: string, base: string, cols: string[], dust: string) => ctex(key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 120; i++) blot(g, r, r() * 1024, r() * 1024, 30 + r() * 110, cols[i % cols.length]);
  for (let i = 0; i < 24; i++) blot(g, r, r() * 1024, r() * 1024, 60 + r() * 140, dust);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,32,30,0.5)" : "rgba(255,240,220,0.25)"; g.beginPath(); g.arc(r() * 1024, r() * 1024, 2 + r() * 5, 0, 7); g.fill(); }
});
const brickTex = () => ctex("brickHD2", 1024, 1024, (g, r) => {
  g.fillStyle = "#8a6a5a"; g.fillRect(0, 0, 1024, 1024);
  const bh = 32, bw = 96;
  for (let row = 0; row < 1024 / bh; row++) for (let c = -1; c < 1024 / bw + 1; c++) {
    const x = c * bw + (row % 2 ? bw / 2 : 0), y = row * bh;
    g.fillStyle = ["#a0503a", "#94483a", "#a85a42", "#8c4434", "#9a5640"][Math.floor(r() * 5)];
    g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
  }
});
const plankTex = () => ctex("shedPlanks", 512, 512, (g, r) => {
  g.fillStyle = "#6a4a34"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = ["#7a5a40", "#6e5038", "#835f44"][Math.floor(r() * 3)]; g.fillRect(x + 3, 0, 58, 512); g.fillStyle = "rgba(30,20,20,0.8)"; g.fillRect(x, 0, 4, 512); }
});

type Lamp = { bulb: THREE.Mesh; halo: THREE.Sprite };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sunDisc: THREE.Sprite;
  private fog = new THREE.Fog(0xffffff, 25, 300);
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private sunCache = new Map<number, THREE.Vector3>();
  private top = new THREE.Group(); private mine = new THREE.Group(); private near = new THREE.Group();
  private lamps: Lamp[] = []; private bulbMat: THREE.MeshBasicMaterial; private haloMat: THREE.SpriteMaterial;
  private wheel = new THREE.Group();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  constructor(_kit: Kit) {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunDisc.frustumCulled = false; this.sunDisc.layers.set(NOINK); R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 110 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); this.top.add(m);
    }
    this.bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.2, 1.4) });
    this.haloMat = new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1.0, 0.62, 0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.buildTop();
    this.buildMine();
    R.add(this.top, this.mine);
  }

  // ---------------- the pithead ----------------
  private buildTop() {
    const b = new Batch(), G = this.top, r = rng(7);
    const ground = lam("pitGround", () => ({ map: dirtTex("pitDirt", "#8e785c", ["#9a8466", "#84705a", "#a08a6a", "#7c6a54"], "rgba(60,52,50,0.35)") }));
    b.add(quad(V(-300, 0, 300), V(300, 0, 300), V(300, 0, -300), V(-300, 0, -300), 100, 100), ground);
    const wood = lam("timberHD", () => ({ map: beamHD() })), iron = lam("headIron", () => ({ color: "#6a3a30" })), dark = lam("darkIron", () => ({ color: "#3a3638" }));
    // shaft collar: timber kerb + railings around a dark opening (behind the lift cage)
    b.add(boxGeo(V(-1.5, -0.6, -1.5), V(1.5, 0.02, 1.5)), lam("shaftDark", () => ({ color: "#151214" })));
    for (const [x0, z0, x1, z1] of [[-1.7, -1.7, 1.7, -1.5], [-1.7, 1.5, -1.1, 1.7], [1.1, 1.5, 1.7, 1.7], [-1.7, -1.5, -1.5, 1.5], [1.5, -1.5, 1.7, 1.5]] as const)
      b.add(boxGeo(V(x0, 0, z0), V(x1, 0.22, z1)), wood);
    // headframe: four raked legs, braces, deck, sheave wheel; two back struts to the engine house side
    const H = 12.5;
    const leg = (x0: number, z0: number, x1: number, z1: number, y1 = H) => {
      const a = V(x0, 0, z0), c = V(x1, y1, z1), mid = a.clone().add(c).multiplyScalar(0.5), len = a.distanceTo(c);
      const g = new THREE.BoxGeometry(0.34, len, 0.34);
      const m = new THREE.Matrix4().lookAt(a, c, V(0, 0, 1)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      m.setPosition(mid);
      b.add(g, iron, m);
    };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(sx * 2.1, sz * 2.1, sx * 0.9, sz * 0.9);
    for (const y of [3.2, 6.4, 9.4]) {
      const k = 2.1 - (1.2 * y) / H;
      for (const s of [-1, 1]) { b.add(boxGeo(V(-k, y, s * k - 0.1), V(k, y + 0.22, s * k + 0.1)), iron); b.add(boxGeo(V(s * k - 0.1, y, -k), V(s * k + 0.1, y + 0.22, k)), iron); }
    }
    b.add(boxGeo(V(-1.3, H, -1.3), V(1.3, H + 0.3, 1.3)), wood);
    leg(-9, -1.6, -0.9, -0.9, H - 0.4); leg(-9, 1.6, -0.9, 0.9, H - 0.4);
    // lift cage: frame + bars + roof
    const cageM = lam("liftCage", () => ({ color: "#5a5a60" }));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(boxGeo(V(x * 1.0 - 0.06, 0, z * 1.0 - 0.06), V(x * 1.0 + 0.06, 2.5, z * 1.0 + 0.06)), cageM);
    b.add(boxGeo(V(-1.1, 2.5, -1.1), V(1.1, 2.62, 1.1)), cageM);
    b.add(boxGeo(V(-1.05, 0, -1.05), V(1.05, 0.12, 1.05)), wood);
    for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 2) continue; b.add(boxGeo(V(i * 0.22 - 0.025, 0.12, 0.98), V(i * 0.22 + 0.025, 2.5, 1.02)), cageM); }
    for (const y of [1.0, 1.9]) b.add(boxGeo(V(-1.0, y, 0.97), V(1.0, y + 0.06, 1.03)), cageM);
    for (let i = -4; i <= 4; i++) for (const s of [-1, 1]) b.add(boxGeo(V(s * 1.0 - 0.02, 0.12, i * 0.22 - 0.025), V(s * 1.0 + 0.02, 2.5, i * 0.22 + 0.025)), cageM);
    b.add(boxGeo(V(-0.03, 2.62, -0.03), V(0.03, H, 0.03)), dark); // hoist rope
    // engine house (brick, slate roof) + chimney
    const brick = lam("brickWall", () => ({ map: brickTex() }));
    const hx = -14, hz = -3, hw = 4.5, hd = 5, hh = 6;
    b.add(boxGeo(V(hx - hw, 0, hz - hd), V(hx + hw, hh, hz + hd), 4), brick);
    const roofM = lam("slateRoof", () => ({ map: roofHD("#4a4a58", true) }));
    for (const s of [-1, 1]) b.add(quad(V(hx + s * (hw + 0.4), hh - 0.1, hz + s * (hd + 0.4)), V(hx - s * (hw + 0.4), hh - 0.1, hz + s * (hd + 0.4)), V(hx - s * (hw + 0.4), hh + 2.6, hz), V(hx + s * (hw + 0.4), hh + 2.6, hz), 3, 2), roofM);
    for (const s of [-1, 1]) b.add(new THREE.BufferGeometry().setFromPoints([V(hx + s * hw, hh, hz - hd), V(hx + s * hw, hh, hz + hd), V(hx + s * hw, hh + 2.6, hz)]).setIndex(s > 0 ? [0, 2, 1] : [0, 1, 2]), brick);
    const winM = lam("window", () => ({ color: "#2a3040" })), frameM = lam("frameCream", () => ({ color: "#e8dcc0" }));
    for (const z of [-3, 0, 3]) { b.add(boxGeo(V(hx + hw - 0.02, 2.0, hz + z - 0.7), V(hx + hw + 0.08, 4.4, hz + z + 0.7)), frameM); b.add(boxGeo(V(hx + hw + 0.06, 2.15, hz + z - 0.55), V(hx + hw + 0.1, 4.25, hz + z + 0.55)), winM); }
    b.add(boxGeo(V(-20, 0, -12.5), V(-18.4, 22, -10.9), 2), brick);
    b.add(boxGeo(V(-20.2, 22, -12.7), V(-18.2, 22.6, -10.7)), brick);
    // sheds
    const planks = lam("shedPlanks", () => ({ map: plankTex() })), roofT = lam("tinRoof", () => ({ color: "#7a6a5e" }));
    for (const [x, z, w, d, h] of [[10, -6, 3.5, 3, 3.2], [16, 1, 3, 4, 3.0], [-9, 12, 3.2, 2.6, 2.8]] as const) {
      b.add(boxGeo(V(x - w, 0, z - d), V(x + w, h, z + d), 2), planks);
      b.add(boxGeo(V(x - w - 0.3, h, z - d - 0.3), V(x + w + 0.3, h + 0.25, z + d + 0.3)), roofT);
      b.add(boxGeo(V(x - 0.6, 0, z + d), V(x + 0.6, 2.1, z + d + 0.05)), lam("doorDark", () => ({ color: "#3a2a24" })));
    }
    // coal heaps
    const coalM = lam("coalHeap", () => ({ map: coalTex() }));
    for (const [x, z, rr, h] of [[18, -16, 7, 4.5], [-28, -22, 9, 5.5], [24, 14, 5, 3]] as const) {
      const g = new THREE.ConeGeometry(rr, h, 14, 3); g.translate(x, h / 2, z);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.1 && p.getY(i) < h - 0.1) { p.setX(i, p.getX(i) + (r() - 0.5) * 0.8); p.setZ(i, p.getZ(i) + (r() - 0.5) * 0.8); }
      g.computeVertexNormals(); b.add(g, coalM);
    }
    // rails + a coal tub
    const railM = lam("rail", () => ({ color: "#4a4448" }));
    for (const s of [-0.45, 0.45]) b.add(boxGeo(V(1.5, 0.1, s - 0.04), V(40, 0.2, s + 0.04)), railM);
    for (let x = 1.8; x < 40; x += 0.8) b.add(boxGeo(V(x, 0, -0.65), V(x + 0.2, 0.1, 0.65)), wood);
    b.add(boxGeo(V(7.5, 0.35, -0.6), V(9.3, 1.3, 0.6)), lam("tub", () => ({ color: "#5a3a2e" })));
    b.add(boxGeo(V(7.6, 1.3, -0.5), V(9.2, 1.45, 0.5)), coalM);
    for (const x of [7.9, 8.9]) for (const s of [-0.5, 0.5]) { const w = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14); w.rotateX(Math.PI / 2); w.translate(x, 0.32, s); b.add(w, dark); }
    // posts the canary cage hangs from (arm toward +x, hook at 2.05 m)
    for (const p of [POST1, POST10]) {
      b.add(boxGeo(V(p[0] - 0.55, 0, p[2] - 0.08), V(p[0] - 0.39, 2.45, p[2] + 0.08)), wood);
      b.add(boxGeo(V(p[0] - 0.55, 2.3, p[2] - 0.06), V(p[0] + 0.06, 2.42, p[2] + 0.06)), wood);
      b.add(boxGeo(V(p[0] - 0.012, 2.08, p[2] - 0.012), V(p[0] + 0.012, 2.3, p[2] + 0.012)), dark);
    }
    // fence + hills + a few trees
    for (let x = -40; x <= 40; x += 2.5) b.add(boxGeo(V(x - 0.07, 0, -30.07), V(x + 0.07, 1.2, -29.93)), wood);
    b.add(boxGeo(V(-40, 0.8, -30.04), V(40, 0.92, -29.96)), wood);
    const hillM = lam("hill", () => ({ color: "#6f8a4e" })), hillM2 = lam("hill2", () => ({ color: "#5d7a46" }));
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2, d = 150 + 60 * r(), rr = 50 + 40 * r(), h = 18 + 22 * r();
      const g = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(rr, h, rr * 0.7); g.translate(Math.cos(a) * d, -2, Math.sin(a) * d);
      b.add(g, i % 2 ? hillM : hillM2);
    }
    const trunk = lam("trunk", () => ({ color: "#6a4a34" })), leaf = lam("leaf", () => ({ color: "#4f8a42" }));
    for (let i = 0; i < 22; i++) {
      const a = r() * Math.PI * 2, d = 40 + 50 * r(), x = Math.cos(a) * d, z = Math.sin(a) * d, h = 4 + 3 * r();
      const t = new THREE.CylinderGeometry(0.18, 0.25, h * 0.45, 7); t.translate(x, h * 0.22, z); b.add(t, trunk);
      const c = new THREE.ConeGeometry(h * 0.28, h * 0.75, 8); c.translate(x, h * 0.62, z); b.add(c, leaf);
    }
    b.build(this.top);
    // sheave wheel (spins with the hoist)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.12, 8, 40), iron);
    this.wheel.add(ring);
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.4, 0.08), iron); s.rotation.z = (i * Math.PI) / 8; this.wheel.add(s); }
    this.wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12).rotateX(Math.PI / 2), dark));
    this.wheel.position.set(0, H + 1.6, 0);
    this.wheel.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    this.top.add(this.wheel);
  }

  // ---------------- the gallery ----------------
  private buildMine() {
    const b = new Batch(), nb = new Batch(), lb = new Batch(), nlb = new Batch(), r = rng(11), G = this.mine;
    const rock = lam("rockWall", () => ({ map: rockTex() })), coal = lam("coalFace", () => ({ map: coalTex() }));
    const floorM = lam("mineFloor", () => ({ map: dirtTex("mineDirt", "#4e423a", ["#564a40", "#463c35", "#5c4e44"], "rgba(20,18,20,0.4)") }));
    const wood = lam("timberHD", () => ({ map: beamHD() })), dark = lam("darkIron", () => ({ color: "#3a3638" })), railM = lam("rail", () => ({ color: "#4a4448" }));
    const x0 = FACE_X, x1 = 6, y = Y0;
    const shell = new Batch(), nshell = new Batch();
    shell.add(quad(V(x0, y, TW), V(x1, y, TW), V(x1, y, -TW), V(x0, y, -TW), (x1 - x0) / 4, (2 * TW) / 4), floorM);
    shell.add(quad(V(x1, y + TH, TW), V(x0, y + TH, TW), V(x0, y + TH, -TW), V(x1, y + TH, -TW), (x1 - x0) / 4, 1.2), rock);
    shell.add(quad(V(x0, y, -TW), V(x1, y, -TW), V(x1, y + TH, -TW), V(x0, y + TH, -TW), (x1 - x0) / 4, TH / 4), rock);
    nshell.add(quad(V(x1, y, TW), V(x0, y, TW), V(x0, y + TH, TW), V(x1, y + TH, TW), (x1 - x0) / 4, TH / 4), rock);
    shell.add(quad(V(x0, y, TW), V(x0, y, -TW), V(x0, y + TH, -TW), V(x0, y + TH, TW), 1.4, 0.9), coal);
    shell.add(quad(V(x1, y, -TW), V(x1, y, TW), V(x1, y + TH, TW), V(x1, y + TH, -TW), 1.4, 0.9), rock);
    const sh = new THREE.Group(); shell.build(sh, false); G.add(sh);
    const nsh = new THREE.Group(); nshell.build(nsh, false); this.near.add(nsh);
    // rough rock lumps along the walls + ceiling, coal lumps at the face
    const lump = (bb: Batch, m: THREE.Material, x: number, yy: number, z: number, s: number) => {
      const g = new THREE.IcosahedronGeometry(1, 0); g.scale(s * (0.8 + 0.6 * r()), s * (0.6 + 0.5 * r()), s * (0.5 + 0.4 * r()));
      g.rotateY(r() * 3); g.translate(x, yy, z); bb.add(g, m);
    };
    for (let x = x0 + 0.5; x < x1; x += 0.9 + r() * 0.8) {
      lump(lb, rock, x, y + 0.3 + r() * 2.2, -TW, 0.35 + 0.3 * r());
      lump(nlb, rock, x, y + 0.3 + r() * 2.2, TW, 0.35 + 0.3 * r());
    }
    for (let i = 0; i < 26; i++) lump(b, coal, x0 + 0.2 + r() * 1.6, y + 0.1 + r() * 0.3, (r() - 0.5) * 2 * TW * 0.9, 0.18 + 0.2 * r());
    for (let i = 0; i < 10; i++) lump(lb, coal, x0 + 0.05, y + 0.3 + r() * 2.2, (r() - 0.5) * 2 * TW * 0.9, 0.3 + 0.3 * r());
    // timber sets every 3 m (posts + cap), rails + sleepers
    for (let x = x0 + 2.4; x < x1; x += 3) {
      b.add(boxGeo(V(x - 0.13, y, -TW + 0.05), V(x + 0.13, y + TH - 0.32, -TW + 0.31)), wood);
      nb.add(boxGeo(V(x - 0.13, y, TW - 0.31), V(x + 0.13, y + TH - 0.32, TW - 0.05)), wood);
      b.add(boxGeo(V(x - 0.15, y + TH - 0.34, -TW), V(x + 0.15, y + TH - 0.06, TW)), wood);
    }
    for (const s of [-0.5, 0.5]) b.add(boxGeo(V(x0 + 1.5, y + 0.1, s - 0.035), V(x1, y + 0.18, s + 0.035)), railM);
    for (let x = x0 + 1.6; x < x1; x += 0.75) b.add(boxGeo(V(x, y, -0.7), V(x + 0.18, y + 0.1, 0.7)), wood);
    // a coal tub on the rails + stacked pit props + a bucket
    b.add(boxGeo(V(-21, y + 0.32, -0.6), V(-19.2, y + 1.25, 0.6)), lam("tub", () => ({ color: "#5a3a2e" })));
    b.add(boxGeo(V(-20.9, y + 1.25, -0.5), V(-19.3, y + 1.4, 0.5)), coal);
    for (let i = 0; i < 5; i++) { const g = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8); g.rotateZ(Math.PI / 2); g.translate(-79 + 0, y + 0.12 + 0.2 * (i % 3) + (i > 2 ? 0.1 : 0), -TW + 0.5 + 0.2 * i); b.add(g, wood); }
    const bucket = new THREE.CylinderGeometry(0.2, 0.16, 0.36, 12); bucket.translate(-82.5, y + 0.18, -TW + 0.55); b.add(bucket, dark);
    const g1 = new THREE.Group(); b.build(g1, true); G.add(g1);
    const g2 = new THREE.Group(); nb.build(g2, true); this.near.add(g2);
    const g3 = new THREE.Group(); lb.build(g3, false); G.add(g3);
    const g4 = new THREE.Group(); nlb.build(g4, false); this.near.add(g4);
    G.add(this.near);
    // lamps: hanging from every other cap, swinging a little; bulbs bloom
    const bodyM = lam("lampBody", () => ({ color: "#4a4040" }));
    for (let x = x0 + 2.4 + 3, i = 0; x < x1; x += 6, i++) {
      const z = i % 2 ? 0.75 : -0.75;
      const lg = new THREE.Group();
      const wire = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.02), dark); wire.position.set(0, -0.15, 0);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 12), bodyM); cap.position.set(0, -0.34, 0);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), this.bulbMat); bulb.position.set(0, -0.44, 0); bulb.layers.set(NOINK);
      const halo = new THREE.Sprite(this.haloMat); halo.position.set(0, -0.44, 0); halo.scale.setScalar(1.1); halo.layers.set(NOINK); halo.renderOrder = 5;
      lg.add(wire, cap, bulb, halo);
      lg.position.set(x, y + TH - 0.34, z);
      wire.castShadow = cap.castShadow = true;
      G.add(lg);
      this.lamps.push({ bulb, halo });
    }
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    const underground = s.place === "mine";
    this.top.visible = !underground; this.mine.visible = underground;
    this.near.visible = !s.hideNear;
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L), dim = dimAt(id, f);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    if (underground) Rr = Math.max(Rr, 24);
    this.sun.position.copy(focus).addScaledVector(sunDir, underground ? 60 : 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = underground ? 1 : 20; sc.far = underground ? 160 : 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(L.lit[0] * dim, L.lit[1] * dim, L.lit[2] * dim); TONE.uShadeCol.value.set(L.shade[0] * dim, L.shade[1] * dim, L.shade[2] * dim); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    CARD_K.uGain.value = 1.03 * (underground ? 0.92 : 1) * (0.5 + 0.5 * dim);
    this.bulbMat.color.setRGB(5 * dim * dim, 3.2 * dim * dim, 1.4 * dim * dim);
    this.haloMat.color.setRGB(1.0 * dim, 0.62 * dim, 0.3 * dim);
    this.lamps.forEach((l, i) => { const p = l.bulb.parent!; p.rotation.z = 0.04 * Math.sin(t * 1.3 + i); p.rotation.x = 0.03 * Math.sin(t * 1.1 + i * 2); });
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    }
    if (!underground) for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light === "golden" ? "golden" : "day"][i % 4];
    }
    // the hoist turns while the cage runs (ending: the crew going down)
    this.wheel.rotation.z = id === 11 && f > 1800 ? -(f - 1800) * 0.04 : 0;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, null, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }
}
export type { V3 };
