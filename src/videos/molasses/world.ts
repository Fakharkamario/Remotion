// The whole place as one three.js scene: sky, harbour, Commercial St with the elevated railway and brick blocks
// (build.ts buildBoston), the molasses tank (16 x 4 riveted plates that fly apart at the burst), the leak streaks and
// the painter's fresh coat, popping rivets, the molasses wave (a polar height field around the tank, posed per frame
// from story.ts waveH), a crate for the honey jar, the engineer's plan board, and the cast (cast.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { V, lam, buildBoston, Kit, Ray, kitClone, boxGeo, Batch } from "./build";
import { ctex, waterNear, waterFar, cloudHD, beam, rng } from "./paint";
import { Pen, fxDrip, fxPlan } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, SHOTS, camAt, V3, smooth, clamp01, FOREGROUND, ShotDef, TANK_R, TANK_H, waveH, frontR, baseH, crestH, bumpK,
  DRIPS, LEAK0, PAINT0, PAINT1, RIVETS, JAR, BOARD, STAMPS,
} from "./story";

// ---------------- assets (optional CC0 kit; everything has a drawn fallback) ----------------
const KENNEY: string[] = [];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`molasses/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** one riveted steel plate (the tank is 16 x 4 of them): painted brown, darker seam border, rivet rows, faint streaks */
const plateTex = () => ctex("tankPlate", 512, 512, (g, r) => {
  g.fillStyle = "#8a5a3a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "70,40,25" : "160,110,75"},${0.05 + 0.06 * r()})`; g.fillRect(r() * 512, r() * 512, 20 + r() * 90, 60 + r() * 200); }
  g.fillStyle = "#4a2c1c";
  g.fillRect(0, 0, 512, 14); g.fillRect(0, 498, 512, 14); g.fillRect(0, 0, 10, 512); g.fillRect(502, 0, 10, 512);
  for (let x = 24; x < 500; x += 26) for (const y of [26, 486]) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = "#5a3826"; g.fill(); g.beginPath(); g.arc(x - 1.5, y - 1.5, 2.5, 0, Math.PI * 2); g.fillStyle = "#b8865e"; g.fill(); }
  for (let y = 50; y < 470; y += 26) for (const x of [22, 490]) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = "#5a3826"; g.fill(); g.beginPath(); g.arc(x - 1.5, y - 1.5, 2.5, 0, Math.PI * 2); g.fillStyle = "#b8865e"; g.fill(); }
});
const roofTex = () => ctex("tankRoof", 512, 512, (g) => {
  g.fillStyle = "#7a4f33"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#4a2c1c"; g.lineWidth = 8;
  for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
});

/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, Math.min(f, SHOTS[SHOTS.length - 1].b - 1))), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

