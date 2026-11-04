// The whole place as one three.js scene: sky, harbour, Commercial St with the elevated railway and brick blocks
// (build.ts buildBoston), the molasses tank (16 x 4 riveted plates that fly apart at the burst), the leak streaks and
// the painter's fresh coat, popping rivets, the molasses wave (a polar height field around the tank, posed per frame
// from story.ts waveH), a crate for the honey jar, the engineer's plan board, and the cast (cast.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { V, lam, buildHiroshima, Kit, Ray, kitClone, boxGeo, Batch } from "./build";
import { ctex, waterNear, waterFar, cloudHD, beam, rng, shojiTex, newsTex } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, SHOTS, camAt, V3, smooth, clamp01, FOREGROUND, ShotDef, ROOM, WIN, TABLE, SIREN, RIVER_Z0, RIVER_Z1, HYPO, BURST_Y, FLASH_F,
  planeAt, bombAt, shojiOpen, windowGlow, W as WORD,
} from "./story";

// ---------------- assets (optional CC0 kit; everything has a drawn fallback) ----------------
const KENNEY: string[] = [];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`hiroshima/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
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
/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    if (s.light === "room" || [2, 8, 12, 15, 16, 21, 22].includes(s.id)) continue; // inside the room / in the air: never cull the town
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

// ---------------- B-29 and the bomb (built from primitives, nose toward +x, real size: 30 m long, 43 m span) ----------------
const silver = () => twoTone(new THREE.MeshPhongMaterial({ color: "#c4c9d0", specular: "#ffffff", shininess: 70 }), 0.2);
const planform = (pts: [number, number][], th: number) => {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false });
  return g;
};
const makeB29 = (mat: THREE.Material) => {
  const g = new THREE.Group(), glass = lam("b29glass", () => ({ color: "#2e3a48" })), dark = lam("b29dark", () => ({ color: "#3a3e44" }));
  const fus = new THREE.CylinderGeometry(1.45, 1.45, 28, 20); fus.rotateZ(Math.PI / 2);
  g.add(new THREE.Mesh(fus, mat));
  const nose = new THREE.SphereGeometry(1.45, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2); nose.rotateZ(-Math.PI / 2); nose.scale(1.25, 1, 1); nose.translate(14, 0, 0);
  g.add(new THREE.Mesh(nose, glass));
  const tail = new THREE.CylinderGeometry(1.45, 0.45, 7, 18); tail.rotateZ(Math.PI / 2); tail.translate(-17.5, 0.3, 0);
  g.add(new THREE.Mesh(tail, mat));
  for (const s of [1, -1]) { // wings (shape x = chord along +x, y = span), extruded in thickness
    const w = planform([[1.2, 0], [6.6, 0], [3.0, 21.5 * s], [0.6, 21.5 * s]], 0.5);
    w.rotateX(Math.PI / 2); w.translate(0, -0.2, 0);
    g.add(new THREE.Mesh(w, mat));
    const hs = planform([[-20.5, 0], [-16.2, 0], [-18.4, 7 * s], [-20.3, 7 * s]], 0.3);
    hs.rotateX(Math.PI / 2); hs.translate(0, 0.9, 0);
    g.add(new THREE.Mesh(hs, mat));
    for (const zz of [6.6, 12.2]) { // engine nacelles + prop discs
      const n = new THREE.CylinderGeometry(0.8, 0.65, 5.4, 14); n.rotateZ(Math.PI / 2); n.translate(5.6, -0.35, zz * s);
      g.add(new THREE.Mesh(n, mat));
      const hub = new THREE.ConeGeometry(0.35, 0.8, 10); hub.rotateZ(-Math.PI / 2); hub.translate(8.7, -0.35, zz * s);
      g.add(new THREE.Mesh(hub, dark));
      const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24).rotateY(Math.PI / 2).translate(8.45, -0.35, zz * s),
        new THREE.MeshBasicMaterial({ color: "#4a4e56", transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
      disc.layers.set(NOINK); g.add(disc);
    }
  }
  const fin = planform([[-21, 0], [-14, 0], [-18.4, 8.6], [-20.6, 8.6]], 0.32); fin.translate(0, 1.0, -0.16);
  g.add(new THREE.Mesh(fin, mat));
  g.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
  return g;
};
const makeBomb = () => {
  const g = new THREE.Group(), m = twoTone(new THREE.MeshPhongMaterial({ color: "#3d4238", specular: "#7a8070", shininess: 30 }), 0.2);
  const body = new THREE.CapsuleGeometry(0.36, 2.2, 8, 16); body.rotateZ(Math.PI / 2);
  g.add(new THREE.Mesh(body, m));
  const box = new THREE.BoxGeometry(0.9, 0.95, 0.95); box.translate(-1.75, 0, 0);
  g.add(new THREE.Mesh(box, m));
  return g;
};

// ---------------- mushroom cloud (growing puffs) ----------------
type Puff = { m: THREE.Mesh; kind: "stem" | "cap" | "top" | "ring" | "skirt"; a: number; r: number; h: number; s: number };
const capY = (tc: number) => 30 + 150 * (1 - Math.exp(-tc / 3.6));
const capR = (tc: number) => 22 + 58 * (1 - Math.exp(-tc / 3.0));

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
  private cloudMaps: Record<"day" | "golden" | "room" | "dusk", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private shojiA: THREE.Mesh; private shojiB: THREE.Mesh; private shojiMat: THREE.MeshBasicMaterial;
  private glowCard: THREE.Mesh; private shaft: THREE.Mesh; private shaftPos: Float32Array; private shaftMat: THREE.MeshBasicMaterial;
  private news: THREE.Mesh; private cups: THREE.Mesh[] = [];
  private planes: THREE.Group[] = []; private trails: THREE.Mesh[] = []; private bomb: THREE.Group;
  private fireball: THREE.Mesh; private fireHalo: THREE.Sprite;
  private cloud = new THREE.Group(); private puffs: Puff[] = []; private fireMat: THREE.MeshLambertMaterial;
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
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), this.skyMat);
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
    const cm = (pal: typeof LOOK.day.cloud) => [0, 1, 2, 3].map((k) => cloudHD(k, pal));
    this.cloudMaps = { day: cm(LOOK.day.cloud), golden: cm(LOOK.golden.cloud), room: cm(LOOK.day.cloud), dusk: cm(LOOK.dusk.cloud) };
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.3, d = 820 + (i % 3) * 90;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 170 + (i % 4) * 40;
      m.position.set(Math.cos(a) * d, 150 + (i % 4) * 45, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- town ----
    buildHiroshima(R, sightLines());

    // ---- river (water shader of the bridge short) ----
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
    waterM.customProgramCacheKey = () => "river1";
    const wg = new THREE.PlaneGeometry(1800, RIVER_Z1 - RIVER_Z0); wg.rotateX(-Math.PI / 2); wg.translate(0, -1.6, (RIVER_Z0 + RIVER_Z1) / 2);
    const wm = new THREE.Mesh(wg, waterM); wm.receiveShadow = true; R.add(wm);

    // ---- the room's props: low table, cushions, cups, teapot, the paper ----
    const b = new Batch(), wood = lam("chabudai", () => ({ color: "#6e4428" })), [tx, ty, tz] = TABLE;
    b.add(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 40).translate(tx, ty + 0.31, tz), wood);
    for (const [dx, dz] of [[0.36, 0.36], [-0.36, 0.36], [0.36, -0.36], [-0.36, -0.36]]) b.add(new THREE.BoxGeometry(0.06, 0.29, 0.06).translate(tx + dx, ty + 0.145, tz + dz), wood);
    const cush = lam("zabuton", () => ({ color: "#7a3a3a" }));
    for (const s of [-1, 1]) b.add(boxGeo(V(s * 0.5 - 0.3, ty, 9.65), V(s * 0.5 + 0.3, ty + 0.07, 10.25)), cush);
    const pot = new THREE.SphereGeometry(0.08, 16, 12); pot.scale(1, 0.85, 1); pot.translate(tx + 0.12, ty + 0.4, tz + 0.2);
    b.add(pot, lam("teapot", () => ({ color: "#4a5a4a" })));
    b.add(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 8).translate(tx + 0.12, ty + 0.48, tz + 0.2), lam("teapot", () => ({ color: "#4a5a4a" })));
    b.add(new THREE.BoxGeometry(0.34, 0.02, 0.34).translate(tx - 0.15, ty + 0.345, tz + 0.2), lam("tray", () => ({ color: "#3a2418" })));
    b.build(R);
    const cupG = new THREE.CylinderGeometry(0.045, 0.038, 0.1, 14); cupG.translate(0, 0.05, 0);
    const cupM = lam("yunomi", () => ({ color: "#e8dcc4" }));
    for (const [dx, dz] of [[-0.25, -0.12], [0.28, -0.1]]) { const c = new THREE.Mesh(cupG, cupM); c.position.set(tx + dx, ty + 0.335, tz + dz); c.castShadow = true; this.cups.push(c); R.add(c); }
    this.news = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: newsTex() }));
    this.news.position.set(tx + 0.2, ty + 0.337, tz + 0.12); this.news.rotation.y = 0.3; R.add(this.news);
    // ---- shoji panels in the window (paper glows when backlit; they let the sun through for the floor patch) ----
    this.shojiMat = new THREE.MeshBasicMaterial({ map: shojiTex("win", 3, 4), side: THREE.DoubleSide, toneMapped: true });
    const pw = (WIN.x1 - WIN.x0) / 2, ph = WIN.y1 - WIN.y0;
    this.shojiA = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), this.shojiMat);
    this.shojiB = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), this.shojiMat);
    this.shojiA.position.set(WIN.x0 + pw / 2, (WIN.y0 + WIN.y1) / 2, ROOM.z0 + 0.04);
    this.shojiB.position.set(WIN.x1 - pw / 2, (WIN.y0 + WIN.y1) / 2, ROOM.z0 + 0.075);
    R.add(this.shojiA, this.shojiB);
    this.glowCard = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0 + 0.2, ph + 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), fog: false }));
    this.glowCard.position.set(0, (WIN.y0 + WIN.y1) / 2, ROOM.z0 - 0.4); this.glowCard.layers.set(NOINK); R.add(this.glowCard);
    // ---- light shaft through the window (additive, fades into the room) ----
    const sg = new THREE.BufferGeometry();
    this.shaftPos = new Float32Array(8 * 3);
    const col = new Float32Array(8 * 4);
    for (let i = 0; i < 8; i++) { col[i * 4] = 1; col[i * 4 + 1] = 0.93; col[i * 4 + 2] = 0.78; col[i * 4 + 3] = i < 4 ? 1 : 0; }
    sg.setAttribute("position", new THREE.BufferAttribute(this.shaftPos, 3)); sg.setAttribute("color", new THREE.BufferAttribute(col, 4));
    sg.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
    this.shaftMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    this.shaft = new THREE.Mesh(sg, this.shaftMat); this.shaft.layers.set(NOINK); this.shaft.frustumCulled = false; this.shaft.renderOrder = 4; R.add(this.shaft);
    // ---- the siren on its pole ----
    const sb = new Batch(), poleM = lam("pole", () => ({ color: "#5a4632" })), ironM = lam("sirenIron", () => ({ color: "#6c6f74" }));
    sb.add(new THREE.CylinderGeometry(0.13, 0.18, 9, 10).translate(SIREN[0], 4.5, SIREN[2]), poleM);
    sb.add(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 14).translate(SIREN[0], 9.05, SIREN[2]), ironM);
    for (const a of [0.6, 0.6 + Math.PI]) {
      const horn = new THREE.CylinderGeometry(0.55, 0.12, 1.3, 14, 1, true); horn.rotateZ(Math.PI / 2);
      sb.add(horn, ironM, new THREE.Matrix4().makeRotationY(a).setPosition(SIREN[0] + Math.cos(a) * 0.9, 9.05, SIREN[2] - Math.sin(a) * 0.9));
    }
    sb.add(new THREE.ConeGeometry(0.55, 0.4, 14).translate(SIREN[0], 9.55, SIREN[2]), ironM);
    sb.build(R);
    // ---- planes, contrails, bomb ----
    const sil = silver();
    for (let k = 0; k < 3; k++) {
      const p = makeB29(sil); this.planes.push(p); R.add(p);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 3.2, 700, 10, 1, true).rotateZ(Math.PI / 2).translate(-350, 0, 0),
        new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.42, depthWrite: false, fog: false }));
      tr.layers.set(NOINK); this.trails.push(tr); R.add(tr);
    }
    this.bomb = makeBomb(); R.add(this.bomb);
    // ---- fireball + mushroom cloud ----
    this.fireball = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8, 6), fog: false }));
    this.fireball.layers.set(NOINK); R.add(this.fireball);
    this.fireHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(4, 3.4, 2.4), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    this.fireHalo.layers.set(NOINK); R.add(this.fireHalo);
    const pg = new THREE.SphereGeometry(1, 22, 16), r = rng(806);
    const capM = lam("cloudCap", () => ({ color: "#e6c9ae" })), stemM = lam("cloudStem", () => ({ color: "#c9a68e" })), dustM = lam("cloudDust", () => ({ color: "#a88e7c" }));
    this.fireMat = twoTone(new THREE.MeshLambertMaterial({ color: "#d99a6a", emissive: new THREE.Color("#ff7a2a"), emissiveIntensity: 0 }), 0.3);
    const add = (kind: Puff["kind"], n: number, mat: THREE.Material) => {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(pg, mat); m.castShadow = false; m.receiveShadow = false; this.cloud.add(m);
        this.puffs.push({ m, kind, a: (i / n) * Math.PI * 2 + r() * 0.4, r: r(), h: i / Math.max(1, n - 1), s: 0.8 + 0.4 * r() });
      }
    };
    add("stem", 16, stemM); add("cap", 26, capM); add("top", 12, capM); add("ring", 18, this.fireMat); add("skirt", 26, dustM);
    this.cloud.position.set(HYPO[0], 0, HYPO[2]); R.add(this.cloud);

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
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = s.light === "room" ? 0.1 : 0.2; cam.far = 2600; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden" || s.light === "dusk") Rr = Math.max(Rr, 30);
    if (id === 2 || id === 15 || id === 16 || id === 21) Rr = 260;
    const sc0 = id === 15 || id === 16 || id === 21 ? V(HYPO[0], 0, HYPO[2]) : focus;
    this.sun.position.copy(sc0).addScaledVector(sunDir, 420); this.sun.target.position.copy(sc0);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 900; sc.updateProjectionMatrix();
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
    untone(L.fog, this.fog.color);
    const FOGS: Record<number, [number, number]> = { 2: [90, 900], 8: [500, 2400], 12: [500, 2400], 15: [260, 1500], 16: [200, 1100], 21: [200, 1300], 22: [150, 1300] };
    const fo = FOGS[id] ?? [L.fogNear, L.fogFar];
    this.fog.near = fo[0]; this.fog.far = fo[1];
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden" || s.light === "dusk";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 1200);
      this.sunDisc.scale.setScalar(2 * 1200 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 1200 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.1);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    const Wu = this.WU, wc = K.water;
    untone(wc.near, Wu.wNearC.value); untone(wc.mid, Wu.wMidC.value); untone(wc.far, Wu.wFarC.value);
    untone(wc.crest, Wu.wCrest.value); untone(wc.trough, Wu.wTrough.value); untone(wc.glint, Wu.wGlint.value);
    Wu.wShade.value.set(...wc.shade); Wu.wTime.value = t;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- set pieces ----
    this.poseRoom(id, f, s.light === "room", sunDir);
    this.posePlanes(id, f);
    this.poseBlast(id, f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, null, { pos: cam.position, right });
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

  private poseRoom(id: number, f: number, room: boolean, sunDir: THREE.Vector3) {
    const open = id < 11 ? 0 : id === 11 ? shojiOpen(f) : 1;
    const pw = (WIN.x1 - WIN.x0) / 2;
    this.shojiB.position.x = WIN.x1 - pw / 2 - open * pw * 0.98;
    // paper brightness: backlit from inside the room, flat-lit from the street; blazes on "One"
    const glow = id === 20 ? windowGlow(f) : 0;
    this.shojiMat.color.setScalar((room ? 1.0 : 0.82) + 7 * glow);
    this.glowCard.visible = id === 20 && glow > 0.01;
    (this.glowCard.material as THREE.MeshBasicMaterial).color.setScalar(1 + 9 * glow);
    // the grandpa holds the paper in the breakfast shots; it lies on the table otherwise
    this.news.visible = !(id === 3 || id === 5 || id === 6);
    this.cups[1].visible = !(id === 10 || id === 14 || id === 18); // grandpa's cup is in his hand
    this.cups[0].visible = !(id === 3 || id === 5 || id === 6 || id === 13 || id === 14 || id === 18);
    // light shaft from the window down into the room, along the sun
    this.shaft.visible = room;
    if (room) {
      const d = sunDir.clone().negate(), L = Math.min(5, (WIN.y1 - ROOM.fy) / Math.max(0.15, -d.y));
      const corners: V3[] = [[WIN.x0, WIN.y0, ROOM.z0], [WIN.x1, WIN.y0, ROOM.z0], [WIN.x1, WIN.y1, ROOM.z0], [WIN.x0, WIN.y1, ROOM.z0]];
      corners.forEach((p, i) => {
        this.shaftPos.set(p, i * 3);
        this.shaftPos.set([p[0] + d.x * L, Math.max(ROOM.fy, p[1] + d.y * L), p[2] + Math.max(0.5, d.z * L)], (i + 4) * 3);
      });
      this.shaft.geometry.attributes.position.needsUpdate = true;
      this.shaftMat.opacity = (id === 5 ? 0.2 : 0.1) + 0.5 * glow;
    }
  }

  private posePlanes(id: number, f: number) {
    const show = id === 8 || id === 12 || id === 15 || id === 16;
    this.planes.forEach((p, k) => {
      p.visible = show && !(id === 16 && k > 0);
      const [x, y, z] = planeAt(f, k);
      p.position.set(x, y, z); p.rotation.set(0.04 * Math.sin(f * 0.02 + k), 0, 0.03 * Math.sin(f * 0.017 + k * 2));
      this.trails[k].visible = (id === 8 || id === 12);
      this.trails[k].position.set(x - 20, y + 0.4, z);
    });
    const b = bombAt(f);
    this.bomb.visible = !!b && (id === 15 || id === 16);
    if (b) {
      const tt = (f - (WORD.slips - 2)) / FPS;
      this.bomb.position.set(...b); this.bomb.rotation.set(0, 0, -Math.min(1.35, 0.25 * tt + 0.08 * tt * tt));
      this.bomb.scale.setScalar(1);
    }
  }

  private poseBlast(id: number, f: number) {
    const tc = (f - FLASH_F) / FPS;
    const fb = id === 21 && tc >= 0;
    this.fireball.visible = this.fireHalo.visible = fb;
    if (fb) {
      const rad = 75 * (1 - Math.exp(-tc / 0.22));
      this.fireball.position.set(HYPO[0], BURST_Y, HYPO[2]); this.fireball.scale.setScalar(Math.max(0.5, rad));
      this.fireHalo.position.copy(this.fireball.position); this.fireHalo.scale.setScalar(rad * 9 + 60);
    }
    this.cloud.visible = id === 22;
    if (!this.cloud.visible) return;
    const T = Math.max(0.5, tc), cy = capY(T), cr = capR(T), stemR = 9 + 9 * (1 - Math.exp(-T / 3)), swirl = T * 0.35;
    this.fireMat.emissiveIntensity = 1.6 * Math.exp(-T / 4.5);
    for (const p of this.puffs) {
      let x = 0, y = 0, z = 0, rs = 1;
      if (p.kind === "stem") { const yy = p.h * (cy - 0.2 * cr); const a = p.a + swirl; x = Math.cos(a) * stemR * 0.35 * p.r; z = Math.sin(a) * stemR * 0.35 * p.r; y = yy; rs = stemR * (0.85 + 0.35 * p.s) * (1 - 0.3 * p.h); }
      else if (p.kind === "cap") { const a = p.a + swirl * 0.6; x = Math.cos(a) * cr * 0.72; z = Math.sin(a) * cr * 0.72; y = cy + cr * 0.06 * Math.sin(p.a * 3); rs = cr * 0.36 * p.s; }
      else if (p.kind === "top") { const a = p.a - swirl * 0.4; x = Math.cos(a) * cr * 0.34 * (0.5 + p.r); z = Math.sin(a) * cr * 0.34 * (0.5 + p.r); y = cy + cr * (0.32 + 0.12 * p.r); rs = cr * 0.42 * p.s; }
      else if (p.kind === "ring") { const a = p.a + swirl; x = Math.cos(a) * cr * 0.55; z = Math.sin(a) * cr * 0.55; y = cy - cr * 0.22; rs = cr * 0.24 * p.s; }
      else { const R2 = 45 + 110 * (1 - Math.exp(-T / 3.5)); x = Math.cos(p.a) * R2 * (0.8 + 0.25 * p.r); z = Math.sin(p.a) * R2 * (0.8 + 0.25 * p.r); y = 4 + 6 * p.r; rs = (10 + 10 * p.s) * (0.6 + 0.4 * (1 - Math.exp(-T / 2))); }
      p.m.position.set(x, y, z); p.m.scale.set(rs, rs * 0.86, rs);
    }
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
