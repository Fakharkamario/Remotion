// Static sets: the Japanese workshop YARD (polisher's house with engawa, forge shed, plaster walls with tile caps,
// pines, maples, stone lanterns, bamboo grove, Fuji on the horizon), the AZTEC plaza (stepped pyramid, braziers,
// jungle, volcano), the LAB (backdrop, pedestal, the tungsten needle), the NANO stage (atom lattice cone, the slab
// that bumps it) and the DIAGRAM stage (blade cross-section that morphs from razor V to a rounded clam-shell edge).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, boxGeo, quad, tri, V } from "./build";
import { ctex, rng, planksHD, roofHD, stoneHD, rep } from "./paint";
import { twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { lamC, phongC, mk, tmat } from "./props";
import {
  ENGAWA_Y, ENGAWA_Z, STONES_Z, POLISHER_AT, FORGE, ANVIL, HEARTH, TROUGH, WHET, TABLE, MAT, BAMBOO_T, AZ, LAB, NANO, DIAG, V3,
} from "./story";

const lamT = (key: string, tex: () => THREE.Texture, soft = 0.15, col = "#ffffff") => tmat("T" + key + col, () => new THREE.MeshLambertMaterial({ map: tex(), color: col }), soft);
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();

// ---------------- textures ----------------
const earthTex = () => ctex("earth", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9c7a2"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 40; i++) { const x = r() * 1024, y = r() * 1024, rad = 60 + r() * 160; const gr = g.createRadialGradient(x, y, 0, x, y, rad); const c = r() < 0.5 ? "190,165,125" : "232,218,190"; gr.addColorStop(0, `rgba(${c},0.35)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  for (let i = 0; i < 2600; i++) { const x = r() * 1024, y = r() * 1024, s = 1 + r() * 3.5; g.fillStyle = r() < 0.5 ? "rgba(120,100,75,0.45)" : "rgba(255,250,235,0.5)"; g.beginPath(); g.ellipse(x, y, s, s * 0.8, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const gravelTex = () => ctex("gravel", 1024, 1024, (g, r) => {
  g.fillStyle = "#e4ddd0"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { const x = r() * 1024, y = r() * 1024, s = 1.5 + r() * 3; g.fillStyle = r() < 0.4 ? "rgba(150,140,125,0.5)" : "rgba(255,255,250,0.7)"; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(140,128,110,0.45)"; g.lineWidth = 5; // raked lines
  for (let y = 16; y < 1024; y += 40) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + 3 * Math.sin(x / 90)); g.stroke(); }
});
const plasterTex = () => ctex("plaster", 512, 512, (g, r) => {
  g.fillStyle = "#f1ebdd"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30; i++) { const x = r() * 512, y = r() * 512, rad = 40 + r() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(200,185,160,0.18)"); gr.addColorStop(1, "rgba(200,185,160,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); }
});
/** house front: dark timber posts every 1.8 m, shoji panels (paper grid) between, a rail and a band of plaster above */
const shojiTex = () => ctex("shoji", 2048, 512, (g, r) => {
  const W = 2048, H = 512, bay = W / 6;
  g.fillStyle = "#f2ecdf"; g.fillRect(0, 0, W, H);
  for (let b = 0; b < 6; b++) {
    const x0 = b * bay;
    // shoji: two sliding panels per bay
    for (let k = 0; k < 2; k++) {
      const px = x0 + 22 + k * (bay - 44) / 2, pw = (bay - 44) / 2, py = 96, ph = H - 120;
      g.fillStyle = "#fbf7ea"; g.fillRect(px, py, pw, ph);
      g.fillStyle = "#8a6a48";
      for (let i = 0; i <= 3; i++) g.fillRect(px + (i * pw) / 3 - 3, py, 6, ph);
      for (let j = 0; j <= 6; j++) g.fillRect(px, py + (j * ph) / 6 - 3, pw, 6);
      g.fillStyle = "#6a4c30"; g.fillRect(px - 5, py - 6, pw + 10, 12); g.fillRect(px - 5, py + ph - 6, pw + 10, 14);
    }
    g.fillStyle = "#4a3324"; g.fillRect(x0, 0, 22, H); // post
  }
  g.fillStyle = "#4a3324"; g.fillRect(0, 70, W, 26); g.fillRect(0, H - 14, W, 14);
});
const sideWallTex = () => ctex("sideWall", 1024, 512, (g) => {
  g.fillStyle = "#f1ebdd"; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#4a3324";
  for (let x = 0; x <= 1024; x += 256) g.fillRect(x - 11, 0, 22, 512);
  g.fillRect(0, 70, 1024, 22); g.fillRect(0, 300, 1024, 16); g.fillRect(0, 498, 1024, 14);
  g.fillStyle = "#c9b48e"; g.fillRect(0, 316, 1024, 182); // lower wooden wainscot
  g.fillStyle = "rgba(80,55,35,0.5)"; for (let x = 0; x < 1024; x += 32) g.fillRect(x, 316, 3, 182);
});
const plankWallTex = () => ctex("plankWall", 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 64) { g.fillStyle = ["#6f4e34", "#7a573a", "#664730"][Math.floor(r() * 3)]; g.fillRect(x, 0, 64, 512); g.fillStyle = "rgba(30,18,10,0.7)"; g.fillRect(x, 0, 4, 512); }
  for (let i = 0; i < 80; i++) { g.strokeStyle = "rgba(40,25,15,0.25)"; g.lineWidth = 2; const x = r() * 512; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + r() * 8 - 4, 512); g.stroke(); }
});
const stoneBlockTex = (key: string, cols: string[], mortar: string, rows = 4) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = mortar; g.fillRect(0, 0, 512, 512);
  const RH = 512 / rows;
  for (let row = 0; row < rows; row++) {
    let x = (row % 2) * 60 - 60;
    while (x < 512) { const w = 90 + r() * 90; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.roundRect(x + 4, row * RH + 4, w - 8, RH - 8, 8); g.fill(); g.fillStyle = "rgba(255,255,255,0.15)"; g.fillRect(x + 8, row * RH + 6, w - 16, 6); x += w; }
  }
});
const bambooTex = () => ctex("bamboo", 128, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, "#5f8f35"); gr.addColorStop(0.45, "#86b54a"); gr.addColorStop(1, "#4f7c2c");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 1024);
  for (let y = 0; y < 1024; y += 256) { g.fillStyle = "#3e5f22"; g.fillRect(0, y, 128, 10); g.fillStyle = "#b7d07a"; g.fillRect(0, y + 10, 128, 6); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(220,235,170,0.25)"; g.fillRect(r() * 128, r() * 1024, 2, 40 + r() * 80); }
});
const gridTex = (key: string, base: string, line: string, n = 8) => ctex(key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = line; g.lineWidth = 3;
  for (let i = 0; i <= n; i++) { const p = (i * 512) / n; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 512); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(512, p); g.stroke(); }
});
const whetTex = (c0: string, c1: string, grit: number, key: string) => ctex(key, 256, 128, (g, r) => {
  g.fillStyle = c0; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < grit; i++) { g.fillStyle = r() < 0.5 ? c1 : "rgba(255,255,255,0.35)"; g.fillRect(r() * 256, r() * 128, 2, 2); }
});

