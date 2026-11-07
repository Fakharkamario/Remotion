// Timeline of "The Man Who Taxed the Dead" (Peter the Great's soul tax, 1718-1724 census): 26 fast shots timed to
// the tightened ElevenLabs voice (shorts/deadtax/voice/words.json, word onsets in frames noted below). The Narrator
// (user's character) presents from the village street, the palace square and the graveyard.
// World layout (metres, y up, ground y = 0): village street along x (z -3.5..3.5), izbas fronting it at z = +-9,
// church at the west end (x -92), graveyard south-west of it, fields to the north, palace square + bank at x ~220.
export const FPS = 30;
export const TOTAL = 1690;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- set layout ----------------
export const CHURCH: V3 = [-92, 0, 0];
export const GRAVE0: [number, number] = [-120, 16], GRAVE1: [number, number] = [-62, 52];
export const PALACE_Z = -24, PALACE_X0 = 175, PALACE_X1 = 265;
export const BANK: V3 = [246, 0, 32];
export const DESK: V3 = [220, 0, -10];
export const CHEST: V3 = [212.4, 0, -5.4];
/** izbas: [x, side (-1 north / +1 south), width, depth, variant, side door + porch] */
export const IZBAS: [number, number, number, number, number, boolean][] = [];
for (const side of [-1, 1]) for (let x = -66, i = 0; x < 84; i++) {
  const w = [6.5, 7, 6][(i + (side > 0 ? 1 : 0)) % 3];
  IZBAS.push([x + w / 2, side, w, 8, i + (side > 0 ? 2 : 0), false]);
  x += w + 6 + (i % 2) * 2;
}
/** the grandfather's izba (north row, nearest x = 12): porch on its +x side */
export const GP_IZBA = IZBAS.reduce((a, b) => (b[1] < 0 && Math.abs(b[0] - 12) < Math.abs(a[0] - 12) ? b : a), IZBAS[0]);
GP_IZBA[5] = true;
/** the family pays at the fence on the street side of grandpa's izba */
export const FAM: V3 = [GP_IZBA[0] + 1.0, 0, -7.0];
export const PORCH: V3 = [GP_IZBA[0] + GP_IZBA[2] / 2 + 2.2, 0, -12.6];
/** graves: [x, z, k] (cross at z, mound in front toward +z) */
export const G_KEY: V3 = [-84, 0, 26];   // the ghost's grave (shots 4, 12)
export const G_END: V3 = [-80.5, 0, 23]; // grandpa's grave by the narrator (shot 26)
export const GRAVES: [number, number, number][] = [];
for (let x = GRAVE0[0] + 3, i = 0; x < GRAVE1[0] - 2; x += 3.6) for (let z = GRAVE0[1] + 4; z < GRAVE1[1] - 2; z += 4.4, i++) {
  if (Math.abs(x + 91) < 2.4) continue; // the path from the gate
  const jx = x + (hh(i, 1) - 0.5) * 0.9, jz = z + (hh(i, 2) - 0.5) * 0.8;
  if (Math.hypot(jx - G_KEY[0], jz - G_KEY[2]) < 2.6 || Math.hypot(jx - G_END[0], jz - G_END[2]) < 2.6) continue;
  if (Math.hypot(jx + 77.5, jz - 19.5) < 2.8 || Math.hypot(jx + 81.5, jz - 30) < 2.8) continue; // camera spots
  GRAVES.push([jx, jz, i]);
}
GRAVES.push([G_KEY[0], G_KEY[2], 3], [G_END[0], G_END[2], 6]);

// ---------------- cast spots ----------------
export const NA: V3 = [-30, 0, 0.4];   // narrator on the village street (church behind)
export const NB: V3 = [205, 0, 4];     // narrator on the palace square
export const NC: V3 = [-77.6, 0, 23.6]; // narrator in the graveyard (end)
export const PETER_AT: V3 = [214, 0, -6.2];
export const PETER_DESK: V3 = [220, 0, -11.3];
export const COLLECTOR_G: V3 = [-83.3, 0, 28.9];
export const FIELD: V3 = [0, 0, -36];

