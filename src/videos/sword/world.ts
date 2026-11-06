// The whole film as one three.js scene: sky + sun rig of the bridge short, the five sets (sets.ts), the cast as real
// 3D rigs (rig.ts) and the props (props.ts). update(id, f, camera) poses everything for shot `id` at frame f (pure
// function of id + f); the acting lives in stage.ts.
import * as THREE from "three";
import { V } from "./build";
import { ctex, cloudHD } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, untone } from "./shade";
import { NOINK } from "./ink";
import { buildYard, buildAztec, Lab, Nano, Diagram, whetMat, STONE_X, WORK_H } from "./sets";
import { Character, NARRATOR, SMITH, POLISHER, AZTEC } from "./rig";
import { Katana, Tomato, Mat, Hair, Paper, Macuahuitl, SpritePool, obsidianCore, obsidianFlake, hammer, mk, lamC } from "./props";
import { SHOTS, camAt, ShotDef, Place, POLISHER_AT, STONES_Z, ENGAWA_Y, TABLE, MAT } from "./story";
import { stage } from "./stage";

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

export type Objs = {
  N: Character; smith: Character; polisher: Character; aztec: Character;
  kat: Katana; kat2: Katana; blade: Katana; // narrator's katana, forge blade / smith's finished katana, polisher's bare blade
  tomato: Tomato; mat: Mat; hair: Hair; paper: Paper; mac: Macuahuitl;
  core: THREE.Mesh; flake: THREE.Mesh; hammerStone: THREE.Mesh; hammer: THREE.Group; tongs: THREE.Group;
  workStone: THREE.Mesh; nano: Nano; diag: Diagram; lab: Lab; fx: SpritePool;
};

export class World {
  root = new THREE.Group();
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.PointLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private places: Record<Place, THREE.Object3D[]>;
  o: Objs;

  constructor() {
    const R = this.root;
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
    this.sky.renderOrder = -2; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunDisc.frustumCulled = false; this.sunDisc.layers.set(NOINK); R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.PointLight("#ff9a4a", 0, 6, 2); // forge glow
    R.add(this.hemi, this.sun, this.sun.target, this.fill);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 140 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 110 + (i % 4) * 34, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }
    // ---- sets ----
    const yard = buildYard(R), aztec = buildAztec(R);
    const lab = new Lab(R), nano = new Nano(R), diag = new Diagram(R);
    this.places = { yard: [yard], aztec: [aztec], lab: [lab.group], nano: [nano.group], diag: [diag.group] };
    // ---- cast + props ----
    const add = <T extends THREE.Object3D>(o: T) => { R.add(o); return o; };
    const N = new Character(NARRATOR), smith = new Character(SMITH), polisher = new Character(POLISHER), aztecC = new Character(AZTEC);
    for (const c of [N, smith, polisher, aztecC]) R.add(c.root);
    const kat = new Katana(true), kat2 = new Katana(true), blade = new Katana(false);
    for (const k of [kat, kat2, blade]) R.add(k.group);
    const tomato = new Tomato(); add(tomato.group); tomato.group.position.set(TABLE[0], 0.83 + 0.056, TABLE[2]);
    const mat = new Mat(); add(mat.group); mat.group.position.set(...MAT);
    const hair = new Hair(); add(hair.group);
    const paper = new Paper(); add(paper.mesh);
    const mac = new Macuahuitl(); add(mac.group);
    const core = add(obsidianCore()), flake = add(obsidianFlake());
    const hammerStone = add(mk(new THREE.IcosahedronGeometry(0.045, 1), lamC("#a39a8c", 0.3)));
    const hm = add(hammer());
    const tongs = add(new THREE.Group());
    for (const s of [-1, 1]) { const t = mk(new THREE.CylinderGeometry(0.007, 0.007, 0.5, 6), lamC("#3a3a40")); t.position.set(s * 0.012, 0.25, 0); t.rotation.z = s * 0.03; tongs.add(t); }
    const workStone = add(mk(new THREE.BoxGeometry(0.22, 0.05, 0.08), whetMat(0)));
    workStone.position.set(POLISHER_AT[0], ENGAWA_Y + WORK_H + 0.025, STONES_Z);
    void STONE_X;
    this.o = { N, smith, polisher, aztec: aztecC, kat, kat2, blade, tomato, mat, hair, paper, mac, core, flake, hammerStone, hammer: hm, tongs, workStone, nano, diag, lab, fx: new SpritePool(R) };
  }

  /** sun for a shot: camera-relative azimuth (preset or shot override), frozen per shot */
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

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    const close = s.place === "lab" || s.place === "diag" || id === 8 || id === 10;
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; void close; // one near plane for every shot: the lens effect keeps the near value it first saw cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- places ----
    for (const [k, list] of Object.entries(this.places)) for (const o of list) o.visible = k === s.place;
    const outdoor = s.place === "yard" || s.place === "aztec";
    this.sky.visible = outdoor;
    for (const m of this.clouds) m.visible = outdoor;
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.2 + 4, 6, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 10; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias * 3; this.sun.shadow.normalBias = Math.max(0.03, L.normalBias * (Rr / 12) * 2.5);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    if (outdoor) { untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; }
    else { this.fog.near = 1e5; this.fog.far = 2e5; }
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden" && outdoor;
    this.sunDisc.visible = showSun;
    if (showSun) { this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7))); }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.position.x = cam.position.x + Math.cos((i / 10) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.position.z = cam.position.z + Math.sin((i / 10) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- acting ----
    this.o.fx.begin();
    stage(id, f, this.o, cam, this.fill);
    this.o.fx.end();
    return focus;
  }
}