// ---------------- geometry helpers ----------------
const box = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), m);
const cyl = (r0: number, r1: number, h: number, seg = 12) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.translate(0, h / 2, 0); return g; };
const at = (g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, s: V3 = [1, 1, 1], rx = 0, rz = 0) =>
  g.applyMatrix4(new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(...s)));
/** hip roof over rectangle x0..x1, z0..z1 at eave height y, ridge height y + rise; tiles tiled every `tile` m */
const hipRoof = (b: Batch, m: THREE.Material, x0: number, x1: number, z0: number, z1: number, y: number, rise: number, tile = 2) => {
  const d = (z1 - z0) / 2, cz = (z0 + z1) / 2, ry = y + rise, rx0 = x0 + d, rx1 = x1 - d;
  const t = (v: number) => v / tile;
  const slope = Math.hypot(d, rise);
  b.add(quad(V(x0, y, z1), V(x1, y, z1), V(rx1, ry, cz), V(rx0, ry, cz), t(x1 - x0), t(slope)), m); // front
  b.add(quad(V(x1, y, z0), V(x0, y, z0), V(rx0, ry, cz), V(rx1, ry, cz), t(x1 - x0), t(slope)), m); // back
  b.add(tri(V(x0, y, z0), V(x0, y, z1), V(rx0, ry, cz)), m);
  b.add(tri(V(x1, y, z1), V(x1, y, z0), V(rx1, ry, cz)), m);
};
const gableRoof = (b: Batch, m: THREE.Material, x0: number, x1: number, z0: number, z1: number, y: number, rise: number, tile = 2) => {
  const cz = (z0 + z1) / 2, ry = y + rise, s = Math.hypot((z1 - z0) / 2, rise);
  b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, ry, cz), V(x0, ry, cz), (x1 - x0) / tile, s / tile), m);
  b.add(quad(V(x1, y, z0), V(x0, y, z0), V(x0, ry, cz), V(x1, ry, cz), (x1 - x0) / tile, s / tile), m);
  // thickness: a dark fascia under the eaves
  b.add(quad(V(x0, y - 0.12, z1), V(x1, y - 0.12, z1), V(x1, y, z1), V(x0, y, z1)), lamC("#3b2a20"));
  b.add(quad(V(x1, y - 0.12, z0), V(x0, y - 0.12, z0), V(x0, y, z0), V(x1, y, z0)), lamC("#3b2a20"));
};
/** cartoon tree: trunk + clumps (pine: flat pads, maple: round clumps) */
const tree = (b: Batch, x: number, z: number, h: number, kind: "pine" | "maple" | "round" | "palm", seed: number) => {
  const r = rng(seed);
  const bark = lamC(kind === "palm" ? "#8a6a48" : "#5a4030");
  const leaf = kind === "pine" ? lamC(["#3f6e3a", "#467a3c", "#3a6634"][seed % 3], 0.2) : kind === "maple" ? lamC(["#d2532e", "#e0703a", "#c94a2c"][seed % 3], 0.25) : kind === "palm" ? lamC("#4f8f3a", 0.25) : lamC(["#4f8a3e", "#5a9644", "#47803a"][seed % 3], 0.2);
  b.add(at(cyl(h * 0.035, h * 0.055, h * 0.75, 8), x, 0, z, 0, [1, 1, 1], (r() - 0.5) * 0.15, (r() - 0.5) * 0.2), bark);
  if (kind === "pine") {
    for (let i = 0; i < 6; i++) { const a = r() * 6.28, rr = h * (0.1 + 0.25 * r()), y = h * (0.45 + 0.5 * r()); b.add(at(new THREE.SphereGeometry(h * 0.16, 12, 8), x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, 0, [1.5, 0.45, 1.2]), leaf); }
  } else if (kind === "palm") {
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; b.add(at(new THREE.SphereGeometry(h * 0.2, 10, 6), x + Math.cos(a) * h * 0.18, h * 0.74, z + Math.sin(a) * h * 0.18, -a, [1.6, 0.18, 0.5], 0, 0.3), leaf); }
  } else {
    for (let i = 0; i < 7; i++) { const a = r() * 6.28, rr = h * 0.18 * r(), y = h * (0.6 + 0.3 * r()); b.add(at(new THREE.IcosahedronGeometry(h * (0.2 + 0.08 * r()), 1), x + Math.cos(a) * rr, y, z + Math.sin(a) * rr), leaf); }
  }
};
const mountain = (b: Batch, x: number, z: number, h: number, rad: number, col: string, snow: boolean) => {
  b.add(at(new THREE.ConeGeometry(rad, h, 40, 1, true), x, h / 2, z), lamC(col, 0.4));
  if (snow) {
    const sh = h * 0.24, sr = rad * 0.24;
    const g = new THREE.ConeGeometry(sr * 1.03, sh, 40, 2, true); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < -sh / 2 + 0.01) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.25 * Math.sin(a * 7); p.setXYZ(i, p.getX(i) * k, p.getY(i) - sh * 0.15 * Math.abs(Math.sin(a * 5)), p.getZ(i) * k); }
    g.computeVertexNormals();
    b.add(at(g, x, h - sh / 2 + 0.5, z), lamC("#f4f6fa", 0.5));
  }
};
/** plaster wall with a small tiled cap (dobei), along x or z */
const dobei = (b: Batch, x0: number, z0: number, x1: number, z1: number, h = 1.9) => {
  const plaster = lamT("plaster", plasterTex, 0.2), tileM = lamC("#5d6470", 0.2), base = lamT("wallBase", () => stoneBlockTex("wallBase", ["#9a958c", "#a7a196", "#8d887f"], "#6b675f", 3), 0.2);
  const along = Math.abs(x1 - x0) > Math.abs(z1 - z0), t = 0.32;
  if (along) {
    box(b, base, Math.min(x0, x1), 0, z0 - t / 2, Math.max(x0, x1), 0.45, z0 + t / 2, 1.2);
    box(b, plaster, Math.min(x0, x1), 0.45, z0 - t / 2 + 0.02, Math.max(x0, x1), h, z0 + t / 2 - 0.02);
    gableRoof(b, tileM, Math.min(x0, x1) - 0.1, Math.max(x0, x1) + 0.1, z0 - 0.4, z0 + 0.4, h, 0.28, 0.6);
  } else {
    box(b, base, x0 - t / 2, 0, Math.min(z0, z1), x0 + t / 2, 0.45, Math.max(z0, z1), 1.2);
    box(b, plaster, x0 - t / 2 + 0.02, 0.45, Math.min(z0, z1), x0 + t / 2 - 0.02, h, Math.max(z0, z1));
    const g = new Batch(); gableRoof(g, tileM, Math.min(z0, z1) - 0.1, Math.max(z0, z1) + 0.1, -0.4, 0.4, h, 0.28, 0.6);
    const grp = new THREE.Group(); g.build(grp);
    grp.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) b.add(m.geometry, m.material as THREE.Material, new THREE.Matrix4().makeRotationY(-Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(x0, 0, 0))); });
  }
};
const lantern = (b: Batch, x: number, z: number) => {
  const st = lamC("#a9a49a", 0.3);
  b.add(at(cyl(0.22, 0.26, 0.15, 8), x, 0, z), st);
  b.add(at(cyl(0.07, 0.07, 0.75, 8), x, 0.15, z), st);
  b.add(at(new THREE.BoxGeometry(0.42, 0.08, 0.42), x, 0.94, z), st);
  b.add(at(new THREE.BoxGeometry(0.3, 0.28, 0.3), x, 1.12, z), st);
  b.add(at(new THREE.BoxGeometry(0.31, 0.12, 0.12), x, 1.12, z + 0.1), lamC("#3a3530"));
  b.add(at(new THREE.ConeGeometry(0.42, 0.22, 4), x, 1.37, z, Math.PI / 4), st);
  b.add(at(new THREE.SphereGeometry(0.05, 8, 6), x, 1.5, z), st);
};

