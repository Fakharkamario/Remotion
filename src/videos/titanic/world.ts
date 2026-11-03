// The whole night as one three.js scene: starry moonless sky, the North Atlantic (the river shader of the bridge
// short, recoloured), RMS Titanic (black hull with lit portholes, white superstructure, four buff funnels, boats on
// davits) built in two halves that pose from story.ts sinkAt/halvesAt, the iceberg, lifeboats on the sea, and two small
// interior sets (a first-class cabin, a corridor that floods). Cast + effects come from cast.ts.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { staticFile } from "remotion";
import { V, lam, Kit, boxGeo, Batch, quad } from "./build";
import { ctex, waterNear, waterFar, rng, planksHD } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, HOST_IMG } from "./cast";
import {
  FPS, SHOTS, camAt, ShotDef, HULL_X0, HULL_X1, BEAM, HULL_TOP, KEEL, DECK, BREAK_X, FUNNELS, BOATS, BOAT_Z, LAUNCH,
  sinkAt, halvesAt, lampsAt, iceX, ICE_Z, CABIN, HALL, LOWER, SEA_BOATS, smooth, clamp01, Pose, Frame,
} from "./story";

// ---------------- assets: the host's cut-outs ----------------
const HOSTS = ["front", "three", "smile", "shock", "think", "laugh"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    kitP = Promise.all(HOSTS.map((n) => new Promise<void>((res) => {
      const im = new Image();
      im.onload = () => { HOST_IMG[n] = im; res(); };
      im.onerror = () => res();
      im.src = staticFile(`titanic/host_${n}.png`);
    }))).then(() => ({} as Kit));
  }
  return kitP;
};

// ---------------- painted textures ----------------
/** hull side, 10 m per tile along u, keel..deck along v: red below the waterline, black above, white sheer strake,
 *  two rows of portholes (rims only; the glass is the emissive map) */