// ---------------- word cues (frames) ----------------
export const W = {
  account: 82, taxes1: 194, gold: 258, massive1: 289, problem: 307, dying: 341, year: 362, wiping: 389, rolls: 430,
  solution: 447, warfare: 508, written: 568, census1: 593, alive: 650, next: 711, twenty: 805, dropped: 871, dead2: 881,
  pay: 960, taxes2: 987, farming: 1065, absurd: 1100, secretly: 1158, buying: 1174, rights: 1207, thousands: 1219,
  ghost: 1284, collateral: 1319, massive2: 1350, loans: 1374, die: 1493, century: 1538, mistake: 1609, make: 1642,
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
const S = (id: number, a: number, b: number, light: Light = "day", sunAz?: number, sunEl?: number): ShotDef => ({ id, a, b, light, sunAz, sunEl });
export const SHOTS: ShotDef[] = [
  S(1, 0, 50),            // narrator: "Before you die in Russia"
  S(2, 50, 95),           // narrator + phone: "check your bank account"
  S(3, 95, 138),          // aerial: the village in the 1700s
  S(4, 138, 213),         // graveyard: a ghost gets his tax bill
  S(5, 213, 273),         // Peter, empty chest, the last coin
  S(6, 273, 322),         // Peter CU: "massive problem"
  S(7, 322, 375),         // field: peasants keel over mid-year
  S(8, 375, 442),         // tax roll: names vanish
  S(9, 442, 484),         // Peter's grin: "His solution"
  S(10, 484, 525),        // narrator nervous: "psychological warfare"
  S(11, 525, 613),        // Peter writes the census
  S(12, 613, 668),        // the ghost is stamped ALIVE
  S(13, 668, 755),        // narrator explains: "until the NEXT census"
  S(14, 755, 830),        // calendar pages fly: 15-20 years
  S(15, 830, 913),        // grandpa drops dead
  S(16, 913, 1000),       // the family pays his taxes
  S(17, 1000, 1082),      // ghost grandpa still farming
  S(18, 1082, 1118),      // narrator facepalm: "so absurd"
  S(19, 1118, 1219, "golden", 45, 12), // aristocrat buys dead souls at the graveyard gate
  S(20, 1219, 1274, "golden"),          // crane over thousands of crosses
  S(21, 1274, 1338, "golden", 130, 14), // ghost crowd follows him to the bank
  S(22, 1338, 1387, "golden", 120, 14), // massive bank loan
  S(23, 1387, 1445),      // narrator: "couldn't afford to live"
  S(24, 1445, 1508),      // narrator: "couldn't afford to die"
  S(25, 1508, 1560, "golden"),          // golden wide: over a century
  S(26, 1560, TOTAL, "golden", 45, 13), // graveyard: the most expensive mistake
];
/** crossfades (frames) at time-of-day changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 19: 6, 25: 8 };
export const FLASH_AT = 213;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
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
/** a shot of one subject: camera offset from the subject spot, looking at a height on it */
const on = (at: V3, off: V3, lookY: number, f0: number, rate: number, rest: Partial<Cam> = {}, punch = 0, lookOff: V3 = [0, 0, 0]) =>
  (f: number) => dolly(add(at, off), add([at[0], lookY, at[2]], lookOff), pushK(f, f0, rate, punch), rest);

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: on(NA, [3.9, 1.45, 0.9], 1.3, 0, 0.003, { fov: 40, roll: 0.03 }) }],
  2: [{ f: 50, s: on(NA, [2.0, 1.55, 0.6], 1.4, 50, 0.0025, { fov: 36 }) }, { f: W.account - 3, cut: true, s: on(NA, [1.5, 1.55, 0.5], 1.5, W.account - 3, 0.002, { fov: 34, roll: -0.035 }, 0.007) }],
  3: [{ f: 95, s: (f) => dolly([14, 20, 22], [-66, 2, 4], pushK(f, 95, 0.004), { fov: 46 }) }],
  4: [{ f: 138, s: on(G_KEY, [0.9, 1.6, 7.6], 1.0, 138, 0.0025, { fov: 42 }, 0, [0.3, 0, 2.2]) },
    { f: W.taxes1 - 2, cut: true, s: on(G_KEY, [0.6, 1.5, 6.4], 1.3, W.taxes1 - 2, 0.002, { fov: 38, roll: 0.04 }, 0.007, [0.35, 0, 2.3]) }],
  5: [{ f: 213, s: on(PETER_AT, [1.2, 1.45, 4.1], 1.15, 213, 0.0025, { fov: 42 }, 0, [-0.3, 0, 0.3]) }],
  6: [{ f: 273, s: on(PETER_AT, [0.7, 1.55, 2.0], 1.5, 273, 0.002, { fov: 34 }, 0.006) }, { f: W.problem - 2, cut: true, s: on(PETER_AT, [-0.6, 1.4, 1.5], 1.55, W.problem - 2, 0.003, { fov: 32, roll: 0.04 }) }],
  7: [{ f: 322, s: on(FIELD, [2.2, 1.6, 6.0], 0.9, 322, 0.0025, { fov: 44 }, 0, [0.6, 0, -3]) }, { f: W.year - 3, dur: 14, s: on(FIELD, [4.6, 1.3, 6.4], 0.7, W.year - 3, 0.002, { fov: 42, roll: -0.03 }, 0, [2.4, 0, -1]) }],
  8: [{ f: 375, s: on(DESK, [0.25, 1.6, 1.9], 1.45, 375, 0.003, { fov: 38 }, 0, [0, 0, 0.2]) }],
  9: [{ f: 442, s: on(PETER_DESK, [0.5, 1.6, 3.4], 1.55, 442, 0.003, { fov: 34, roll: -0.03 }, 0.006) }],
  10: [{ f: 484, s: on(NB, [1.6, 1.55, 2.0], 1.45, 484, 0.003, { fov: 36, roll: 0.03 }, 0.006) }],
  11: [{ f: 525, s: on(PETER_DESK, [1.0, 2.0, 5.0], 1.2, 525, 0.0025, { fov: 42 }, 0, [-0.4, 0, 0.7]) },
    { f: W.written - 4, dur: 22, s: on(PETER_DESK, [0.7, 1.9, 3.4], 1.3, W.written - 4, 0.0025, { fov: 38 }, 0, [0.1, 0, 0.6]) }],
  12: [{ f: 613, s: on(G_KEY, [0.9, 1.55, 6.4], 1.2, 613, 0.0025, { fov: 40 }, 0, [0.2, 0, 1.6]) }, { f: W.alive - 2, cut: true, s: on(G_KEY, [0.5, 1.6, 5.6], 1.6, W.alive - 2, 0.002, { fov: 38, roll: -0.04 }, 0.008, [0.2, 0, 1.6]) }],
  13: [{ f: 668, s: on(NA, [2.9, 1.5, 0.8], 1.35, 668, 0.0025, { fov: 38 }) }, { f: W.next - 2, cut: true, s: on(NA, [2.4, 1.45, 0.5], 1.55, W.next - 2, 0.003, { fov: 36, roll: 0.04 }, 0.007) }],
  14: [{ f: 755, s: on(NA, [-3.2, 1.3, -2.0], 1.25, 755, 0.004, { fov: 40, roll: -0.03 }) }],
  15: [{ f: 830, s: on(PORCH, [2.0, 1.5, 3.8], 1.25, 830, 0.0025, { fov: 40 }, 0, [-0.3, 0, 0]) }, { f: W.dropped - 2, cut: true, s: on(PORCH, [1.6, 1.5, 3.2], 0.45, W.dropped - 2, 0.002, { fov: 42, roll: 0.045 }, 0, [0.85, 0, 0]) }],
  16: [{ f: 913, s: on(FAM, [0.9, 1.6, 5.6], 1.25, 913, 0.0025, { fov: 44 }, 0, [0.4, 0, -0.3]) }, { f: W.pay - 3, dur: 20, s: on(FAM, [0.6, 1.5, 4.2], 1.3, W.pay - 3, 0.002, { fov: 40, roll: -0.03 }, 0, [0.5, 0, -0.2]) }],
  17: [{ f: 1000, s: on([FIELD[0] + 6, 0, FIELD[2]], [2.6, 1.6, 5.2], 1.25, 1000, 0.003, { fov: 40 }) }, { f: W.farming - 3, dur: 14, s: on([FIELD[0] + 6, 0, FIELD[2]], [1.8, 1.5, 3.8], 1.35, W.farming - 3, 0.002, { fov: 38, roll: 0.035 }) }],
  18: [{ f: 1082, s: on(NA, [2.3, 1.55, 0.6], 1.45, 1082, 0.004, { fov: 36, roll: -0.035 }, 0.006) }],
  19: [{ f: 1118, s: on([-90, 0, 15.1], [2.2, 1.6, -5.2], 1.3, 1118, 0.0025, { fov: 40 }) }, { f: W.buying - 3, cut: true, s: on([-90, 0, 15.1], [1.5, 1.5, -3.8], 1.3, W.buying - 3, 0.0025, { fov: 38, roll: 0.035 }) }],
  20: [{ f: 1219, s: (f) => { const u = glide((f - 1219) / 55); return { pos: [-64 + 8 * u, 2.5 + 26 * u, 14 - 10 * u] as V3, look: [-150, 0, 80 + 20 * u] as V3, fov: 46 - 4 * u, roll: 0 }; } }],
  21: [{ f: 1274, s: on([244.5, 0, 20], [-5.0, 1.9, -7.5], 1.7, 1274, 0.003, { fov: 46 }, 0, [0.3, 0, 1.0]) }],
  22: [{ f: 1338, s: on([245.4, 0, 27.5], [-1.8, 1.55, -4.6], 1.4, 1338, 0.0025, { fov: 40 }) }, { f: W.massive2 - 3, cut: true, s: on([245.4, 0, 27.5], [-1.2, 1.3, -3.2], 1.5, W.massive2 - 3, 0.003, { fov: 38, roll: -0.04 }, 0.007) }],
  23: [{ f: 1387, s: on(NA, [3.4, 1.45, 0.7], 1.3, 1387, 0.0025, { fov: 40, roll: -0.025 }) }],
  24: [{ f: 1445, s: on(NA, [1.9, 1.55, 0.5], 1.45, 1445, 0.0025, { fov: 36 }) }, { f: W.die - 3, cut: true, s: on(NA, [1.3, 1.55, 0.35], 1.52, W.die - 3, 0.002, { fov: 33, roll: 0.045 }, 0.008) }],
  25: [{ f: 1508, s: (f) => dolly([-48, 24, 64], [-96, 2, 18], pushK(f, 1508, 0.0035), { fov: 44 }) }],
  26: [{ f: 1560, s: on(NC, [2.4, 1.5, -4.0], 1.3, 1560, 0.0025, { fov: 40 }, 0, [-0.8, 0, 0]) },
    { f: W.mistake - 3, cut: true, s: on(NC, [1.3, 1.45, -3.8], 1.3, W.mistake - 3, 0.002, { fov: 38, roll: 0.03 }, 0, [-0.4, 0, 0.3]) },
    { f: 1648, dur: 40, s: on(NC, [3.6, 2.2, -6.0], 1.3, 1648, 0.0015, { fov: 44 }, 0, [-0.8, 0, 0]) }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[W.taxes1, 0.8], [W.gold + 6, 0.5], [W.dying + 6, 0.6], [W.year + 6, 0.5], [W.census1, 0.9], [W.alive, 1.2],
  [W.dead2, 0.9], [W.massive2, 1.0], [W.die, 0.8], [W.mistake, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor(t * FPS - f0 + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
const T = (f: number) => f / FPS;
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const eyes = (p: V3, y = 1.55): (() => V3) => () => [p[0], y, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: eyes(NA) }, { f: 50, cInf: 13, focus: eyes(NA) }, { f: 95, cInf: 0 },
  { f: 138, cInf: 8, focus: eyes(G_KEY, 1.4) }, { f: 213, cInf: 10, focus: eyes(PETER_AT) }, { f: 273, cInf: 13, focus: eyes(PETER_AT) },
  { f: 322, cInf: 7, focus: eyes(FIELD, 1.3) }, { f: 375, cInf: 15, focus: () => [DESK[0], 1.45, DESK[2] + 0.2] },
  { f: 442, cInf: 13, focus: eyes(PETER_DESK) }, { f: 484, cInf: 13, focus: eyes(NB) }, { f: 525, cInf: 9, focus: () => [PETER_DESK[0], 1.2, PETER_DESK[2] + 1] },
  { f: 613, cInf: 11, focus: eyes(G_KEY, 1.4) }, { f: 668, cInf: 12, focus: eyes(NA) }, { f: 755, cInf: 10, focus: eyes(NA) },
  { f: 830, cInf: 10, focus: () => [PORCH[0], 1.8, PORCH[2]] }, { f: 913, cInf: 9, focus: () => [FAM[0], 1.5, FAM[2]] },
  { f: 1000, cInf: 9, focus: () => [FIELD[0] + 6, 1.5, FIELD[2]] }, { f: 1082, cInf: 13, focus: eyes(NA) },
  { f: 1118, cInf: 9, focus: () => [-89.6, 1.5, 14.9] }, { f: 1219, cInf: 0 }, { f: 1274, cInf: 4, focus: () => [244.5, 1.5, 20] },
  { f: 1338, cInf: 10, focus: () => [245.4, 1.5, 27.5] }, { f: 1387, cInf: 11, focus: eyes(NA) }, { f: 1445, cInf: 13, focus: eyes(NA) },
  { f: 1508, cInf: 0 }, { f: 1560, cInf: 10, focus: eyes(NC) }, { f: 1648, dur: 30, cInf: 6, focus: eyes(NC) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

/** near framing objects (cartoon vegetation names from build.ts): visible while a <= f < b inside their own shot */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 0, b: 50, kit: "plant_bushDetailed", pos: [NA[0] + 3.0, 0, NA[2] + 3.3], s: 0.9, yaw: 0.4 },
  { a: 1387, b: 1445, kit: "plant_bush", pos: [NA[0] + 1.6, 0, NA[2] + 3.4], s: 0.8, yaw: 1.2 },
];