// ---------------- the yard ----------------
/** the polisher works on the stone straight in front of him (world.ts swaps its grit); the row to his right shows the progression */
export const WORK_H = 0.3; // working stand height on the engawa
export const STONE_X = (i: number) => POLISHER_AT[0] + 0.8 + i * 0.45;
export const STONE_COLS: [string, string][] = [["#5d5a5c", "rgba(30,28,30,0.6)"], ["#8a6f62", "rgba(60,40,30,0.5)"], ["#b09a7c", "rgba(90,70,50,0.4)"], ["#d4c49a", "rgba(120,100,70,0.3)"], ["#efe3bc", "rgba(160,140,100,0.2)"]];
export const whetMat = (i: number) => lamT("whet" + i, () => whetTex(STONE_COLS[i][0], STONE_COLS[i][1], 900 - i * 170, "whet" + i), 0.3);
export const buildYard = (root: THREE.Object3D) => {
  const G = new THREE.Group(); root.add(G);
  const b = new Batch();
  // ground: earth, a raked-gravel band in front of the house, stepping stones
  const ground = new THREE.PlaneGeometry(600, 600); ground.rotateX(-Math.PI / 2);
  const gm = mk(ground, tmat("earthM", () => new THREE.MeshLambertMaterial({ map: rep(earthTex(), 150, 150) }), 0.1)); G.add(gm);
  const grav = new THREE.PlaneGeometry(14, 3.2); grav.rotateX(-Math.PI / 2); grav.translate(0, 0.005, -1.4);
  G.add(mk(grav, tmat("gravelM", () => new THREE.MeshLambertMaterial({ map: rep(gravelTex(), 4, 1) }), 0.15)));
  const stepM = lamC("#b4aea2", 0.3);
  for (const [x, z, s] of [[0.6, -2.7, 0.42], [1.4, -1.6, 0.36], [0.5, -0.6, 0.4], [1.3, 0.5, 0.34]]) b.add(at(new THREE.CylinderGeometry(s, s * 1.05, 0.07, 9), x, 0.035, z, x * 3, [1, 1, 0.75]), stepM);
  // ---- polisher's house ----
  const wood = lamC("#5a3e2c"), deck = tmat("deckM", () => new THREE.MeshLambertMaterial({ map: rep(planksHD(), 1, 1) }), 0.2);
  const front = lamT("shoji", shojiTex, 0.25), side = lamT("sideWall", sideWallTex, 0.25);
  const hx0 = -5.4, hx1 = 5.4, hz0 = -9.6, hz1 = ENGAWA_Z - 0.85, top = 2.95;
  box(b, lamC("#3a302a"), hx0 - 0.1, 0, hz0 - 0.1, hx1 + 0.1, ENGAWA_Y - 0.02, ENGAWA_Z - 0.02); // shadowed crawl space
  b.add(quad(V(hx0, ENGAWA_Y, hz1), V(hx1, ENGAWA_Y, hz1), V(hx1, top, hz1), V(hx0, top, hz1)), front);
  for (const [xa, xb] of [[hx1, hx1], [hx0, hx0]]) {
    const s = xa > 0 ? 1 : -1;
    if (s > 0) b.add(quad(V(xa, ENGAWA_Y, hz1), V(xa, ENGAWA_Y, hz0), V(xb, top, hz0), V(xb, top, hz1), 1, 1), side);
    else b.add(quad(V(xa, ENGAWA_Y, hz0), V(xa, ENGAWA_Y, hz1), V(xb, top, hz1), V(xb, top, hz0), 1, 1), side);
  }
  b.add(quad(V(hx1, ENGAWA_Y, hz0), V(hx0, ENGAWA_Y, hz0), V(hx0, top, hz0), V(hx1, top, hz0)), side);
  // engawa deck + edge beam + posts holding the eaves
  b.add(boxGeo(V(hx0 - 0.3, ENGAWA_Y - 0.1, hz1), V(hx1 + 0.3, ENGAWA_Y, ENGAWA_Z), 2.4), deck);
  box(b, wood, hx0 - 0.3, ENGAWA_Y - 0.2, ENGAWA_Z - 0.12, hx1 + 0.3, ENGAWA_Y - 0.08, ENGAWA_Z + 0.01);
  for (const x of [hx0, hx1]) b.add(at(cyl(0.075, 0.075, top - ENGAWA_Y + 0.05, 10), x, ENGAWA_Y, ENGAWA_Z - 0.1), wood);
  for (const x of [hx0 - 0.1, hx1 + 0.1]) b.add(at(cyl(0.11, 0.12, 0.25, 8), x, 0, ENGAWA_Z - 0.1), lamC("#9d978c"));
  box(b, wood, hx0 - 0.2, top - 0.18, ENGAWA_Z - 0.2, hx1 + 0.2, top, ENGAWA_Z); // eave beam
  // step stone up to the engawa
  box(b, lamC("#a8a296", 0.3), 0.2, 0, ENGAWA_Z, 1.4, 0.22, ENGAWA_Z + 0.45);
  // roof: big hip roof with deep eaves, dark fascia, ridge cap
  const roofM = tmat("roofTiles", () => new THREE.MeshLambertMaterial({ map: roofHD("#5f6672", true) }), 0.2);
  hipRoof(b, roofM, hx0 - 1.2, hx1 + 1.2, hz0 - 1.2, ENGAWA_Z + 0.35, top + 0.02, 2.0, 2.5);
  const fascia = lamC("#2f2622");
  box(b, fascia, hx0 - 1.2, top - 0.12, ENGAWA_Z + 0.25, hx1 + 1.2, top + 0.03, ENGAWA_Z + 0.36);
  box(b, fascia, hx0 - 1.2, top - 0.12, hz0 - 1.21, hx1 + 1.2, top + 0.03, hz0 - 1.1);
  const ridgeZ = (hz0 - 1.2 + ENGAWA_Z + 0.35) / 2, half = (ENGAWA_Z + 0.35 - (hz0 - 1.2)) / 2;
  box(b, lamC("#454b56", 0.2), hx0 - 1.2 + half - 0.1, top + 1.98, ridgeZ - 0.16, hx1 + 1.2 - half + 0.1, top + 2.22, ridgeZ + 0.16);
  for (const x of [hx0 - 1.2 + half - 0.1, hx1 + 1.2 - half + 0.1]) b.add(at(new THREE.BoxGeometry(0.3, 0.45, 0.4), x, top + 2.2, ridgeZ), lamC("#454b56", 0.2));
  // polisher's station on the engawa: low stand with five stones (coarse dark -> fine pale), water bucket, cushion
  STONE_COLS.forEach((_c, i) => {
    const x = STONE_X(i);
    const st = whetMat(i);
    box(b, lamC("#6b4a32"), x - 0.15, ENGAWA_Y, STONES_Z - 0.09, x + 0.15, ENGAWA_Y + 0.07, STONES_Z + 0.09);
    box(b, st, x - 0.11, ENGAWA_Y + 0.07, STONES_Z - 0.04, x + 0.11, ENGAWA_Y + 0.12, STONES_Z + 0.04);
  });
  b.add(at(cyl(0.16, 0.13, 0.22, 14), POLISHER_AT[0] - 1.9, ENGAWA_Y, STONES_Z - 0.1), lamC("#8a6040"));
  b.add(at(new THREE.CircleGeometry(0.14, 14), POLISHER_AT[0] - 1.9, ENGAWA_Y + 0.2, STONES_Z - 0.1, 0, [1, 1, 1], -Math.PI / 2), lamC("#5d8fb0", 0.4));
  b.add(at(new THREE.BoxGeometry(0.62, 0.06, 0.55), POLISHER_AT[0], ENGAWA_Y + 0.03, POLISHER_AT[2] - 0.05), lamC("#7a3a3a", 0.3));
  box(b, lamC("#6b4a32"), POLISHER_AT[0] - 0.2, ENGAWA_Y, STONES_Z - 0.1, POLISHER_AT[0] + 0.2, ENGAWA_Y + WORK_H, STONES_Z + 0.1); // working stand (stone: world.ts)
  // ---- forge shed ----
  const [fx, , fz] = FORGE, sx0 = fx - 2.6, sx1 = fx + 2.6, sz0 = fz - 2.4, sz1 = fz + 1.8;
  const plank = lamT("plankWall", plankWallTex, 0.2);
  box(b, plank, sx0, 0, sz0, sx1, 2.4, sz0 + 0.12, 2);
  box(b, plank, sx0, 0, sz0, sx0 + 0.12, 2.4, sz1 - 1.2, 2);
  for (const [x, z] of [[sx0, sz1], [sx1, sz1], [sx1, sz0]]) b.add(at(cyl(0.08, 0.08, 2.5, 8), x, 0, z), wood);
  gableRoof(b, roofM, sx0 - 0.6, sx1 + 0.6, sz0 - 0.6, sz1 + 0.7, 2.45, 1.0, 2.5);
  box(b, wood, sx0 - 0.3, 2.3, sz1 - 0.08, sx1 + 0.3, 2.45, sz1 + 0.08);
  // hearth (stone block with a glowing pit), hood + chimney, bellows box
  const stoneM = lamT("hearthStone", () => stoneBlockTex("hearthStone", ["#8f8578", "#9c9184", "#857b70"], "#5c544b", 4), 0.2);
  const [hx, , hz] = HEARTH;
  box(b, stoneM, hx - 0.75, 0, hz - 0.5, hx + 0.75, 0.75, hz + 0.5, 1);
  box(b, lamC("#2a1a14"), hx - 0.45, 0.75, hz - 0.3, hx + 0.45, 0.77, hz + 0.3);
  box(b, lamT("hood", () => stoneBlockTex("hood", ["#7f776c", "#8b8276"], "#57504a", 3), 0.2), hx - 0.5, 1.6, hz - 0.45, hx + 0.5, 2.1, hz + 0.25, 1);
  box(b, lamC("#6d655c", 0.2), hx - 0.25, 2.1, hz - 0.3, hx + 0.25, 4.2, hz + 0.1);
  box(b, lamC("#7a5638"), hx + 0.85, 0, hz - 0.35, hx + 1.5, 0.6, hz + 0.25);
  // anvil on a stump, water trough, tongs rack, charcoal sacks
  const [ax, , az] = ANVIL;
  b.add(at(cyl(0.26, 0.3, 0.45, 12), ax, 0, az), lamC("#7b5a3e"));
  box(b, phongC("#3c3d44", 25), ax - 0.13, 0.45, az - 0.1, ax + 0.13, 0.58, az + 0.1);
  box(b, phongC("#3c3d44", 25), ax - 0.24, 0.58, az - 0.11, ax + 0.2, 0.68, az + 0.11);
  b.add(at(new THREE.ConeGeometry(0.1, 0.22, 8), ax + 0.3, 0.63, az, 0, [1, 1, 1], 0, -Math.PI / 2), phongC("#3c3d44", 25));
  const [tx, , tz] = TROUGH;
  box(b, lamC("#7a5638"), tx - 0.55, 0, tz - 0.25, tx + 0.55, 0.5, tz + 0.25);
  b.add(at(new THREE.PlaneGeometry(1.0, 0.4), tx, 0.47, tz, 0, [1, 1, 1], -Math.PI / 2), phongC("#4f86a8", 80, "#ffffff", 0.4));
  for (let i = 0; i < 3; i++) b.add(at(new THREE.SphereGeometry(0.22, 10, 8), sx1 - 0.6 - i * 0.45, 0.2, sz0 + 0.45, i, [1, 0.9, 0.8]), lamC("#b49a6e", 0.3));
  // ---- narrator's whetstone block (shot 2) ----
  const [wx, , wz] = WHET;
  box(b, lamC("#8a5f3c"), wx - 0.32, 0, wz - 0.16, wx + 0.32, 0.4, wz + 0.16);
  box(b, lamT("whet1b", () => whetTex("#7a6a62", "rgba(40,30,30,0.5)", 700, "whet1b"), 0.3), wx - 0.2, 0.4, wz - 0.06, wx + 0.2, 0.47, wz + 0.06);
  // ---- tomato table ----
  const [tbx, , tbz] = TABLE;
  box(b, lamC("#9a6a42"), tbx - 0.42, 0.74, tbz - 0.3, tbx + 0.42, 0.8, tbz + 0.3);
  for (const [dx, dz] of [[-0.36, -0.24], [0.36, -0.24], [-0.36, 0.24], [0.36, 0.24]]) box(b, lamC("#7a5232"), tbx + dx - 0.035, 0, tbz + dz - 0.035, tbx + dx + 0.035, 0.74, tbz + dz + 0.035);
  box(b, lamC("#d7b57e", 0.3), tbx - 0.2, 0.8, tbz - 0.14, tbx + 0.2, 0.83, tbz + 0.14);
  // ---- lanterns, trees, walls, distant hills ----
  lantern(b, -3.4, -2.2); lantern(b, 5.6, -2.1);
  tree(b, 7.2, -6.0, 4.4, "pine", 1); tree(b, -13.2, -8.8, 5.2, "pine", 2); tree(b, -4.2, -11.0, 4.6, "maple", 3); tree(b, 3.6, -11.5, 5.0, "maple", 4);
  tree(b, -14, 6, 4.5, "maple", 5); tree(b, 9.5, -9.5, 3.8, "round", 6);
  dobei(b, -16, -12.5, 24, -12.5); dobei(b, -16, -12.5, -16, 12); dobei(b, 24, -12.5, 24, 12);
  const far = rng(21);
  for (let i = 0; i < 46; i++) { const x = -60 + i * 3.2 + far() * 2, z = -16 - far() * 22; tree(b, x, z, 6 + far() * 6, i % 5 === 0 ? "pine" : i % 7 === 0 ? "maple" : "round", 30 + i); }
  for (let i = 0; i < 20; i++) { const z = -10 + i * 3, x = -22 - far() * 12; tree(b, x, z, 6 + far() * 5, "round", 90 + i); }
  for (let i = 0; i < 14; i++) { const z = 14 + far() * 20, x = -30 + i * 5; tree(b, x, z, 6 + far() * 5, "round", 120 + i); }
  mountain(b, 70, -460, 230, 360, "#7d95c0", true);
  mountain(b, -220, -380, 110, 260, "#8aa0c4", false); mountain(b, 260, -420, 130, 280, "#869cc2", false); mountain(b, -90, -260, 60, 160, "#7f9a9a", false);
  // ---- bamboo grove (east) ----
  const bm = lamT("bambooM", bambooTex, 0.25), leafM = lamC("#7bb04a", 0.3), leafD = lamC("#5f9a3c", 0.3), r = rng(77);
  const stalk = (x: number, z: number, h: number, rad: number, lean: number, la: number) => {
    const g = new THREE.CylinderGeometry(rad * 0.85, rad, h, 10, 1, true); g.translate(0, h / 2, 0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * h / 1.6);
    at(g, x, 0, z, 0, [1, 1, 1], Math.sin(la) * lean, Math.cos(la) * lean);
    b.add(g, bm);
    for (let y = 1.6; y < h; y += 1.6) b.add(at(new THREE.TorusGeometry(rad * 0.98, rad * 0.12, 4, 10), x + Math.cos(la) * -lean * y * 0 , y, z, 0, [1, 1, 1], Math.PI / 2 + Math.sin(la) * lean, 0, ), lamC("#4d7a2a"));
    for (let k = 0; k < 4; k++) { const y = h * (0.62 + 0.36 * r()), a = r() * 6.28, d = 0.35 + 0.4 * r(); b.add(at(new THREE.SphereGeometry(0.55 + 0.35 * r(), 10, 7), x - Math.sin(Math.cos(la) * lean) * y + Math.cos(a) * d, y, z + Math.sin(Math.sin(la) * lean) * y + Math.sin(a) * d, a, [1.4, 0.42, 0.9]), k % 2 ? leafM : leafD); }
  };
  stalk(BAMBOO_T[0], BAMBOO_T[2], 8.5, 0.085, 0.0, 0);
  for (let i = 0; i < 70; i++) {
    const x = 11.5 + r() * 12, z = -11 + r() * 22;
    if (Math.hypot(x - BAMBOO_T[0], z - BAMBOO_T[2]) < 1.1 || (x < 13 && z > 0.2 && z < 4.5)) continue;
    stalk(x, z, 6.5 + r() * 3.5, 0.05 + r() * 0.04, (r() - 0.5) * 0.08, r() * 6.28);
  }
  b.add(at(new THREE.CircleGeometry(9, 24), 17, 0.006, -1, 0, [1, 1, 1], -Math.PI / 2), lamC("#b9a879", 0.2));
  b.build(G);
  return G;
};