const HULL_V = (y: number) => (y - KEEL) / (HULL_TOP + 2.5 - KEEL);
const hullTex = () => ctex("hullTex", 1024, 1024, (g, r) => {
  const Y = (y: number) => (1 - HULL_V(y)) * 1024;
  g.fillStyle = "#8c2e24"; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = "#17171c"; g.fillRect(0, 0, 1024, Y(-0.4));
  g.fillStyle = "#f0ece2"; g.fillRect(0, 0, 1024, Y(HULL_TOP - 1.0));
  g.fillStyle = "#c9a24a"; g.fillRect(0, Y(HULL_TOP - 1.0) - 3, 1024, 6);
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "60,60,70" : "0,0,0"},0.12)`; g.fillRect(r() * 1024, Y(HULL_TOP - 1.2), 2 + r() * 3, Y(-0.4) - Y(HULL_TOP - 1.2)); } // plate seams
  for (const y of [3.0, 6.2]) for (let k = 0; k < 9; k++) {
    const x = (k + 0.5 + (y > 4 ? 0.3 : 0)) * (1024 / 9);
    g.beginPath(); g.arc(x, Y(y), 15, 0, Math.PI * 2); g.fillStyle = "#3a3a42"; g.fill();
    g.beginPath(); g.arc(x, Y(y), 10, 0, Math.PI * 2); g.fillStyle = "#e9c27a"; g.fill();
  }
});
const hullGlow = () => ctex("hullGlow", 1024, 1024, (g) => {
  const Y = (y: number) => (1 - HULL_V(y)) * 1024;
  g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 1024);
  for (const y of [3.0, 6.2]) for (let k = 0; k < 9; k++) {
    if ((k * 7 + (y > 4 ? 3 : 0)) % 5 === 0) continue; // some cabins dark
    const x = (k + 0.5 + (y > 4 ? 0.3 : 0)) * (1024 / 9);
    g.beginPath(); g.arc(x, Y(y), 10, 0, Math.PI * 2); g.fillStyle = "#ffd28a"; g.fill();
  }
});
/** white superstructure wall with rows of windows, 12 m x 6 m per tile */
const wallTex = (key: string, rows: number[], glow: boolean) => ctex(key + glow, 1024, 512, (g) => {
  g.fillStyle = glow ? "#000" : "#ece6d8"; g.fillRect(0, 0, 1024, 512);
  if (!glow) { g.fillStyle = "#d8d0bf"; for (let x = 0; x < 1024; x += 128) g.fillRect(x, 0, 3, 512); g.fillStyle = "#c9c0ad"; g.fillRect(0, 500, 1024, 12); }
  rows.forEach((ry, j) => {
    for (let k = 0; k < 12; k++) {
      const x = k * (1024 / 12) + 18, w = 1024 / 12 - 36;
      if (glow) { if ((k * 5 + j * 3) % 7 === 0) continue; g.fillStyle = "#ffd690"; g.fillRect(x + 4, ry + 4, w - 8, 70 - 8); }
      else { g.fillStyle = "#3a3640"; g.fillRect(x, ry, w, 70); g.fillStyle = "#e9c27a"; g.fillRect(x + 4, ry + 4, w - 8, 70 - 8); g.fillStyle = "#3a3640"; g.fillRect(x + w / 2 - 2, ry, 4, 70); }
    }
  });
});
const funnelTex = () => ctex("funnelTex", 512, 512, (g) => {
  g.fillStyle = "#d89b45"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#b9822f"; for (let y = 60; y < 512; y += 90) g.fillRect(0, y, 512, 5);
  g.fillStyle = "#c48a38"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 3, 512);
});
const iceTex = () => ctex("iceTex", 512, 512, (g, r) => {
  g.fillStyle = "#e6eef8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "170,200,235" : "255,255,255"},${0.2 + 0.3 * r()})`; g.fillRect(r() * 512, r() * 512, 10 + r() * 80, 4 + r() * 20); }
});
/** cabin / corridor panelling: cream panels with darker mouldings, a dado rail */
const panelTex = (key: string, base: string, line: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = line; g.lineWidth = 6;
  for (let x = 0; x < 512; x += 128) { g.strokeRect(x + 16, 30, 96, 230); g.strokeRect(x + 16, 320, 96, 160); }
  g.fillStyle = line; g.fillRect(0, 285, 512, 14); g.fillRect(0, 498, 512, 14);
});
const carpetTex = () => ctex("carpet", 512, 512, (g) => {
  g.fillStyle = "#8a2a2e"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#a33a36";
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x + 32, y + 12); g.lineTo(x + 52, y + 32); g.lineTo(x + 32, y + 52); g.lineTo(x + 12, y + 32); g.closePath(); g.fill(); }
  g.fillStyle = "#c9a24a"; for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) g.fillRect(x + 30, y + 30, 4, 4);
});
const discTex = () => ctex("starDot", 64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

// ---------------- emissive (lamps) bookkeeping ----------------
type Glow = { m: THREE.MeshLambertMaterial; base: THREE.Color; ship: boolean };
const GLOWS: Glow[] = [];
const glowMat = (key: string, make: () => THREE.MeshLambertMaterialParameters, col: string, k: number, ship = true) => {
  const m = lam(key, make);
  if (!GLOWS.find((g) => g.m === m)) { m.emissive = new THREE.Color(col).multiplyScalar(k); GLOWS.push({ m, base: m.emissive.clone(), ship }); }
  return m;
};

// ---------------- ship geometry ----------------
const halfW = (x: number) => {
  const W = BEAM / 2;
  if (x > 55) return Math.max(0.12, W * Math.pow(Math.max(0, 1 - Math.pow((x - 55) / (HULL_X1 - 55), 1.7)), 0.8));
  if (x < -84) return Math.max(0.6, W * Math.sqrt(Math.max(0, 1 - ((-84 - x) / (-84 - HULL_X0)) ** 2)));
  return W;
};
const topAt = (x: number) => HULL_TOP + 2.5 * smooth((x - 70) / 1.5) + 2.0 * smooth((-86 - x) / 1.5);
const prof = (y: number) => (y > -4 ? 1 : 1 - 0.42 * ((-4 - y) / (-4 - KEEL)) ** 2);
/** hull between x0 and x1 (both sides + bottom), plus its deck and the end cap(s) */
const hullPart = (x0: number, x1: number, capAt: number | null) => {
  const xs: number[] = []; for (let x = x0; x < x1; x += 1.5) xs.push(x); xs.push(x1);
  const ys = [0, 0.15, 0.35, 0.55, 0.7, 0.8, 0.88, 0.94, 1]; // fraction from deck (0) to keel (1)
  const side: number[] = [], uv: number[] = [], idx: number[] = [];
  const ring = (x: number) => {
    const top = topAt(x), w = halfW(x), pts: [number, number][] = [];
    for (const k of ys) { const y = top + (KEEL - top) * k; pts.push([w * prof(y) * (k === 1 ? 0.55 : 1), y]); }
    const out: [number, number][] = []; // starboard top -> keel -> port top
    for (const [z, y] of pts) out.push([z, y]);
    for (let i = pts.length - 1; i >= 0; i--) out.push([-pts[i][0], pts[i][1]]);
    return out;
  };
  const R = ring(0).length;
  xs.forEach((x) => ring(x).forEach(([z, y]) => { side.push(x, y, z); uv.push(x / 10, HULL_V(y)); }));
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < R - 1; j++) {
    const a = i * R + j, b = a + 1, c = a + R, d = c + 1;
    idx.push(a, b, c, b, d, c); // outward
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(side, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // deck (strip between the two top edges)
  const dp: number[] = [], du: number[] = [], di: number[] = [];
  xs.forEach((x, i) => { const w = halfW(x), y = topAt(x); dp.push(x, y, w, x, y, -w); du.push(x / 8, 0, x / 8, w / 4); if (i) { const a = (i - 1) * 2; di.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute("uv", new THREE.Float32BufferAttribute(du, 2));
  dg.setIndex(di); dg.computeVertexNormals();
  let cap: THREE.BufferGeometry | null = null;
  if (capAt !== null) {
    const rr = ring(capAt), cp: number[] = [capAt, (topAt(capAt) + KEEL) / 2, 0], ci: number[] = [];
    rr.forEach(([z, y]) => cp.push(capAt, y, z));
    for (let j = 1; j < rr.length; j++) ci.push(0, j, j + 1);
    ci.push(0, rr.length, 1);
    cap = new THREE.BufferGeometry(); cap.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cap.setIndex(ci); cap.computeVertexNormals();
  }
  return { g, dg, cap };
};

/** lifeboat (rim at y = 0, 8.5 m long, ~1 m deep): white outside, wood inside, three thwarts */
const BOAT_GEO = (() => { const g = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(4.25, 1.0, 1.15); return g; })();
export const makeBoat = () => {
  const o = new THREE.Group();
  const out = new THREE.Mesh(BOAT_GEO, lam("boatOut", () => ({ color: "#f2efe6" })));
  const inn = new THREE.Mesh(BOAT_GEO, lam("boatIn", () => ({ color: "#b07a48", side: THREE.BackSide })));
  inn.scale.setScalar(0.985);
  const b = new Batch(), wood = lam("boatWood", () => ({ color: "#c08a52" })), rim = lam("boatRim", () => ({ color: "#8a5a36" }));
  for (const x of [-2.4, 0, 2.4]) b.add(boxGeo(V(x - 0.18, -0.42, -0.98), V(x + 0.18, -0.32, 0.98)), wood);
  b.add(boxGeo(V(-3.6, -0.86, -0.6), V(3.6, -0.8, 0.6)), wood);
  const rg = new THREE.TorusGeometry(1, 0.05, 6, 40); rg.rotateX(Math.PI / 2); rg.scale(4.25, 1, 1.15);
  b.add(rg, rim);
  const bg = new THREE.Group(); b.build(bg);
  o.add(out, inn, bg);
  o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  return o;
};

type Half = { g: THREE.Group; boats: { o: THREE.Object3D; i: number }[] };
const buildShip = (parent: THREE.Group) => {
  const halves: Half[] = [{ g: new THREE.Group(), boats: [] }, { g: new THREE.Group(), boats: [] }]; // 0 = front, 1 = back
  const half = (x: number) => halves[x >= BREAK_X ? 0 : 1];
  const hullM = glowMat("hullM", () => ({ map: hullTex(), emissiveMap: hullGlow() }), "#ffc070", 2.4);
  const deckM = lam("deckM", () => ({ map: planksHD(), color: "#d8c4a0" }));
  const capM = lam("capM", () => ({ color: "#2a1c1a", side: THREE.DoubleSide }));
  for (const [x0, x1, cap] of [[BREAK_X, HULL_X1, BREAK_X], [HULL_X0, BREAK_X, BREAK_X]] as [number, number, number][]) {
    const { g, dg, cap: cg } = hullPart(x0, x1, cap);
    const h = half((x0 + x1) / 2).g;
    const m = new THREE.Mesh(g, hullM), d = new THREE.Mesh(dg, deckM);
    h.add(m, d);
    if (cg) h.add(new THREE.Mesh(cg, capM));
  }
  // superstructure (two decks of windows) and the boat deck on top
  const supM = glowMat("supM", () => ({ map: wallTex("supWall", [90, 330], false), emissiveMap: wallTex("supWall", [90, 330], true) }), "#ffc070", 2.0);
  const supEnd = lam("supEnd", () => ({ color: "#ece6d8" }));
  const houseM = glowMat("houseM", () => ({ map: wallTex("houseWall", [200], false), emissiveMap: wallTex("houseWall", [200], true) }), "#ffc070", 1.8);
  const rail = lam("rail", () => ({ color: "#f2eee4" })), dark = lam("dark", () => ({ color: "#1d1b22" }));
  const funnelM = lam("funnelM", () => ({ map: funnelTex() })), funnelTop = lam("funnelTop", () => ({ color: "#17161b" }));
  const lampM = glowMat("lampM", () => ({ color: "#fff2d0" }), "#ffd890", 3.0);
  const B = [new Batch(), new Batch()];
  const bat = (x: number) => B[x >= BREAK_X ? 0 : 1];
  const span = (x0: number, x1: number, f: (a: number, b: number, bt: Batch) => void) => {
    // split anything that crosses the break between the two halves
    if (x0 < BREAK_X && x1 > BREAK_X) { f(x0, BREAK_X, B[1]); f(BREAK_X, x1, B[0]); } else f(x0, x1, bat((x0 + x1) / 2));
  };
  // superstructure walls with windows (sides textured per 12 m), ends plain
  span(-66, 58, (a, b, bt) => {
    for (const s of [1, -1]) {
      const z = s * 9;
      const q = s > 0 ? quad(V(a, 10, z), V(b, 10, z), V(b, DECK, z), V(a, DECK, z), (b - a) / 12, 1) : quad(V(b, 10, z), V(a, 10, z), V(a, DECK, z), V(b, DECK, z), (b - a) / 12, 1);
      bt.add(q, supM);
    }
  });
  B[0].add(quad(V(58, 10, 9), V(58, 10, -9), V(58, DECK, -9), V(58, DECK, 9)), supEnd);
  B[1].add(quad(V(-66, 10, -9), V(-66, 10, 9), V(-66, DECK, 9), V(-66, DECK, -9)), supEnd);
  // boat deck floor
  span(-68, 60, (a, b, bt) => bt.add(boxGeo(V(a, DECK - 0.25, -9.6), V(b, DECK, 9.6), 6), deckM));
  // deck houses on the boat deck (+ the bridge front)
  for (const [a, b] of [[44, 56], [20, 32], [-20, -2], [-64, -36]] as [number, number][]) span(a, b, (x0, x1, bt) => {
    bt.add(quad(V(x0, DECK, 5), V(x1, DECK, 5), V(x1, DECK + 2.9, 5), V(x0, DECK + 2.9, 5), (x1 - x0) / 12, 1), houseM);
    bt.add(quad(V(x1, DECK, -5), V(x0, DECK, -5), V(x0, DECK + 2.9, -5), V(x1, DECK + 2.9, -5), (x1 - x0) / 12, 1), houseM);
    bt.add(boxGeo(V(x0, DECK, -5), V(x1, DECK + 2.9, 5)), supEnd); // ends + roof (sides are covered by the windowed quads)
    bt.add(boxGeo(V(x0 - 0.15, DECK + 2.9, -5.15), V(x1 + 0.15, DECK + 3.1, 5.15)), rail);
  });
  B[0].add(boxGeo(V(55.6, DECK, -11.2), V(56.4, DECK + 1.2, 11.2)), rail); // bridge wings
  B[0].add(boxGeo(V(52.5, DECK + 2.9, -3), V(56.5, DECK + 4.4, 3)), supEnd); // wheelhouse
  // rails along the boat deck edge, posts every 1.6 m
  span(-68, 60, (a, b, bt) => {
    for (const s of [1, -1]) {
      bt.add(boxGeo(V(a, DECK + 1.0, s * 9.45 - 0.05), V(b, DECK + 1.1, s * 9.45 + 0.05)), rail);
      bt.add(boxGeo(V(a, DECK + 0.5, s * 9.45 - 0.03), V(b, DECK + 0.56, s * 9.45 + 0.03)), rail);
      for (let x = Math.ceil(a / 1.6) * 1.6; x < b; x += 1.6) bt.add(boxGeo(V(x - 0.04, DECK, s * 9.45 - 0.04), V(x + 0.04, DECK + 1.05, s * 9.45 + 0.04)), rail);
    }
  });
  // forecastle / poop rails
  for (const s of [1, -1]) {
    B[0].add(boxGeo(V(70, 12.5 + 0.9, s * 8.8 - 0.05), V(95, 12.5 + 1.0, s * 6 + 0.05 * s)), rail);
    B[1].add(boxGeo(V(-98, 12 + 0.9, s * 6 - 0.05), V(-86, 12 + 1.0, s * 6 + 0.05)), rail);
  }
  // lamps along the deck houses
  for (const [a, b] of [[44, 56], [20, 32], [-20, -2], [-64, -36]] as [number, number][]) for (let x = a + 2; x < b; x += 4) for (const s of [1, -1])
    bat(x).add(boxGeo(V(x - 0.14, DECK + 2.2, s * 5.02 - 0.08), V(x + 0.14, DECK + 2.5, s * 5.02 + 0.08)), lampM);
  // davits (one pair per boat)
  for (const [x, s] of BOATS) for (const dx of [-3.4, 3.4]) {
    bat(x).add(boxGeo(V(x + dx - 0.12, DECK, s * 9.0 - 0.12), V(x + dx + 0.12, DECK + 3.4, s * 9.0 + 0.12)), dark);
    bat(x).add(boxGeo(V(x + dx - 0.1, DECK + 3.2, s * 7.2), V(x + dx + 0.1, DECK + 3.4, s * 9.1)).translate(0, 0, s < 0 ? -1.9 * 0 : 0), dark);
  }
  B[0].build(halves[0].g); B[1].build(halves[1].g);
  // funnels (raked aft) and masts
  FUNNELS.forEach((x) => {
    const f = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 22, 32), funnelM); body.position.y = 11; body.scale.z = 0.8;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3.32, 3.32, 4.5, 32), funnelTop); top.position.y = 22 + 2.25; top.scale.z = 0.8;
    f.add(body, top); f.position.set(x, DECK + 1.5, 0); f.rotation.z = 0.085;
    f.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
    half(x).g.add(f);
  });
  for (const [x, y, h] of [[80, 12.5, 44], [-80, 12, 38]] as [number, number, number][]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, h, 10), lam("mast", () => ({ color: "#a8743e" })));
    m.position.set(x, y + h / 2, 0); m.rotation.z = 0.085; m.castShadow = true; half(x).g.add(m);
  }
  // lifeboats in their chocks
  BOATS.forEach(([x, s], i) => {
    const o = makeBoat(); o.position.set(x, DECK + 1.25, s * BOAT_Z);
    half(x).g.add(o); half(x).boats.push({ o, i });
  });
  for (const h of halves) { h.g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } }); parent.add(h.g); }
  return halves;
};

