// Petrine Russia, 1720s, as one three.js set (metres, y up, ground y = 0):
//  - the village street along x (road z -3.5..3.5), log izbas gable-on to the street both sides (fronts at z = +-9)
//  - the white church with a blue onion dome and a tent-roofed bell tower at the west end (x -92)
//  - the graveyard south-west of it (fenced, mounds, three-bar Orthodox crosses) and, beyond, a sea of crosses
//  - ploughed strips and haystacks north of the village
//  - the tsar's palace square at x ~220: ochre Petrine palace with white pilasters and a gold spire, Peter's desk,
//    the empty treasure chest; the bank (columns, pediment) on the south side of the square
import * as THREE from "three";
import { V, lam, quad, tri, boxGeo, Batch, Ray, setSight, blocked, prop, Kit, chapelTex } from "./build";
import { ctex, rng, roofHD, stoneHD, grassHD, facadeHD } from "./paint";
import { twoTone } from "./shade";
import { CHURCH, GRAVE0, GRAVE1, PALACE_Z, PALACE_X0, PALACE_X1, BANK, DESK, IZBAS, GRAVES } from "./story";

// ---------------- painted textures ----------------
/** horizontal log wall at 128 px/m with carved, painted window surrounds (nalichniki) */
const logTex = (key: string, wm: number, hm: number, nWin: number, door = false) => ctex("log" + key, Math.round(wm * 128), Math.round(hm * 128), (g, r) => {
  const W = wm * 128, H = hm * 128, lh = 0.27 * 128;
  for (let y = H; y > -lh; y -= lh) {
    const base = ["#9a6a40", "#8f6039", "#a37147", "#946540"][Math.floor(r() * 4)];
    const gr = g.createLinearGradient(0, y - lh, 0, y);
    gr.addColorStop(0, "#6a4426"); gr.addColorStop(0.18, base); gr.addColorStop(0.55, "#b07c50"); gr.addColorStop(0.85, base); gr.addColorStop(1, "#3e2616");
    g.fillStyle = gr; g.fillRect(0, y - lh, W, lh);
    for (let k = 0; k < W / 60; k++) { g.strokeStyle = "rgba(60,36,20,0.25)"; g.lineWidth = 1.5; const x = r() * W; g.beginPath(); g.moveTo(x, y - lh * 0.6); g.lineTo(x + 30 + r() * 50, y - lh * 0.55); g.stroke(); }
  }
  // log ends at both corners
  for (let y = H - lh / 2; y > 0; y -= lh) for (const x of [lh * 0.45, W - lh * 0.45]) {
    g.fillStyle = "#c9a070"; g.beginPath(); g.arc(x, y, lh * 0.42, 0, 7); g.fill();
    g.strokeStyle = "#6a4426"; g.lineWidth = 2.5; g.stroke(); g.beginPath(); g.arc(x, y, lh * 0.2, 0, 7); g.stroke();
  }
  const win = (cx: number) => {
    const ww = 0.82 * 128, wh = 1.05 * 128, y0 = H - 2.3 * 128;
    g.fillStyle = "#f2efe6"; g.strokeStyle = "#2a1c22"; g.lineWidth = 3;
    // crown (kokoshnik) above, apron below, side boards
    g.beginPath(); g.moveTo(cx - ww * 0.85, y0 - 8); g.lineTo(cx, y0 - 0.55 * 128); g.lineTo(cx + ww * 0.85, y0 - 8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#3f6fb5"; g.beginPath(); g.moveTo(cx - ww * 0.5, y0 - 14); g.lineTo(cx, y0 - 0.38 * 128); g.lineTo(cx + ww * 0.5, y0 - 14); g.closePath(); g.fill();
    g.fillStyle = "#f2efe6"; g.fillRect(cx - ww * 0.72, y0 - 10, ww * 1.44, wh + 20); g.strokeRect(cx - ww * 0.72, y0 - 10, ww * 1.44, wh + 20);
    g.beginPath(); g.moveTo(cx - ww * 0.8, y0 + wh + 10); g.lineTo(cx + ww * 0.8, y0 + wh + 10); g.lineTo(cx + ww * 0.5, y0 + wh + 34); g.lineTo(cx - ww * 0.5, y0 + wh + 34); g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < 4; i++) { g.fillStyle = "#3f6fb5"; g.beginPath(); g.arc(cx - ww * 0.45 + i * ww * 0.3, y0 + wh + 22, 5, 0, 7); g.fill(); }
    const gl = g.createLinearGradient(0, y0, 0, y0 + wh); gl.addColorStop(0, "#5a6d9a"); gl.addColorStop(1, "#3b4870");
    g.fillStyle = gl; g.fillRect(cx - ww / 2, y0, ww, wh);
    g.strokeStyle = "#f2efe6"; g.lineWidth = 7; g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y0 + wh); g.moveTo(cx - ww / 2, y0 + wh * 0.4); g.lineTo(cx + ww / 2, y0 + wh * 0.4); g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - ww * 0.35, y0 + wh * 0.9); g.lineTo(cx - ww * 0.1, y0 + wh * 0.5); g.stroke();
    g.strokeStyle = "#2a1c22"; g.lineWidth = 3; g.strokeRect(cx - ww / 2, y0, ww, wh);
  };
  for (let i = 0; i < nWin; i++) win(((i + 0.5) / nWin) * W);
  if (door) {
    const dw = 0.95 * 128, dh = 1.9 * 128, cx = W * 0.5;
    g.fillStyle = "#6a4426"; g.fillRect(cx - dw / 2, H - dh, dw, dh);
    g.strokeStyle = "#3e2616"; g.lineWidth = 4; for (let x = cx - dw / 2 + 20; x < cx + dw / 2; x += 22) { g.beginPath(); g.moveTo(x, H - dh); g.lineTo(x, H); g.stroke(); }
    g.strokeStyle = "#2a1c22"; g.lineWidth = 4; g.strokeRect(cx - dw / 2, H - dh, dw, dh);
    g.fillStyle = "#2a1c22"; g.beginPath(); g.arc(cx + dw * 0.32, H - dh * 0.5, 6, 0, 7); g.fill();
  }
});
/** vertical boards for gables, with a small round attic window */
const gableTex = () => ctex("gableBoards", 512, 512, (g, r) => {
  for (let x = 0; x < 512; x += 32) { g.fillStyle = ["#8a5c36", "#94643c", "#7f5532"][Math.floor(r() * 3)]; g.fillRect(x, 0, 32, 512); g.fillStyle = "#4a2e1a"; g.fillRect(x, 0, 3, 512); }
  g.fillStyle = "#f2efe6"; g.beginPath(); g.arc(256, 300, 62, 0, 7); g.fill(); g.strokeStyle = "#2a1c22"; g.lineWidth = 4; g.stroke();
  g.fillStyle = "#3b4870"; g.beginPath(); g.arc(256, 300, 44, 0, 7); g.fill();
  g.strokeStyle = "#f2efe6"; g.lineWidth = 6; g.beginPath(); g.moveTo(212, 300); g.lineTo(300, 300); g.moveTo(256, 256); g.lineTo(256, 344); g.stroke();
});
const dirtTex = () => ctex("dirtRoad", 1024, 1024, (g, r) => {
  g.fillStyle = "#b08a5e"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "120,88,56" : "200,170,128"},${0.12 + 0.12 * r()})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10 + r() * 60, 6 + r() * 24, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(90,66,44,${0.3 + 0.3 * r()})`; g.beginPath(); g.arc(r() * 1024, r() * 1024, 1.5 + r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(110,80,50,0.35)"; g.lineWidth = 18; // wheel ruts along the road
  for (const y of [330, 700]) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 10 * Math.sin(x / 90)); g.stroke(); }
});
const furrowTex = () => ctex("furrows", 512, 512, (g, r) => {
  for (let y = 0; y < 512; y += 32) {
    const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, "#5e4028"); gr.addColorStop(0.5, "#8a6440"); gr.addColorStop(1, "#5a3c24");
    g.fillStyle = gr; g.fillRect(0, y, 512, 32);
  }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "60,40,24" : "150,115,78"},0.4)`; g.fillRect(r() * 512, r() * 512, 3 + r() * 6, 2 + r() * 3); }
});
const wheatTex = () => ctex("wheat", 512, 512, (g, r) => {
  g.fillStyle = "#d9b45a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = r() < 0.5 ? "rgba(240,210,120,0.6)" : "rgba(170,130,50,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 10); g.stroke(); }
});