// ---------------- the Aztec plaza ----------------
export const buildAztec = (root: THREE.Object3D) => {
  const G = new THREE.Group(); root.add(G);
  const b = new Batch(), [x, , z] = AZ;
  const pave = tmat("aztecPave", () => new THREE.MeshLambertMaterial({ map: rep(stoneBlockTex("aztecPave", ["#cdb78f", "#d8c49c", "#c2ab84", "#d2be95"], "#9a855f", 4), 40, 40) }), 0.15);
  const gp = new THREE.PlaneGeometry(240, 240); gp.rotateX(-Math.PI / 2); gp.translate(x, 0, z);
  const gm = mk(gp, pave); G.add(gm);
  const lime = lamT("aztecBlock", () => stoneBlockTex("aztecBlock", ["#d9c7a0", "#cfbb92", "#e2d2ad"], "#a8916b", 3), 0.2);
  // stepped pyramid with a central stair and a temple on top
  const pz = z - 40;
  for (let i = 0; i < 5; i++) { const w = 34 - i * 6, h = 4; box(b, lime, x - w / 2, i * h, pz - w / 2, x + w / 2, (i + 1) * h - 0.2, pz + w / 2, 2); box(b, lamC("#b9a27a"), x - w / 2 - 0.3, (i + 1) * h - 0.6, pz - w / 2 - 0.3, x + w / 2 + 0.3, (i + 1) * h - 0.2, pz + w / 2 + 0.3); }
  const stair = new THREE.BufferGeometry();
  b.add(quad(V(x - 3, 0, pz + 18), V(x + 3, 0, pz + 18), V(x + 3, 20, pz + 5), V(x - 3, 20, pz + 5), 3, 20), lamT("stairs", () => stoneBlockTex("stairs", ["#e6d7b4", "#dccba5"], "#8a7655", 16), 0.2));
  void stair;
  box(b, lamC("#c4473a", 0.25), x - 4, 20, pz - 3, x + 4, 25, pz + 3);
  box(b, lamC("#2a9d8f", 0.25), x - 4.3, 25, pz - 3.3, x + 4.3, 26.2, pz + 3.3);
  box(b, lamC("#1e1a1c"), x - 1, 20, pz + 2.98, x + 1, 23, pz + 3.02);
  // plaza: low platform walls, braziers with fire, carved serpent heads
  for (const sx of [-1, 1]) {
    box(b, lime, x + sx * 9 - 1.5, 0, z - 6, x + sx * 9 + 1.5, 1.1, z + 6, 1.2);
    b.add(at(cyl(0.35, 0.18, 0.55, 12), x + sx * 3.6, 0, z + 1.2), lamC("#9b8461"));
    b.add(at(cyl(0.55, 0.38, 0.35, 14), x + sx * 3.6, 0.55, z + 1.2), lamC("#8a6a48"));
  }
  // jungle around, a volcano far off
  const r = rng(31);
  for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = 30 + r() * 50; const tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d * 0.8 - 10; if (Math.abs(tx - x) < 20 && tz > pz - 25 && tz < pz + 25) continue; tree(b, tx, tz, 7 + r() * 7, r() < 0.4 ? "palm" : "round", 200 + i); }
  mountain(b, x + 120, z - 480, 240, 330, "#8f9fc4", true);
  mountain(b, x - 200, z - 420, 150, 300, "#8aa0c2", false);
  b.build(G);
  return G;
};
export const BRAZIERS: V3[] = [[AZ[0] - 3.6, 0.9, AZ[2] + 1.2], [AZ[0] + 3.6, 0.9, AZ[2] + 1.2]];