// ---------------- tank plates ----------------
const NSEG = 16, NRING = 4, PH = TANK_H / NRING;
type Plate = { m: THREE.Mesh; th: number; y0: number; v: number; vy: number; spin: V3; tl: number };
// ---------------- wave height field ----------------
const WR = 300, WA = 128, WMAX = 165; // rings, angular segments, outer radius
const ringR = (i: number) => WMAX * (i / (WR - 1)) ** 1.15;
const MOL_DARK = new THREE.Color("#2e1206"), MOL_AMBER = new THREE.Color("#a0561a");

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private tank = new THREE.Group(); private plates: Plate[] = []; private roof: THREE.Mesh;
  private drips: { m: THREE.Mesh; len: number }[] = []; private coat: THREE.Mesh;
  private rivets: THREE.Mesh[] = [];
  private wave: THREE.Mesh; private wavePos: Float32Array; private waveCol: Float32Array;
  private crate = new THREE.Group(); private board = new THREE.Group(); private planA: THREE.Mesh; private planB: THREE.Mesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
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
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
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
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- town ----
    buildBoston(R, sightLines());

    // ---- harbour water (river shader of the bridge short, now the harbour off the quay) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "harbour1";
    const wg = new THREE.PlaneGeometry(1800, 900); wg.rotateX(-Math.PI / 2); wg.translate(0, -2.2, -24 - 450);
    const wm = new THREE.Mesh(wg, waterM); wm.receiveShadow = true; R.add(wm);

    // ---- tank ----
    const plateM = lam("tankPlateM", () => ({ map: plateTex(), side: THREE.DoubleSide }));
    for (let j = 0; j < NRING; j++) for (let k = 0; k < NSEG; k++) {
      const th0 = (k / NSEG) * Math.PI * 2, dth = (Math.PI * 2) / NSEG;
      const g = new THREE.CylinderGeometry(TANK_R, TANK_R, PH, 6, 1, true, th0, dth);
      const th = th0 + dth / 2, cx = Math.sin(th) * TANK_R, cz = Math.cos(th) * TANK_R;
      g.translate(-cx, 0, -cz); // pivot at the plate centre
      const m = new THREE.Mesh(g, plateM); m.castShadow = true; m.receiveShadow = true;
      const r = rng(k * 7 + j * 31 + 3);
      this.plates.push({ m, th, y0: PH * (j + 0.5), v: 7 + 6 * r(), vy: 2 + 5 * r() + 2 * j, spin: [(r() - 0.5) * 3, (r() - 0.5) * 2, (r() - 0.5) * 3], tl: 0 });
      this.tank.add(m);
    }
    for (const p of this.plates) { // time to land (plate centre ~0.4 m off the ground)
      const a = 4.9, b = p.vy, c = p.y0 - 0.4;
      p.tl = (b + Math.sqrt(b * b + 4 * a * c)) / (2 * a);
    }
    this.roof = new THREE.Mesh(new THREE.ConeGeometry(TANK_R + 0.25, 2.6, 48, 1, true), lam("tankRoofM", () => ({ map: roofTex(), side: THREE.DoubleSide })));
    this.roof.castShadow = true; this.tank.add(this.roof);
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.6, 16), lam("hatch", () => ({ color: "#5a3a26" })));
    hatch.position.y = 1.4; this.roof.add(hatch);
    // ladder up the street side
    const lad = new Batch(), ironL = lam("ladder", () => ({ color: "#3a3330" }));
    for (const s of [-1, 1]) lad.add(boxGeo(V(-2.4 + s * 0.3 - 0.04, 0, TANK_R + 0.25), V(-2.4 + s * 0.3 + 0.04, TANK_H, TANK_R + 0.33)), ironL);
    for (let y = 0.4; y < TANK_H; y += 0.4) lad.add(boxGeo(V(-2.7, y, TANK_R + 0.27), V(-2.1, y + 0.04, TANK_R + 0.31)), ironL);
    const ladG = new THREE.Group(); lad.build(ladG); this.tank.add(ladG);
    R.add(this.tank);
    // leak streaks (curved wall approximated by small tangent planes) and the fresh coat that hides them
    const dripM = (i: number) => lam("drip" + i, () => ({ map: ctex("drip" + i, 128, 512, (g) => fxDrip(new Pen(g), i + 1)), alphaTest: 0.5, side: THREE.DoubleSide }));
    DRIPS.forEach((d, i) => {
      const g = new THREE.PlaneGeometry(d.w, 1); g.translate(0, -0.5, 0); // hangs from its top edge
      const m = new THREE.Mesh(g, dripM(i % 4));
      m.position.set(Math.sin(d.th) * (TANK_R + 0.04), d.y1, Math.cos(d.th) * (TANK_R + 0.04)); m.rotation.y = d.th;
      this.drips.push({ m, len: d.y1 - d.y0 }); R.add(m);
    });
    const ths = DRIPS.map((d) => d.th), t0 = Math.min(...ths) - 0.05, t1 = Math.max(...ths) + 0.05;
    const coatG = new THREE.CylinderGeometry(TANK_R + 0.07, TANK_R + 0.07, 1, 12, 1, true, t0, t1 - t0); coatG.translate(0, 0.5, 0);
    this.coat = new THREE.Mesh(coatG, lam("coat", () => ({ color: "#7d4a2c", side: THREE.DoubleSide })));
    this.coat.receiveShadow = true; R.add(this.coat);
    const rivG = new THREE.SphereGeometry(0.11, 10, 8), rivM = twoTone(new THREE.MeshPhongMaterial({ color: "#6a6c72", specular: "#b0b0b0", shininess: 50 }), 0.15);
    for (let i = 0; i < RIVETS.length; i++) { const m = new THREE.Mesh(rivG, rivM); m.castShadow = true; this.rivets.push(m); R.add(m); }

    // ---- the wave: polar height field around the tank ----
    const n = WR * WA, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), idx: number[] = [];
    for (let i = 0; i < WR - 1; i++) for (let a = 0; a < WA; a++) {
      const A = i * WA + a, B = i * WA + ((a + 1) % WA), C = (i + 1) * WA + a, D = (i + 1) * WA + ((a + 1) % WA);
      idx.push(A, C, B, B, C, D);
    }
    const wgeo = new THREE.BufferGeometry();
    wgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); wgeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    wgeo.setIndex(idx);
    this.wavePos = pos; this.waveCol = col;
    const molM = twoTone(new THREE.MeshPhongMaterial({ color: "#ffffff", vertexColors: true, specular: "#ffd2a0", shininess: 70 }), 0.25);
    this.wave = new THREE.Mesh(wgeo, molM);
    this.wave.castShadow = true; this.wave.receiveShadow = true; this.wave.frustumCulled = false;
    R.add(this.wave);

    // ---- crate (honey jar insert) and the engineer's plan board ----
    const wood = lam("wood", () => ({ map: beam() }));
    const cb = new Batch();
    cb.add(boxGeo(V(-0.45, 0, -0.35), V(0.45, 0.9, 0.35), 1), wood);
    cb.build(this.crate);
    this.crate.position.set(JAR[0], 0.12, JAR[2] + 0.05); R.add(this.crate);
    const planTex = (signed: boolean) => ctex("plan" + signed, 900, 640, (g) => fxPlan(new Pen(g), signed));
    this.planA = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.07), new THREE.MeshBasicMaterial({ map: planTex(false), color: 0xe8e8e8 }));
    this.planB = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.07), new THREE.MeshBasicMaterial({ map: planTex(true), color: 0xe8e8e8 }));
    for (const p of [this.planA, this.planB]) { p.layers.set(NOINK); p.position.set(0, 1.6, -0.05); p.rotation.y = Math.PI; this.board.add(p); }
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.17, 0.06), wood); back.position.set(0, 1.6, 0); this.board.add(back);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), wood); p.position.set(s * 0.6, 0.95, 0.12); p.rotation.x = -0.12; this.board.add(p); }
    this.board.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    this.board.position.set(BOARD[0], 0.12, BOARD[2]); R.add(this.board);

    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
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
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], ts = s.wave(t);
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- set pieces ----
    this.poseTank(s.tank, ts, id, f);
    this.poseWave(ts);
    this.crate.visible = id === 8;
    this.board.visible = id === 10;
    this.planA.visible = f < STAMPS[0]; this.planB.visible = f >= STAMPS[0];
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, ts, { pos: cam.position, right });
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

  private poseTank(state: "intact" | "burst" | "gone", ts: number | null, id: number, f: number) {
    const gone = state === "gone", tb = state === "burst" && ts !== null ? Math.max(0, ts) : -1;
    this.tank.visible = !gone;
    for (const p of this.plates) {
      const out = V(Math.sin(p.th), 0, Math.cos(p.th));
      if (tb < 0) {
        p.m.position.set(out.x * TANK_R, p.y0, out.z * TANK_R); p.m.rotation.set(0, 0, 0);
        continue;
      }
      // burst: lower rings go first and fastest; plates tumble out and come to rest on the ground
      const tl = Math.min(tb, p.tl), d = TANK_R + p.v * tl;
      p.m.position.set(out.x * d, Math.max(0.4, p.y0 + p.vy * tl - 4.9 * tl * tl), out.z * d);
      const k = tb >= p.tl ? 1 : 0;
      p.m.rotation.set(p.spin[0] * tl + k * 0.0, p.spin[1] * tl, p.spin[2] * tl + k * 0.0);
      if (tb >= p.tl) { // lie nearly flat once landed
        p.m.rotation.set(Math.PI / 2 - 0.25 * Math.sign(p.spin[0] || 1), p.th, p.spin[2] * 0.1);
      }
    }
    // roof: lifts, tips and drops into the middle
    if (tb < 0) { this.roof.position.set(0, TANK_H + 1.3, 0); this.roof.rotation.set(0, 0, 0); }
    else {
      const u = clamp01(tb / 1.6);
      this.roof.position.set(-2 * u, TANK_H + 1.3 + 6 * Math.sin(Math.PI * u) - (TANK_H - 1.5) * u * u, 3 * u);
      this.roof.rotation.set(0.5 * u, 0, -0.35 * u);
    }
    // ladder (third child) leans away with the plates
    const ladder = this.tank.children[NSEG * NRING + 1];
    if (ladder) ladder.visible = tb < 0;
    // leak streaks + coat: visible on the intact tank only
    const intact = !gone && tb < 0;
    const grow = id === 3 ? 0.3 + 0.7 * smooth((f - LEAK0) / 24) : id === 2 ? 0.45 : 1;
    this.drips.forEach((d) => { d.m.visible = intact && id !== 4; d.m.scale.y = d.len * grow; });
    const coatH = id === 3 ? 7 * smooth((f - PAINT0) / (PAINT1 - PAINT0)) : id === 4 ? 7 : 0;
    this.coat.visible = intact && coatH > 0.02; this.coat.scale.y = Math.max(0.01, coatH);
    // rivets: seated in the wall, then shot out toward the street
    RIVETS.forEach(([th, y, f0], i) => {
      const m = this.rivets[i], o = V(Math.sin(th), 0, Math.cos(th));
      m.visible = id === 4;
      const tt = Math.max(0, (f - f0) / FPS);
      const d = TANK_R + 0.05 + 16 * tt;
      m.position.set(o.x * d + 1.5 * tt, y + 2.5 * tt - 4.9 * tt * tt, o.z * d);
    });
  }

  private poseWave(ts: number | null) {
    this.wave.visible = ts !== null && ts >= 0;
    if (!this.wave.visible) return;
    const t = ts!, pos = this.wavePos, col = this.waveCol, rf = frontR(t), hb = baseH(t), hc = hb + (crestH(t) - hb) * bumpK(t);
    for (let i = 0; i < WR; i++) {
      const r = ringR(i), h0 = waveH(r, t), d = rf - r;
      // colour: amber where the sheet is thin and moving at the front, dark treacle in the deep body
      const k = h0 <= 0 ? 0 : clamp01(0.75 * Math.exp(-Math.max(0, d) / 4) + 0.2 * (1 - clamp01((h0 - hb) / Math.max(0.3, hc - hb))));
      for (let a = 0; a < WA; a++) {
        const th = (a / WA) * Math.PI * 2, x = Math.sin(th) * r, z = Math.cos(th) * r, j = (i * WA + a) * 3;
        // lumpy front: the radius each angle has reached wobbles by a couple of metres (fades as it spends itself)
        const lump = (1.6 * Math.sin(th * 7 + 0.8 * t) + 1.0 * Math.sin(th * 17 - 1.3 * t) + 0.6 * Math.sin(th * 29 + 2.1 * t)) * Math.exp(-t / 12);
        const h = lump === 0 ? h0 : waveH(r - lump, t);
        // rolling swells on the surface, none in the set sheet; under the quay (harbour) the sheet drops away
        const rip = h > 0 ? (0.22 * Math.sin(r * 0.7 - t * 4 + th * 6) + 0.1 * Math.sin(r * 1.9 + th * 13)) * Math.exp(-t / 9) : 0;
        const y = z < -24.3 ? -3 : h > 0 ? h + rip + 0.02 : -0.2;
        pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
        const band = h > 0 ? 0.16 * Math.sin(r * 1.3 - t * 5 + th * 3) * Math.exp(-t / 10) : 0;
        const kk = clamp01(k + band + (lump === 0 ? 0 : 0.15 * clamp01(1 - (rf + lump - r) / 3)));
        col[j] = MOL_DARK.r + (MOL_AMBER.r - MOL_DARK.r) * kk; col[j + 1] = MOL_DARK.g + (MOL_AMBER.g - MOL_DARK.g) * kk; col[j + 2] = MOL_DARK.b + (MOL_AMBER.b - MOL_DARK.b) * kk;
      }
    }
    const g = this.wave.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    g.computeVertexNormals();
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.2 * wTime, 0.1 * wTime);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