// ---------------- pieces ----------------
const M = (x: number, y: number, z: number, yaw = 0, s: [number, number, number] = [1, 1, 1]) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(...s));
const roofM = (col: string) => lam("roof" + col, () => ({ map: roofHD(col, false), side: THREE.DoubleSide }));

/** log izba, gable end to the street: front (local +z) w wide, d deep, h to the eaves, steep gable roof (ridge along z) */
export const izba = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, h: number, v: number, door = false) => {
  const across = Math.abs(Math.sin(yaw)) > 0.5, hx = (across ? d : w) / 2 + 0.8, hz = (across ? w : d) / 2 + 0.8;
  if (!door && blocked(x - hx, x + hx, 0, h + w * 0.6, z - hz, z + hz)) return;
  const m = M(x, 0, z, yaw), hw = w / 2, hd = d / 2, rh = w * 0.55, o = 0.55;
  const front = lam(`izF${w}${h}${door}`, () => ({ map: logTex(`F${w}${h}${door}`, w, h, door ? 2 : 3, false) }));
  const side = lam(`izS${d}${h}${door}`, () => ({ map: logTex(`S${d}${h}${door}`, d, h, door ? 1 : 2, door) }));
  const back = lam(`izB${w}${h}`, () => ({ map: logTex(`B${w}${h}`, w, h, 0) }));
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), back, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  const gm = lam("gable", () => ({ map: gableTex() }));
  const gt = (zz: number, flip: boolean) => {
    const g = new THREE.BufferGeometry(), A = V(flip ? hw : -hw, h, zz), B = V(flip ? -hw : hw, h, zz), C = V(0, h + rh, zz);
    g.setAttribute("position", new THREE.Float32BufferAttribute([A, B, C].flatMap((q) => [q.x, q.y, q.z]), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(flip ? [1, 0, 0, 0, 0.5, 1] : [0, 0, 1, 0, 0.5, 1], 2)); g.computeVertexNormals();
    return g;
  };
  b.add(gt(hd, false), gm, m); b.add(gt(-hd, true), gm, m);
  const rm = roofM(["#7d7468", "#6f6a62", "#8a7a64"][v % 3]), ru = (d + 2 * o) / 3, rv = Math.hypot(hw + o, rh) / 3;
  b.add(quad(V(-hw - o, h - 0.3, -hd - o), V(-hw - o, h - 0.3, hd + o), V(0, h + rh + 0.05, hd + o), V(0, h + rh + 0.05, -hd - o), ru, rv), rm, m);
  b.add(quad(V(hw + o, h - 0.3, hd + o), V(hw + o, h - 0.3, -hd - o), V(0, h + rh + 0.05, -hd - o), V(0, h + rh + 0.05, hd + o), ru, rv), rm, m);
  // white carved barge boards on the street gable + ridge pole
  const trim = lam("izTrim", () => ({ color: "#f0ece2" }));
  const L = Math.hypot(hw + o, rh + 0.3), ang = Math.atan2(rh + 0.3, hw + o);
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(L, 0.32, 0.08).rotateZ(-s * ang).translate(s * ((hw + o) / 2), h - 0.3 + (rh + 0.3) / 2, hd + o + 0.02);
    b.add(g, trim, m);
  }
  b.add(new THREE.BoxGeometry(0.22, 0.22, d + 2 * o + 0.4).translate(0, h + rh + 0.12, 0), lam("ridgePole", () => ({ color: "#5a3c24" })), m);
  b.add(new THREE.BoxGeometry(0.5, 0.55, 0.1).translate(0, h + rh - 0.1, hd + o + 0.06), trim, m); // carved finial board
  b.add(boxGeo(V(-hw - 0.1, -0.05, -hd - 0.1), V(hw + 0.1, 0.35, hd + 0.1), 1), lam("izBase", () => ({ color: "#4e3a2a" })), m);
  b.add(boxGeo(V(hw * 0.3 - 0.35, h + rh * 0.4, -hd * 0.3 - 0.35), V(hw * 0.3 + 0.35, h + rh + 0.8, -hd * 0.3 + 0.35)), lam("izChim", () => ({ color: "#b06048" })), m);
  if (door) { // porch steps + little roof at the side door
    b.add(boxGeo(V(hw, 0, -0.9), V(hw + 1.2, 0.5, 0.9)), lam("porch", () => ({ color: "#8a6440" })), m);
    b.add(boxGeo(V(hw + 1.2, 0, -0.9), V(hw + 1.7, 0.25, 0.9)), lam("porch", () => ({ color: "#8a6440" })), m);
  }
};