// ---------------- backdrops for the lab / nano / diagram stages ----------------
const backdrop = (c: V3, rad: number, top: string, bot: string) => {
  const m = new THREE.ShaderMaterial({
    uniforms: { cT: { value: untone(top) }, cB: { value: untone(bot) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 cT, cB; varying vec3 vP; void main(){ float k = smoothstep(-0.2, 0.7, vP.y); gl_FragColor = vec4(mix(cB, cT, k), 1.0); }",
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(rad, 32, 16), m); s.position.set(...c); s.layers.set(NOINK); s.renderOrder = -1; return s;
};
export class Lab {
  group = new THREE.Group();
  needleTip: THREE.Vector3;
  constructor(root: THREE.Object3D) {
    const G = this.group; root.add(G);
    const [x, , z] = LAB, b = new Batch();
    G.add(backdrop([x, 0, z], 40, "#1d2a4a", "#3e5a86"));
    const floor = new THREE.CircleGeometry(14, 48); floor.rotateX(-Math.PI / 2); floor.translate(x, 0, z);
    G.add(mk(floor, tmat("labFloor", () => new THREE.MeshLambertMaterial({ map: rep(gridTex("labGrid", "#d9dee6", "#b7bfcc"), 14, 14) }), 0.2)));
    // pedestal, clamp, the needle (tip up)
    b.add(at(cyl(0.32, 0.36, 0.95, 24), x, 0, z), lamC("#eef1f5", 0.35));
    b.add(at(cyl(0.38, 0.38, 0.06, 24), x, 0.95, z), lamC("#c9d0da", 0.35));
    b.add(at(cyl(0.05, 0.06, 0.12, 12), x, 1.01, z), phongC("#c9a04a", 60));
    b.add(at(cyl(0.012, 0.0004, 0.24, 16), x, 1.12, z), phongC("#a3a8b2", 90));
    this.needleTip = V(x, 1.36, z);
    // equipment around: racks with blinking lights, a big monitor
    for (const [dx, dz, ry] of [[-3.2, -2.4, 0.5], [3.4, -2.6, -0.5]]) {
      b.add(at(new THREE.BoxGeometry(1.1, 2.2, 0.7), x + dx, 1.1, z + dz, ry), lamC("#c8ced8", 0.35));
      for (let k = 0; k < 6; k++) b.add(at(new THREE.BoxGeometry(0.8, 0.05, 0.02), x + dx + Math.sin(ry) * 0.36, 0.6 + k * 0.25, z + dz + Math.cos(ry) * 0.36, ry), lamC("#5a6478"));
    }
    b.add(at(new THREE.BoxGeometry(1.6, 1.0, 0.08), x - 1.2, 1.7, z - 3.4, 0.2), lamC("#2a3140"));
    b.build(G);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.85), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.9, 1.3) }));
    screen.position.set(x - 1.2 + Math.sin(0.2) * 0.045, 1.7, z - 3.4 + Math.cos(0.2) * 0.045); screen.rotation.y = 0.2; G.add(screen);
    const leds = new THREE.Group();
    for (const [dx, dz, ry] of [[-3.2, -2.4, 0.5], [3.4, -2.6, -0.5]]) for (let k = 0; k < 6; k++) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: k % 2 ? new THREE.Color(0.4, 2.4, 0.8) : new THREE.Color(2.6, 0.6, 0.3) }));
      l.position.set(x + dx + Math.sin(ry) * 0.38 + Math.cos(ry) * 0.3, 0.66 + k * 0.25, z + dz + Math.cos(ry) * 0.38 - Math.sin(ry) * 0.3); leds.add(l);
    }
    G.add(leds);
  }
}