const icebergGeo = () => {
  const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, r = rng(77);
  const bumps = Array.from({ length: 14 }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, 0.1 + 0.25 * r()]);
  for (let i = 0; i < p.count; i++) {
    const v = V(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    let k = 1;
    for (const [bx, by, bz, a] of bumps) k += a * Math.max(0, v.dot(V(bx, by, bz).normalize()) - 0.6) * 2.5;
    const top = v.y > 0 ? 1 + 0.5 * Math.max(0, v.x) * v.y : 1;
    p.setXYZ(i, v.x * k * top, v.y * k, v.z * k);
  }
  const n = g.toNonIndexed(); n.computeVertexNormals(); n.scale(10, 15, 7.5); n.translate(0, 1, 0);
  return n;
};

// ---------------- interiors ----------------
/** inward-facing box room with textured walls; returns the group */
const room = (w: number, d: number, h: number, wallM: THREE.Material, floorM: THREE.Material, ceilM: THREE.Material, tile: number) => {
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, b = new Batch();
  b.add(quad(V(x0, 0, z0), V(x1, 0, z0), V(x1, h, z0), V(x0, h, z0), w / tile, 1), wallM);
  b.add(quad(V(x1, 0, z1), V(x0, 0, z1), V(x0, h, z1), V(x1, h, z1), w / tile, 1), wallM);
  b.add(quad(V(x0, 0, z1), V(x0, 0, z0), V(x0, h, z0), V(x0, h, z1), d / tile, 1), wallM);
  b.add(quad(V(x1, 0, z0), V(x1, 0, z1), V(x1, h, z1), V(x1, h, z0), d / tile, 1), wallM);
  b.add(quad(V(x0, 0, z1), V(x1, 0, z1), V(x1, 0, z0), V(x0, 0, z0), w / 2, d / 2), floorM);
  b.add(quad(V(x0, h, z0), V(x1, h, z0), V(x1, h, z1), V(x0, h, z1), w / 2, d / 2), ceilM);
  const g = new THREE.Group(); b.build(g); return g;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private stars: THREE.Points;
  private fog = new THREE.Fog("#1c2a50", 120, 1100);
  private WU: Record<string, THREE.IUniform>;
  private sea: THREE.Mesh;
  private sunCache = new Map<number, THREE.Vector3>();
  private ship = new THREE.Group(); private halves: Half[];
  private ice: THREE.Mesh;
  private cabin = new THREE.Group(); private hall = new THREE.Group(); private flood: THREE.Mesh;
  private lowerBoat: THREE.Object3D; private ropes: THREE.Mesh[] = [];
  private seaBoats: THREE.Object3D[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  /** shot frame -> world (set per update) */
  frameM = new THREE.Matrix4();

  constructor(_kit: Kit) {
    const R = this.root;
    // ---- sky + stars ----
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
    {
      const r = rng(5), n = 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const y = 0.03 + 0.97 * Math.pow(r(), 0.8), a = r() * Math.PI * 2, h = Math.sqrt(1 - y * y);
        pos.set([Math.cos(a) * h * 1000, y * 1000, Math.sin(a) * h * 1000], i * 3);
        const b = (0.35 + 0.65 * Math.pow(r(), 3)) * (0.5 + 0.5 * Math.min(1, y * 6)), t = r();
        col.set([b * (t < 0.2 ? 0.8 : 1), b * (t < 0.2 ? 0.9 : t > 0.85 ? 0.92 : 1), b * (t > 0.85 ? 0.8 : 1.05)], i * 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const m = new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, map: discTex(), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
      this.stars = new THREE.Points(g, m); this.stars.frustumCulled = false; this.stars.layers.set(NOINK); this.stars.renderOrder = -0.8;
      this.stars.onBeforeRender = (rd) => { const rt = rd.getRenderTarget(); m.size = 4.2 * ((rt ? rt.height : rd.domElement.height) / 1920); };
      R.add(this.stars);
    }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 0.5);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.0);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);

    // ---- the sea ----
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
    waterM.customProgramCacheKey = () => "sea1";
    const wg = new THREE.PlaneGeometry(5000, 5000); wg.rotateX(-Math.PI / 2);
    this.sea = new THREE.Mesh(wg, waterM); this.sea.receiveShadow = true; R.add(this.sea);

    // ---- ship, iceberg, boats ----
    R.add(this.ship);
    this.halves = buildShip(this.ship);
    this.ice = new THREE.Mesh(icebergGeo(), lam("ice", () => ({ map: iceTex(), color: "#ffffff" })));
    this.ice.castShadow = true; this.ice.receiveShadow = true; R.add(this.ice);
    this.lowerBoat = makeBoat(); R.add(this.lowerBoat);
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), lam("rope", () => ({ color: "#d8c8a0" }))); this.ropes.push(m); R.add(m); }
    for (const [x, z, yaw] of SEA_BOATS) { const o = makeBoat(); o.position.set(x, 0.55, z); o.rotation.y = yaw; this.seaBoats.push(o); R.add(o); }

    // ---- cabin ----
    {
      const wallM = lam("cabinWall", () => ({ map: panelTex("cabinPanel", "#efe2c4", "#c9b08a") }));
      const floorM = lam("carpet", () => ({ map: carpetTex() })), ceilM = lam("ceil", () => ({ color: "#f4ecd8" }));
      const r = room(4.4, 3.2, 2.5, wallM, floorM, ceilM, 2.2); this.cabin.add(r);
      const b = new Batch(), wood = lam("darkWood", () => ({ color: "#6a3e26" })), sheet = lam("sheet", () => ({ color: "#f6f2ea" })), blanket = lam("blanket", () => ({ color: "#3f6f8a" }));
      b.add(boxGeo(V(-2.15, 0, -1.58), V(0.05, 0.42, -0.5)), wood);       // bed frame
      b.add(boxGeo(V(-2.15, 0, -1.58), V(-2.0, 1.05, -0.5)), wood);       // headboard
      b.add(boxGeo(V(-0.05, 0, -1.58), V(0.08, 0.7, -0.5)), wood);        // footboard
      b.add(boxGeo(V(-2.0, 0.42, -1.55), V(-0.05, 0.6, -0.53)), sheet);   // mattress
      b.add(boxGeo(V(-1.98, 0.6, -1.45), V(-1.55, 0.74, -0.65)), sheet);  // pillow
      b.add(boxGeo(V(-1.45, 0.6, -1.56), V(-0.03, 0.84, -0.72)), blanket);  // duvet behind the sleeper card
      b.add(boxGeo(V(-1.0, 0.6, -0.6), V(-0.03, 1.0, -0.5)), blanket);   // its fold over the legs
      b.add(boxGeo(V(1.0, 0, -1.58), V(1.9, 0.85, -1.1)), wood);          // washstand
      b.add(boxGeo(V(1.9, 0, -0.5), V(2.18, 2.1, 0.6)), lam("door", () => ({ color: "#7a4a2c" }))); // door
      b.build(this.cabin);
      const port = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), lam("portGlass", () => ({ color: "#0c1a36" })));
      port.position.set(0.55, 1.55, -1.585); this.cabin.add(port);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 32), lam("brass", () => ({ color: "#c9a24a" })));
      ring.position.copy(port.position); this.cabin.add(ring);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), glowMat("cabinLamp", () => ({ color: "#fff2d0" }), "#ffd890", 3.5, false));
      lamp.position.set(1.45, 1.95, -1.48); this.cabin.add(lamp);
      this.cabin.position.set(...CABIN); R.add(this.cabin);
    }
    // ---- corridor ----
    {
      const wallM = lam("hallWall", () => ({ map: panelTex("hallPanel", "#f2ede2", "#cfc4ad") }));
      const floorM = lam("carpet", () => ({ map: carpetTex() })), ceilM = lam("ceil", () => ({ color: "#f4ecd8" }));
      const r = room(32, 2.2, 2.45, wallM, floorM, ceilM, 2.0); this.hall.add(r);
      const b = new Batch(), door = lam("door", () => ({ color: "#7a4a2c" })), knob = lam("brass", () => ({ color: "#c9a24a" }));
      const lampM = glowMat("hallLamp", () => ({ color: "#fff2d0" }), "#ffd890", 3.2, false);
      for (let x = -14.5; x < 15; x += 3.2) for (const s of [1, -1]) {
        b.add(boxGeo(V(x - 0.45, 0, s * 1.1 - 0.04), V(x + 0.45, 2.05, s * 1.1 + 0.04)), door);
        b.add(boxGeo(V(x + 0.28, 1.0, s * 1.06 - 0.03), V(x + 0.36, 1.08, s * 1.06 + 0.03)), knob);
      }
      for (let x = -15; x < 16; x += 3.2) b.add(boxGeo(V(x - 0.2, 2.38, -0.2), V(x + 0.2, 2.45, 0.2)), lampM);
      b.build(this.hall);
      this.hall.position.set(...HALL); R.add(this.hall);
      const rip = ctex("floodRip", 512, 512, (g, r) => {
        g.fillStyle = "#4a9ab0"; g.fillRect(0, 0, 512, 512);
        g.lineCap = "round";
        for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512, w = 30 + r() * 90; g.strokeStyle = r() < 0.6 ? "#bfe9f2" : "#2a6a82"; g.lineWidth = 3 + r() * 4;
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 8, x + w, y); g.stroke(); }
      });
      rip.repeat.set(10, 0.8);
      const fm = new THREE.MeshPhongMaterial({ map: rip, color: "#ffffff", specular: "#cfefff", shininess: 40, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
      this.flood = new THREE.Mesh(new THREE.PlaneGeometry(34, 2.3), twoTone(fm, 0.3));
      this.flood.geometry.rotateX(-Math.PI / 2); R.add(this.flood);
    }
  }

  /** camera-relative key light, frozen per shot */
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

  /** pose matrix for a ship half: pitch about the break point, then sink */
  private static poseM(p: Pose, out: THREE.Matrix4) {
    const a = THREE.MathUtils.degToRad(p.pitch);
    return out.makeTranslation(BREAK_X, p.y, 0).multiply(new THREE.Matrix4().makeRotationZ(a)).multiply(new THREE.Matrix4().makeTranslation(-BREAK_X, 0, 0));
  }
  private frameOf(fr: Frame, f: number, out: THREE.Matrix4) {
    if (fr === "world") return out.identity();
    if (fr === "ship") return World.poseM(sinkAt(f), out);
    const o = fr === "cabin" ? CABIN : HALL, a = THREE.MathUtils.degToRad(sinkAt(f).pitch * (fr === "hall" && f > 700 ? 1 : 1));
    return out.makeTranslation(o[0], o[1], o[2]).multiply(new THREE.Matrix4().makeRotationZ(a));
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L0 = LIGHTS[s.light], dk = s.dark ?? 0;
    const L: LightPreset = { ...L0, lit: L0.lit.map((v) => v * (1 - 0.55 * dk)) as LightPreset["lit"], shade: L0.shade.map((v) => v * (1 - 0.35 * dk)) as LightPreset["shade"],
      charTint: L0.charTint.map((v) => v * (1 - 0.3 * dk)) as LightPreset["charTint"] };
    // ---- ship pose + frame ----
    const hv = halvesAt(f);
    World.poseM(hv.front, this.m4); this.halves[0].g.matrixAutoUpdate = false; this.halves[0].g.matrix.copy(this.m4);
    World.poseM(hv.back, this.m4); this.halves[1].g.matrixAutoUpdate = false; this.halves[1].g.matrix.copy(this.m4);
    this.ship.updateMatrixWorld(true);
    const M = this.frameOf(s.frame, f, this.frameM);
    // ---- camera ----
    const c = camAt(id, f);
    const pos = V(...c.pos).applyMatrix4(M), look = V(...c.look).applyMatrix4(M), up = V(0, 1, 0).transformDirection(M);
    cam.position.copy(pos); cam.up.copy(up); cam.lookAt(look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = look, dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 10, 160);
    this.sun.position.copy(focus).addScaledVector(sunDir, 300); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 700; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, stars, fog, sea ----
    const su = this.skyMat.uniforms, skyK = 1 - 0.45 * dk;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value).multiplyScalar(skyK));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position); this.stars.position.copy(cam.position);
    const outside = s.frame === "world" || s.frame === "ship";
    this.sky.visible = this.stars.visible = this.sea.visible = outside;
    untone(L.fog, this.fog.color).multiplyScalar(skyK); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    this.sea.position.set(Math.round(cam.position.x / 50) * 50, 0, Math.round(cam.position.z / 50) * 50);
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value).multiplyScalar(skyK); untone(wc.mid, W.wMidC.value).multiplyScalar(skyK); untone(wc.far, W.wFarC.value).multiplyScalar(skyK);
    untone(wc.crest, W.wCrest.value).multiplyScalar(skyK); untone(wc.trough, W.wTrough.value).multiplyScalar(skyK); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = id >= 17 ? t * 0.25 : t;
    // ---- set pieces ----
    const sunk = id >= 17;
    this.ship.visible = outside && !sunk;
    this.ice.visible = id === 2 || id === 3;
    this.ice.position.set(iceX(f), -4, ICE_Z); this.ice.rotation.y = 0.4;
    this.cabin.visible = s.frame === "cabin"; this.hall.visible = s.frame === "hall";
    if (s.frame === "cabin" || s.frame === "hall") { const g = s.frame === "cabin" ? this.cabin : this.hall; g.matrixAutoUpdate = false; g.matrix.copy(M); g.updateMatrixWorld(true); }
    this.flood.visible = !!s.flood;
    if (s.flood) this.flood.position.set(HALL[0], HALL[1] - 0.95 + 0.0125 * (f - 704), HALL[2]);
    const lamps = lampsAt(f);
    for (const g of GLOWS) g.m.emissive.copy(g.base).multiplyScalar(g.ship ? lamps : 1);
    for (const h of this.halves) for (const b of h.boats) b.o.visible = f < LAUNCH[b.i] && !(id === 11 && b.i === 1);
    // the boat being lowered (shot 11): from the davits down the starboard side
    const low = id === 11;
    this.lowerBoat.visible = low; for (const r of this.ropes) r.visible = low;
    if (low) {
      const u = smooth((f - LOWER.f0 + 10) / (LOWER.f1 - LOWER.f0 + 30));
      const sh = World.poseM(sinkAt(f), new THREE.Matrix4());
      const top = V(LOWER.x, DECK + 3.3, LOWER.side * 9.1 + LOWER.side * 2.0).applyMatrix4(sh);
      const p = V(LOWER.x, DECK + 1.6 - 9.0 * u, LOWER.side * 11.3).applyMatrix4(sh);
      this.lowerBoat.position.copy(p); this.lowerBoat.rotation.set(0, 0, THREE.MathUtils.degToRad(sinkAt(f).pitch));
      this.ropes.forEach((r, i) => {
        const dx = i % 2 ? 3.4 : -3.4, a = V(top.x + dx, top.y, top.z), b = V(p.x + dx, p.y + 0.1, p.z + (i < 2 ? 0 : 0));
        r.position.copy(a).add(b).multiplyScalar(0.5); r.scale.set(1, a.distanceTo(b), 1); r.visible = i < 2;
      });
    }
    for (const o of this.seaBoats) { o.visible = sunk; o.position.y = 0.55 + 0.04 * Math.sin(t * 1.3 + o.position.x); o.rotation.z = 0.015 * Math.sin(t * 1.1 + o.position.z); }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), camUp = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 1), fwd = V(0, 0, -1).transformDirection(cam.matrixWorld);
    const st = stage(id, t, { pos: cam.position, right, up: camUp, fwd, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const toW = (x: number, y: number, z: number) => this.v.set(x, y, z).applyMatrix4(M);
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1, w = toW(p.x, p.y, p.z).clone();
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(w.x, w.y + 1.1 * sc2, w.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [cw, ch, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, cw, ch, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.copy(w);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - w.x, cam.position.z - w.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      const w = p.cam ? cam.position.clone().addScaledVector(right, p.cam[0]).addScaledVector(camUp, p.cam[1]).addScaledVector(fwd, p.cam[2]) : toW(p.x, p.y, p.z).clone();
      if (!p.cam && !this.frustum.intersectsSphere(this.sph.set(w, Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.tint(p.tint);
      e2.mesh.visible = true;
      e2.mesh.position.copy(w);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.upright) { e2.mesh.rotation.set(0, Math.atan2(cam.position.x - w.x, cam.position.z - w.z), p.rot ?? 0); }
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.mirror ? -p.w : p.w, p.h, 1);
      e2.mesh.renderOrder = p.cam ? 10 : 0;
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus.clone();
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