/** three-bar Orthodox cross: top title bar, main bar, slanted foot bar */
const crossGeo = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    const parts = [
      new THREE.BoxGeometry(0.11, 1.9, 0.11).translate(0, 0.95, 0),
      new THREE.BoxGeometry(0.42, 0.09, 0.09).translate(0, 1.72, 0),
      new THREE.BoxGeometry(0.95, 0.11, 0.1).translate(0, 1.42, 0),
      new THREE.BoxGeometry(0.62, 0.09, 0.09).rotateZ(-0.38).translate(0, 0.62, 0),
    ];
    const b = new Batch(), grp = new THREE.Group(), m = lam("crossTmp", () => ({ color: "#fff" }));
    void b; void grp; void m;
    const merged = new THREE.BufferGeometry();
    const geos = parts.map((p) => p.toNonIndexed());
    let n = 0; for (const q of geos) n += q.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const q of geos) { pos.set(q.attributes.position.array as Float32Array, o * 3); nor.set(q.attributes.normal.array as Float32Array, o * 3); uv.set(q.attributes.uv.array as Float32Array, o * 2); o += q.attributes.position.count; }
    merged.setAttribute("position", new THREE.BufferAttribute(pos, 3)); merged.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g = merged; return g;
  };
})();
const mound = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);