/** the giant atom lattice: hex layers shrinking to a single atom at the top */
export class Nano {
  group = new THREE.Group(); atoms: THREE.InstancedMesh; tipAtom: THREE.Mesh; slab: THREE.Mesh;
  pos: THREE.Vector3[] = []; vel: THREE.Vector3[] = []; layer: number[] = [];
  TOP = 6.4;
  private dummy = new THREE.Object3D();
  constructor(root: THREE.Object3D) {
    const G = this.group; root.add(G);
    const [x, , z] = NANO;
    G.add(backdrop([x, 0, z], 45, "#0d1430", "#28407a"));
    const floor = new THREE.CircleGeometry(16, 48); floor.rotateX(-Math.PI / 2); floor.translate(x, 0, z);
    G.add(mk(floor, tmat("nanoFloor", () => new THREE.MeshLambertMaterial({ map: rep(gridTex("nanoGrid", "#3a4f86", "#6f8fd6", 4), 16, 16) }), 0.4)));
    const R = 0.27, step = 0.52, r = rng(3);
    for (let k = 1; k < 13; k++) {
      const y = this.TOP - k * 0.46, rad = k * 0.27;
      for (let i = -14; i <= 14; i++) for (let j = -14; j <= 14; j++) {
        const px = (i + (j % 2) * 0.5) * step, pz = j * step * 0.866;
        if (Math.hypot(px, pz) > rad + 0.01) continue;
        this.pos.push(V(x + px, y, z + pz)); this.layer.push(k);
        const dir = V(px, 0.4 + r() * 0.6, pz).normalize();
        this.vel.push(dir.multiplyScalar(3 + r() * 4));
      }
    }
    const geo = new THREE.SphereGeometry(R, 20, 14);
    this.atoms = new THREE.InstancedMesh(geo, phongC("#8fb6ff", 80, "#ffffff", 0.45), this.pos.length);
    this.atoms.castShadow = true; this.atoms.receiveShadow = true;
    G.add(this.atoms);
    this.tipAtom = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 24, 16), phongC("#ffd36a", 90, "#ffffff", 0.6));
    this.tipAtom.position.set(x, this.TOP, z); this.tipAtom.castShadow = true; G.add(this.tipAtom);
    this.slab = mk(new THREE.BoxGeometry(5, 0.8, 5), lamC("#5d6b86", 0.35));
    G.add(this.slab);
    this.pose(-1, -1);
  }
  /** bump: seconds since the slab hits (<0: intact); slabY: slab bottom height (null = hidden) */
  pose(tb: number, slabDrop: number) {
    const [x, , z] = NANO;
    this.slab.visible = slabDrop >= 0;
    this.slab.position.set(x, this.TOP + 0.27 + 0.4 + (1 - slabDrop) * 5, z);
    for (let i = 0; i < this.pos.length; i++) {
      const p = this.pos[i], k = this.layer[i];
      if (tb >= 0 && k <= 3) {
        const v = this.vel[i], t = tb * (1.2 - k * 0.2);
        this.dummy.position.set(p.x + v.x * t, Math.max(0.27, p.y + (v.y - 4) * t * 0.6 - 2.5 * t * t), p.z + v.z * t);
      } else this.dummy.position.copy(p);
      this.dummy.updateMatrix(); this.atoms.setMatrixAt(i, this.dummy.matrix);
    }
    this.atoms.instanceMatrix.needsUpdate = true;
    if (tb >= 0) this.tipAtom.position.set(x + 1.2 * tb, Math.max(0.28, this.TOP - 1.0 * tb - 3 * tb * tb), z + 2.6 * tb);
    else this.tipAtom.position.set(x, this.TOP, z);
  }
}

