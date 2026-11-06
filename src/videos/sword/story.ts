// Timeline of "How Sharp Can a Sword Get?": shots timed to the ElevenLabs read (shorts/sword/voice/words.json, word
// onsets in frames noted below), camera grammar of the bridge short (continuous push-ins, smootherstep glides, cuts
// for big reframes, flip-sign kicks on impacts).
// Places (metres, y up): the YARD at the origin (polisher's house on its engawa to the north, forge shed west,
// tomato table + test-cut stand east, bamboo grove further east); the AZTEC plaza at x = 300; the LAB at x = -300
// and the NANO set (giant atom lattice) at x = -300, z = 80; the edge DIAGRAM stage at x = 0, z = 300.
export const FPS = 30;
export const TOTAL = 1695;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const easeIn = (u: number) => clamp01(u) ** 2;
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ---------------- places ----------------
export const ENGAWA_Y = 0.45, ENGAWA_Z = -3.2;          // veranda floor height, front edge
export const POLISHER_AT: V3 = [1.2, ENGAWA_Y, -3.95];   // kneeling, facing +z
export const STONES_Z = -3.55;                           // row of whetstones in front of the polisher (on the engawa)
export const FORGE: V3 = [-9, 0, -2];                    // shed centre
export const ANVIL: V3 = [-8.4, 0, -0.9];
export const HEARTH: V3 = [-10.3, 0, -2.8];
export const TROUGH: V3 = [-6.9, 0, -1.6];
export const SMITH_AT: V3 = [-8.4, 0, -1.65];
export const WHET: V3 = [-2.2, 0, 2.6];                  // narrator's whetstone block (shot 2)
export const TABLE: V3 = [3.4, 0, 1.6];                  // tomato table
export const MAT: V3 = [7.4, 0, 0.6];                    // test-cut stand
export const BAMBOO_T: V3 = [13.2, 0, 0.8];              // the stalk he swings at
export const AZ: V3 = [300, 0, 0];                       // Aztec plaza centre
export const LAB: V3 = [-300, 0, 0];
export const NANO: V3 = [-300, 0, 80];
export const DIAG: V3 = [0, 0, 300];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Place = "yard" | "aztec" | "lab" | "nano" | "diag";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: Place; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 68, light: "day", place: "yard", sunAz: 120, sunEl: 40 },        // hook: the narrator and his katana
  { id: 2, a: 68, b: 163, light: "day", place: "yard", sunAz: 130, sunEl: 40 },      // sharpening like mad
  { id: 3, a: 163, b: 255, light: "day", place: "yard", sunAz: 110, sunEl: 42 },     // smith: forge, quench, hand over
  { id: 4, a: 255, b: 322, light: "day", place: "yard", sunAz: 120, sunEl: 40 },     // dull: paper bends
  { id: 5, a: 322, b: 497, light: "day", place: "yard", sunAz: 125, sunEl: 40 },     // the polisher, finer stones
  { id: 6, a: 497, b: 588, light: "day", place: "yard", sunAz: 120, sunEl: 42 },     // tomato
  { id: 7, a: 588, b: 746, light: "day", place: "yard", sunAz: 115, sunEl: 40 },     // tatami mat
  { id: 8, a: 746, b: 863, light: "day", place: "yard", sunAz: 120, sunEl: 40 },     // hair
  { id: 9, a: 863, b: 953, light: "day", place: "yard", sunAz: 125, sunEl: 40 },     // bamboo: the edge crumples
  { id: 10, a: 953, b: 1085, light: "day", place: "aztec", sunAz: 120, sunEl: 45 },  // obsidian
  { id: 11, a: 1085, b: 1198, light: "day", place: "aztec", sunAz: 125, sunEl: 45 }, // macuahuitl vs steel
  { id: 12, a: 1198, b: 1328, light: "day", place: "lab" },                          // the tungsten needle
  { id: 13, a: 1328, b: 1440, light: "day", place: "nano" },                         // a single atom ... bump
  { id: 14, a: 1440, b: 1500, light: "golden", place: "yard", sunAz: 130, sunEl: 20 },// polisher stops early
  { id: 15, a: 1500, b: 1595, light: "day", place: "diag" },                      // rounded edge cross-section
  { id: 16, a: 1595, b: TOTAL, light: "golden", place: "yard", sunAz: 125, sunEl: 20 },// the best sword
];
export const XFADE: Record<number, number> = { 10: 8, 12: 8, 13: 10, 14: 10, 15: 8, 16: 8 };
export const FLASH_AT = 163;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (frames) ----------------
export const B = {
  cantCut: 46, shrug: 52, sharpen0: 80, why: 150,
  hit1: 168, hit2: 180, hit3: 192, quench: 211, handOver: 232, dull: 272, paper: 300, bends: 310,
  edge: 325, polisher: 378, weeks: 399, stones: 450, finer: 486,
  bites: 534, tomato: 553, halved: 572,
  finish: 591, slice: 629, sits: 716, slide: 738,
  keep: 749, razor: 775, pluck: 800, drop: 822, split: 846,
  swing: 879, hit: 893, crumple: 920,
  glass: 966, obsidian: 999, knap: 1012, nm: 1046,
  aztec: 1092, swingAz: 1140, steel: 1152, shatter: 1160,
  step: 1200, needle: 1300, tip: 1334, atom: 1350, bump: 1386, ruined: 1428,
  stop: 1480, round: 1508, less: 1556, best: 1612, sharpest: 1656,
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 30) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// narrator marks per shot (also read by stage.ts)
export const N1: V3 = [0.2, 0, 3.6];
export const N2: V3 = [WHET[0] + 0.05, 0, WHET[2] - 0.6];
export const N3: V3 = [-7.0, 0, 0.1];
export const N5: V3 = [3.2, 0, -1.6];
export const N6: V3 = [TABLE[0] + 0.05, 0, TABLE[2] - 0.52];
export const N7: V3 = [MAT[0] - 0.66, 0, MAT[2] - 0.46];
export const N9: V3 = [BAMBOO_T[0] - 0.85, 0, BAMBOO_T[2] - 0.6];
export const N10: V3 = [AZ[0] + 0.3, 0, AZ[2] + 4];
export const N11: V3 = [AZ[0] - 0.75, 0, AZ[2] + 4.05];
export const AZTEC_AT: V3 = [AZ[0] + 0.75, 0, AZ[2] + 4.15];
export const N12: V3 = [LAB[0] + 0.8, 0, LAB[2] + 0.6];
export const NEEDLE: V3 = [LAB[0], 0, LAB[2]];
export const N13: V3 = [NANO[0] + 4.3, 0, NANO[2] + 3.0];
export const N16: V3 = [POLISHER_AT[0] + 1.6, 0, -2.3];