// ---------------- the whole set ----------------
export const buildRussia = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(23);
  setSight(rays);
  const grass = lam("grassRu", () => ({ map: grassHD(), color: "#c9d2b4" }));
  const flat = (x0: number, x1: number, z0: number, z1: number, y: number, m: THREE.Material, tile: number) =>
    b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), m);
  flat(-700, 700, -700, 700, 0, grass, 9);
  const dirt = lam("dirtRoad", () => ({ map: dirtTex(), color: "#e2d6c4" }));
  flat(-150, 160, -3.6, 3.6, 0.02, dirt, 7.2);
  flat(-104, -80, -9, 9, 0.025, dirt, 7.2); // church yard
  // ---- izbas both sides of the street, plus fences (pleten) between them ----
  for (const [x, side, w, d, v, door] of IZBAS) izba(b, x, side * 13, side > 0 ? Math.PI : 0, w, d, 3.4 + (v % 2) * 0.4, v, door);
  const fenceW = lam("fenceWood", () => ({ color: "#8a6a48" }));
  for (const side of [-1, 1]) for (let x = -76; x < 84; x += 1.6) {
    if (IZBAS.some(([ix, s, w]) => s === side && Math.abs(x - ix) < w / 2 + 0.6)) continue;
    const z = side * 8.6;
    if (blocked(x - 0.8, x + 0.8, 0, 1.4, z - 0.2, z + 0.2, true)) continue;
    b.add(boxGeo(V(x - 0.06, 0, z - 0.06), V(x + 0.06, 1.35, z + 0.06)), fenceW);
    for (const y of [0.45, 1.0]) b.add(boxGeo(V(x - 0.8, y, z - 0.04), V(x + 0.8, y + 0.1, z + 0.04)), fenceW);
  }
  // ---- church at the west end (front toward +x) ----
  const [CX, , CZ] = CHURCH;
  const white = lam("churchWhite", () => ({ map: chapelTex() }));
  const plainW = lam("churchPlain", () => ({ color: "#efe8da" }));
  b.add(boxGeo(V(CX - 14, 0, CZ - 5.5), V(CX, 9, CZ + 5.5)), white);
  b.add(new THREE.CylinderGeometry(1.0, 1.0, 1, 4, 1).rotateY(Math.PI / 4).scale(10.4, 2.4, 7.8).translate(CX - 7, 10.2, CZ), roofM("#4f7a68"));
  b.add(new THREE.CylinderGeometry(2.6, 2.6, 4.2, 20).translate(CX - 7, 12.6, CZ), plainW);
  const onion = (r0: number) => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24, y = t * 2.2 * r0, rr = r0 * (t < 0.55 ? Math.sin((t / 0.55) * Math.PI * 0.62) * 1.12 : (1 - t) / 0.45 * 0.92 * Math.cos(((t - 0.55) / 0.45) * 0.9)); pts.push(new THREE.Vector2(Math.max(0.01, rr), y)); }
    return new THREE.LatheGeometry(pts, 28);
  };
  const blue = twoTone(new THREE.MeshPhongMaterial({ color: "#3f6fc5", specular: "#9ab8ff", shininess: 40 }), 0.2);
  const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#e0a82a", specular: "#fff0b0", shininess: 70 }), 0.2);
  b.add(onion(3.0).translate(CX - 7, 14.6, CZ), blue);
  const crossAt = (x: number, y: number, z: number, s: number) => b.add(crossGeo(), gold, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 2), V(s * 1.4, s, s * 1.4)));
  crossAt(CX - 7, 21.0, CZ, 1.6);
  // bell tower toward the street
  b.add(boxGeo(V(CX, 0, CZ - 2.4), V(CX + 4.8, 15, CZ + 2.4)), white);
  b.add(boxGeo(V(CX + 1.5, 0, CZ - 1.0), V(CX + 4.9, 3.2, CZ + 1.0)), lam("doorDark", () => ({ color: "#3a2a30" })));
  b.add(new THREE.ConeGeometry(3.3, 7, 8).translate(CX + 2.4, 18.5, CZ), roofM("#4f7a68"));
  b.add(onion(0.9).translate(CX + 2.4, 21.7, CZ), gold);
  crossAt(CX + 2.4, 23.6, CZ, 0.9);
  // ---- graveyard ----
  const [gx0, gz0] = GRAVE0, [gx1, gz1] = GRAVE1;
  const fence = lam("graveFence", () => ({ color: "#6a5642" }));
  for (const [ax, az, bx, bz] of [[gx0, gz0, gx1, gz0], [gx0, gz1, gx1, gz1], [gx0, gz0, gx0, gz1], [gx1, gz0, gx1, gz1]]) {
    const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 2.2);
    for (let i = 0; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / n, z = az + ((bz - az) * i) / n;
      if (az === gz0 && Math.abs(x - (gx0 + gx1) / 2) < 2 && bz === gz0) continue; // gate
      if (blocked(x - 1.1, x + 1.1, 0, 1.3, z - 1.1, z + 1.1, true)) continue;
      b.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 1.25, z + 0.07)), fence);
      if (i < n) { const dx = (bx - ax) / n, dz = (bz - az) / n; for (const y of [0.4, 0.95]) b.add(new THREE.BoxGeometry(Math.abs(dx) + 0.05 || 0.06, 0.08, Math.abs(dz) + 0.05 || 0.06).translate(x + dx / 2, y, z + dz / 2), fence); }
    }
  }
  const earth = lam("graveEarth", () => ({ color: "#7d6448" })), grassM = lam("moundGrass", () => ({ color: "#6a9a48" }));
  const wood = lam("crossWood", () => ({ color: "#6e5640" }));
  for (const [x, z, k] of GRAVES) {
    b.add(mound, k % 3 === 0 ? earth : grassM, new THREE.Matrix4().compose(V(x, -0.02, z + 0.9), new THREE.Quaternion(), V(0.7, 0.32, 1.2)));
    b.add(crossGeo(), wood, M(x, 0, z, (k % 5 - 2) * 0.04));
  }
  // the sea of crosses beyond (thousands, on paper)
  for (let x = gx0 - 4; x > -330; x -= 3.1) for (let z = gz0 + 2; z < 240; z += 3.4) {
    const jx = x + (r() - 0.5) * 1.4, jz = z + (r() - 0.5) * 1.2;
    if (blocked(jx - 0.5, jx + 0.5, 0, 2, jz - 0.5, jz + 0.5, true)) continue;
    b.add(crossGeo(), wood, M(jx, 0, jz, (r() - 0.5) * 0.3));
  }
  // ---- fields north of the village ----
  const furrow = lam("furrows", () => ({ map: furrowTex() })), wheat = lam("wheatF", () => ({ map: wheatTex() }));
  flat(-60, 80, -100, -20, 0.03, furrow, 8);
  flat(80, 150, -100, -20, 0.03, wheat, 6);
  const hay = lam("hay", () => ({ color: "#d8b25a" }));
  for (const [x, z] of [[92, -40], [110, -62], [128, -35], [100, -84], [-40, -110], [20, -112]]) {
    if (blocked(x - 2, x + 2, 0, 4, z - 2, z + 2, true)) continue;
    b.add(new THREE.ConeGeometry(2.0, 3.6, 14).translate(x, 1.8, z), hay);
  }
  // ---- palace square ----
  const pave = lam("paveRu", () => ({ map: stoneHD("copeHD", ["#cfc4b0", "#c4b8a2", "#d8cfbe", "#bdb09a"], "#a09280") }));
  flat(PALACE_X0 - 20, PALACE_X1 + 20, PALACE_Z, BANK[2] + 2, 0.03, pave, 4);
  flat(160, PALACE_X0 - 20, -3.6, 3.6, 0.02, dirt, 7.2);
  const pw = PALACE_X1 - PALACE_X0, ph = 13;
  const pal = lam("palaceF", () => ({ map: facadeHD("palaceF", 30, ph, { wall: "#e2b25e", shutter: "#f4efe2" }) }));
  const pz = PALACE_Z;
  for (let x = PALACE_X0; x < PALACE_X1 - 0.1; x += 30) b.add(quad(V(x, 0, pz), V(x + 30, 0, pz), V(x + 30, ph, pz), V(x, ph, pz)), pal);
  b.add(boxGeo(V(PALACE_X0 - 0.2, 0, pz - 18), V(PALACE_X0, ph, pz)), lam("palaceSide", () => ({ color: "#e2b25e" })));
  b.add(boxGeo(V(PALACE_X1, 0, pz - 18), V(PALACE_X1 + 0.2, ph, pz)), lam("palaceSide", () => ({ color: "#e2b25e" })));
  const pil = lam("pilaster", () => ({ color: "#f4efe4" }));
  for (let x = PALACE_X0; x <= PALACE_X1 + 0.1; x += 7.5) b.add(boxGeo(V(x - 0.4, 0, pz), V(x + 0.4, ph, pz + 0.35)), pil);
  b.add(boxGeo(V(PALACE_X0 - 0.4, ph - 0.8, pz), V(PALACE_X1 + 0.4, ph, pz + 0.6)), pil);
  b.add(boxGeo(V(PALACE_X0 - 0.4, 0, pz), V(PALACE_X1 + 0.4, 0.9, pz + 0.5)), lam("plinthRu", () => ({ color: "#bfb39e" })));
  const pr = roofM("#5f8a74");
  b.add(quad(V(PALACE_X0 - 0.5, ph, pz + 0.7), V(PALACE_X1 + 0.5, ph, pz + 0.7), V(PALACE_X1 - 3, ph + 4.5, pz - 9), V(PALACE_X0 + 3, ph + 4.5, pz - 9), pw / 4, 3), pr);
  // central risalit with pediment and the gold spire
  const mx = (PALACE_X0 + PALACE_X1) / 2;
  b.add(boxGeo(V(mx - 7, 0, pz), V(mx + 7, ph + 3, pz + 1.6)), lam("risalit", () => ({ map: facadeHD("risalit", 14, ph + 3, { wall: "#e8bd6a", shutter: "#f4efe2", door: true }) })));
  b.add(tri(V(mx - 7.4, ph + 3, pz + 1.7), V(mx + 7.4, ph + 3, pz + 1.7), V(mx, ph + 6.2, pz + 1.7)), pil);
  b.add(boxGeo(V(mx - 2.6, ph + 3, pz - 6), V(mx + 2.6, ph + 10, pz - 0.8)), lam("towerP", () => ({ color: "#e8bd6a" })));
  b.add(new THREE.ConeGeometry(2.4, 4, 4).rotateY(Math.PI / 4).translate(mx, ph + 12, pz - 3.4), pr);
  b.add(new THREE.ConeGeometry(0.35, 14, 8).translate(mx, ph + 21, pz - 3.4), gold);
  b.add(new THREE.SphereGeometry(0.5, 12, 8).translate(mx, ph + 14.2, pz - 3.4), gold);
  // ---- bank on the south side of the square (front toward -z) ----
  const [BX, , BZ] = BANK, bw = 22, bh = 10;
  b.add(boxGeo(V(BX - bw / 2, 0, BZ), V(BX + bw / 2, bh, BZ + 14)), lam("bankF", () => ({ map: facadeHD("bankF", bw, bh, { wall: "#e6dccb", shutter: "#5a6a7a", door: true }) })));
  const colM = lam("column", () => ({ color: "#f2ede2" }));
  for (let i = 0; i < 6; i++) b.add(new THREE.CylinderGeometry(0.45, 0.5, bh - 0.6, 16).translate(BX - 8 + i * 3.2, 0.6 + (bh - 0.6) / 2, BZ - 2.4), colM);
  b.add(boxGeo(V(BX - 10, bh - 0.2, BZ - 3.2), V(BX + 10, bh + 0.9, BZ)), colM);
  const pd = new THREE.BufferGeometry();
  pd.setAttribute("position", new THREE.Float32BufferAttribute([BX - 10.2, bh + 0.9, BZ - 3.3, BX + 10.2, bh + 0.9, BZ - 3.3, BX, bh + 4, BZ - 3.3], 3)); pd.computeVertexNormals();
  pd.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  b.add(pd, colM);
  for (let s = 0; s < 3; s++) b.add(boxGeo(V(BX - 10.5 + s * 0.2, 0, BZ - 4.4 + s * 0.6), V(BX + 10.5 - s * 0.2, 0.2 + s * 0.2, BZ)), colM);
  // ---- Peter's desk (green cloth) ----
  const [DX, , DZ] = DESK;
  const dw = lam("deskWood", () => ({ color: "#7a4a2a" }));
  b.add(boxGeo(V(DX - 1.2, 0.86, DZ - 0.55), V(DX + 1.2, 0.95, DZ + 0.55)), lam("deskCloth", () => ({ color: "#2f6a4a" })));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(DX + sx * 1.1 - 0.06, 0, DZ + sz * 0.45 - 0.06), V(DX + sx * 1.1 + 0.06, 0.86, DZ + sz * 0.45 + 0.06)), dw);
  // ---- trees: spruces and round trees behind the rows ----
  for (const side of [-1, 1]) for (let x = -70; x < 90; x += 9) {
    const z = side * (24 + r() * 8);
    if (side > 0 && x < -50) continue;
    prop(b, kit, r() < 0.55 ? "tree_cone" : "tree_default", x + r() * 4, 0, z, 7 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = 160 + r() * 140; prop(b, kit, r() < 0.7 ? "tree_cone" : "tree_oak", Math.cos(a) * d * 1.4, 0, Math.sin(a) * d, 10 + r() * 6, r() * 6); }
  for (const [x, z] of [[170, -14], [270, -14], [168, 24], [272, 24]]) prop(b, kit, "tree_default", x, 0, z, 7.5, x);
  b.build(root);
  setSight([]);
};