/** cross-section of a blade edge, big: spine at the bottom, edge at the top; k = 0 razor V, 1 rounded hamaguri */
export class Diagram {
  group = new THREE.Group(); private mesh: THREE.Mesh; private ghost: THREE.Mesh; private k = -1; private edgeLine: THREE.Mesh;
  constructor(root: THREE.Object3D) {
    const G = this.group; root.add(G);
    const [x, , z] = DIAG;
    G.add(backdrop([x, 0, z], 30, "#f4c98f", "#f9e6c4"));
    const floor = new THREE.CircleGeometry(12, 40); floor.rotateX(-Math.PI / 2); floor.translate(x, 0, z);
    G.add(mk(floor, tmat("diagFloor", () => new THREE.MeshLambertMaterial({ map: rep(planksHD(), 3, 3) }), 0.25)));
    const b = new Batch();
    b.add(at(new THREE.BoxGeometry(1.05, 0.3, 0.6), x, 0.15, z), lamC("#6b4a32"));
    b.build(G);
    this.mesh = mk(new THREE.BufferGeometry(), phongC("#cfd8e2", 70, "#ffffff", 0.35));
    this.mesh.position.set(x, 0.3, z); G.add(this.mesh);
    this.ghost = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.35, 0.25), transparent: true, opacity: 0.35, depthWrite: false }));
    this.ghost.position.set(x, 0.3, z + 0.02); this.ghost.layers.set(NOINK); G.add(this.ghost);
    this.edgeLine = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.2, 1.6) }));
    G.add(this.edgeLine);
    this.set(0);
  }
  set(k: number) {
    if (Math.abs(k - this.k) < 1e-4) return;
    this.k = k;
    const H = 1.7, W = 0.85, n = 40, pts: THREE.Vector2[] = [];
    // right side from spine (bottom) to the edge (top); hamaguri bulges outward near the edge and blunts the apex
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = t * H;
      const straight = (W / 2) * (1 - t);
      const bulge = (W / 2) * (1 - t) ** 0.55 * (0.42 + 0.58 * (1 - t)) ;
      let w = straight + (Math.max(straight, bulge) - straight) * k;
      if (t > 0.985) w = Math.max(w, 0) ;
      pts.push(new THREE.Vector2(w, y));
    }
    const tipR = 0.004 + 0.05 * k;
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0);
    for (const p of pts) shape.lineTo(Math.max(p.x, tipR * (p.y > H - 0.2 ? 1 : 0)), Math.min(p.y, H - tipR * 0.5));
    for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-Math.max(pts[i].x, tipR * (pts[i].y > H - 0.2 ? 1 : 0)), Math.min(pts[i].y, H - tipR * 0.5));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, -0.175);
    this.mesh.geometry.dispose(); this.mesh.geometry = g;
    if (!this.ghost.geometry.attributes.position) {
      const gs = new THREE.Shape(); gs.moveTo(-W / 2, 0); gs.lineTo(W / 2, 0); gs.lineTo(0.004, H); gs.lineTo(-0.004, H); gs.closePath();
      const gg = new THREE.ShapeGeometry(gs); gg.translate(0, 0, 0.18); this.ghost.geometry = gg;
    }
    this.ghost.visible = false;
    this.edgeLine.position.set(DIAG[0], 0.3 + H - tipR * 0.5, DIAG[2] + 0.19);
    this.edgeLine.scale.setScalar(0.6 + 1.5 * k);
  }
}