const S1a = (f: number) => dolly(add(N1, [0.35, 1.45, 3.1]), add(N1, [0, 1.25, 0]), pushK(f, 0, 0.003), { fov: 38 });
const S1b = (f: number) => dolly(add(N1, [0.2, 1.4, 2.5]), add(N1, [0, 1.3, 0]), pushK(f, 44, 0.004, 0.008, 20), { fov: 38, roll: 0.04 });
const S2a = (f: number) => dolly(add(N2, [1.2, 1.3, 3.0]), add(N2, [0.05, 0.75, 0.35]), pushK(f, 68, 0.003), { fov: 40, roll: -0.03 });
const S2b = (f: number) => dolly(add(N2, [0.35, 1.2, 2.4]), add(N2, [0, 1.0, 0]), pushK(f, 140, 0.004, 0.009, 20), { fov: 38 });
const S3a = (f: number) => dolly(add(ANVIL, [2.4, 1.3, 3.2]), add(ANVIL, [-0.1, 0.85, -0.2]), pushK(f, 163, 0.003), { fov: 40, roll: 0.03 });
const S3b = (f: number) => dolly(add(TROUGH, [-0.5, 1.5, 2.9]), add(TROUGH, [-0.45, 0.85, 0]), pushK(f, 207, 0.003), { fov: 42 });
const S3c = (f: number) => dolly([-7.7, 1.5, 4.2], [-7.76, 1.15, -0.35], pushK(f, 228, 0.003), { fov: 40, roll: -0.03 });
const S4a = (f: number) => dolly(add(N3, [0.5, 1.4, 2.4]), add(N3, [0.05, 1.15, 0]), pushK(f, 255, 0.003), { fov: 38 });
const S4b = (f: number) => dolly(add(N3, [0.35, 1.25, 1.45]), add(N3, [0.12, 1.05, 0.25]), pushK(f, 296, 0.003, 0.007, 20), { fov: 36, roll: 0.035 });
const S5a = (f: number) => dolly([6.8, 1.7, 5.6], [1.6, 0.95, -3.2], pushK(f, 322, 0.0022), { fov: 42 });
const S5b = (f: number) => dolly([2.6, 1.25, -0.6], [1.25, 0.85, -3.7], pushK(f, 396, 0.003), { fov: 38, roll: -0.03 });
const S5c = (f: number) => { const u = smooth((f - 444) / 52); return { pos: [lerp(1.7, 3.9, u), 1.2, -1.75] as V3, look: [lerp(2.0, 3.85, u), 0.52, STONES_Z] as V3, fov: 34, roll: 0.02 }; };
const S6a = (f: number) => dolly(add(TABLE, [0.9, 1.5, 2.6]), add(TABLE, [0, 0.95, 0]), pushK(f, 497, 0.003), { fov: 38 });
const S6b = (f: number) => dolly(add(TABLE, [0.4, 1.25, 1.1]), add(TABLE, [0, 0.82, 0]), pushK(f, 550, 0.003, 0.008, 20), { fov: 36, roll: 0.035 });
const S7a = (f: number) => dolly(add(MAT, [0.9, 1.4, 4.6]), add(MAT, [-0.4, 1.1, -0.2]), pushK(f, 588, 0.0025), { fov: 40 });
const S7b = (f: number) => dolly(add(MAT, [0.7, 1.35, 2.0]), add(MAT, [0, 1.2, 0]), pushK(f, 690, 0.003, 0.006, 20), { fov: 36, roll: -0.03 });
const S8a = (f: number) => dolly(add(N7, [0.4, 1.45, 2.4]), add(N7, [0, 1.3, 0]), pushK(f, 746, 0.003), { fov: 38 });
const S8b = (f: number) => dolly(add(N7, [-0.66, 1.2, 0.5]), add(N7, [-0.01, 1.14, 0.89]), pushK(f, 818, 0.0035, 0.008, 22), { fov: 34, roll: 0.03 });
const S9a = (f: number) => dolly(add(N9, [1.3, 1.35, 3.9]), add(N9, [0.45, 1.2, 0.3]), pushK(f, 863, 0.003), { fov: 42, roll: 0.03 });
const S9b = (f: number) => dolly(add(N9, [0.5, 1.35, 2.3]), add(N9, [0.1, 1.22, 0.2]), pushK(f, 912, 0.003, 0.006, 20), { fov: 36 });
const S10a = (f: number) => dolly(add(N10, [0.5, 1.5, 3.0]), add(N10, [0, 1.3, 0]), pushK(f, 953, 0.003), { fov: 40 });
const S10b = (f: number) => dolly(add(N10, [0.4, 1.35, 2.1]), add(N10, [0.05, 1.22, 0.2]), pushK(f, 996, 0.0035), { fov: 36, roll: -0.03 });
const S10c = (f: number) => dolly(add(N10, [0.5, 1.32, 1.95]), add(N10, [0.12, 1.2, 0.35]), pushK(f, 1030, 0.003), { fov: 34, roll: 0.02 });
const S11a = (f: number) => dolly(add(AZ, [0.2, 1.5, 8.6]), add(AZ, [0, 1.25, 4.2]), pushK(f, 1085, 0.0025), { fov: 42 });
const S11b = (f: number) => dolly(add(AZ, [0.25, 1.75, 7.4]), add(AZ, [-0.1, 1.55, 4.1]), pushK(f, 1150, 0.004), { fov: 40, roll: 0.04 });
const S12a = (f: number) => dolly(add(LAB, [1.6, 1.6, 4.2]), add(LAB, [0.4, 1.1, 0]), pushK(f, 1198, 0.003), { fov: 40 });
const S12b = (f: number) => { const u = easeIn((f - 1250) / 78); return { pos: lerp3(add(LAB, [0.9, 1.5, 2.3]), add(LAB, [0.03, 1.36, 0.16]), u), look: lerp3(add(LAB, [0.2, 1.2, 0]), add(LAB, [0, 1.32, 0]), u), fov: lerp(38, 30, u), roll: 0.02 }; };
const S13a = (f: number) => { const u = easeOut((f - 1328) / 26); return { pos: lerp3(add(NANO, [0, 6.6, 1.4]), add(NANO, [6.0, 2.6, 10.5]), u), look: lerp3(add(NANO, [0, 6.3, 0]), add(NANO, [1.8, 3.0, 0.5]), u), fov: 42, roll: 0 }; };
const S13b = (f: number) => dolly(add(NANO, [6.0, 2.6, 10.5]), add(NANO, [1.8, 3.0, 0.5]), pushK(f, 1356, 0.0025), { fov: 42 });
const S13c = (f: number) => dolly(add(N13, [0.35, 1.45, 2.5]), add(N13, [0.02, 1.32, 0]), pushK(f, 1400, 0.004, 0.007, 20), { fov: 38, roll: 0.04 });
const S14a = (f: number) => dolly([2.2, 1.35, -0.2], [1.2, 1.05, -3.9], pushK(f, 1440, 0.0025), { fov: 38 });
const S14b = (f: number) => dolly([1.75, 1.3, -1.6], [1.18, 1.2, -3.9], pushK(f, 1478, 0.003), { fov: 34, roll: 0.03 });
const S15a = (f: number) => dolly(add(DIAG, [0.0, 1.25, 5.0]), add(DIAG, [-0.35, 1.1, 0]), pushK(f, 1500, 0.002), { fov: 38 });
const S16a = (f: number) => dolly(add(N16, [0.6, 1.4, 2.4]), add(N16, [0, 1.25, 0]), pushK(f, 1595, 0.002), { fov: 38 });
const S16b = (f: number): Shot => { const u = glide((f - 1640) / 55); return { pos: lerp3(add(N16, [0.6, 1.4, 2.25]), add(N16, [1.8, 3.6, 9.5]), u), look: lerp3(add(N16, [0, 1.25, 0]), add(N16, [-1.2, 1.2, -2]), u), fov: lerp(38, 44, u), roll: 0 }; };

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 44, dur: 18, s: S1b }],
  2: [{ f: 68, s: S2a }, { f: 140, dur: 18, s: S2b }],
  3: [{ f: 163, s: S3a }, { f: 207, cut: true, s: S3b }, { f: 228, cut: true, s: S3c }],
  4: [{ f: 255, s: S4a }, { f: 296, dur: 18, s: S4b }],
  5: [{ f: 322, s: S5a }, { f: 396, cut: true, s: S5b }, { f: 444, cut: true, s: S5c }],
  6: [{ f: 497, s: S6a }, { f: 550, dur: 16, s: S6b }],
  7: [{ f: 588, s: S7a }, { f: 690, cut: true, s: S7b }],
  8: [{ f: 746, s: S8a }, { f: 818, cut: true, s: S8b }],
  9: [{ f: 863, s: S9a }, { f: 912, cut: true, s: S9b }],
  10: [{ f: 953, s: S10a }, { f: 996, cut: true, s: S10b }, { f: 1030, dur: 20, s: S10c }],
  11: [{ f: 1085, s: S11a }, { f: 1150, cut: true, s: S11b }],
  12: [{ f: 1198, s: S12a }, { f: 1250, dur: 24, s: S12b }],
  13: [{ f: 1328, s: S13a }, { f: 1356, dur: 18, s: S13b }, { f: 1400, cut: true, s: S13c }],
  14: [{ f: 1440, s: S14a }, { f: 1478, dur: 22, s: S14b }],
  15: [{ f: 1500, s: S15a }],
  16: [{ f: 1595, s: S16a }, { f: 1640, s: S16b }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[B.hit1, 0.4], [B.hit2, 0.4], [B.hit3, 0.5], [B.slice, 0.5], [B.hit, 1.3], [B.knap, 0.4], [B.steel, 1.5], [B.bump, 0.9]];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor(f - f0 + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (p: V3): V3 => [p[0], 1.4, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 12, focus: () => eyes(N1) },
  { f: 68, cInf: 10, focus: () => eyes(N2) },
  { f: 163, cInf: 8, focus: () => [SMITH_AT[0], 1.3, SMITH_AT[2]] },
  { f: 207, cInf: 8, focus: () => [TROUGH[0] - 0.4, 0.8, TROUGH[2]] },
  { f: 228, cInf: 9, focus: () => [-7.7, 1.2, -0.6] },
  { f: 255, cInf: 12, focus: () => eyes(N3) },
  { f: 322, cInf: 0 },
  { f: 396, cInf: 10, focus: () => [POLISHER_AT[0], 1.2, POLISHER_AT[2]] },
  { f: 444, cInf: 12, focus: () => [1.2, 0.5, STONES_Z] },
  { f: 497, cInf: 10, focus: () => [TABLE[0], 0.9, TABLE[2]] },
  { f: 588, cInf: 6, focus: () => [MAT[0] - 0.4, 1.1, MAT[2]] },
  { f: 690, cInf: 11, focus: () => [MAT[0], 1.25, MAT[2]] },
  { f: 746, cInf: 11, focus: () => eyes(N7) },
  { f: 818, cInf: 12, focus: () => [N7[0] - 0.01, 1.12, N7[2] + 0.89] },
  { f: 863, cInf: 6, focus: () => [N9[0] + 0.1, 1.3, N9[2]] },
  { f: 912, cInf: 11, focus: () => eyes(N9) },
  { f: 953, cInf: 10, focus: () => eyes(N10) },
  { f: 996, cInf: 13, focus: () => [N10[0] + 0.1, 1.15, N10[2] + 0.35] },
  { f: 1085, cInf: 7, focus: () => [AZ[0], 1.4, AZ[2] + 4.2] },
  { f: 1150, cInf: 6, focus: () => [N11[0] + 0.2, 1.6, N11[2]] },
  { f: 1198, cInf: 8, focus: () => [LAB[0] + 0.3, 1.2, LAB[2] + 0.3] },
  { f: 1328, cInf: 6, focus: () => [NANO[0] + 0.6, 3.0, NANO[2]] },
  { f: 1400, cInf: 11, focus: () => eyes(N13) },
  { f: 1440, cInf: 10, focus: () => [POLISHER_AT[0], 1.15, POLISHER_AT[2]] },
  { f: 1500, cInf: 0 },
  { f: 1595, cInf: 10, focus: () => eyes(N16) },
  { f: 1640, dur: 50, cInf: 3, focus: () => eyes(N16) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
