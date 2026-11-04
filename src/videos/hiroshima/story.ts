// Timeline of "60 Seconds" (Hiroshima, 6 August 1945): shots timed to the narration (shorts/hiroshima/voice/words.json,
// silences cut; word onsets in frames noted below), the camera grammar of the bridge short (slow push-ins, smootherstep
// glides, hard cuts on the beats) and the countdown beats (60 .. 1).
// World layout (metres, y up, ground y = 0): the main street runs along x (z -8..8); the old couple's house is on its
// north side (ROOM, front wall at z = 8.5, window facing the street); the river crosses the town at z -62..-36; the domed
// Industrial Promotion Hall stands on the south bank (DOME); the bomb bursts 300 m over HYPO; the ending hill is
// north-east of town (END_HILL).
export const FPS = 30;
export const TOTAL = 1650;
export const D0 = 0;
export type V3 = [number, number, number];

export const STREET_Z0 = -8, STREET_Z1 = 8;
export const RIVER_Z0 = -62, RIVER_Z1 = -36;
export const ROOM = { x0: -4, x1: 4, z0: 8.5, z1: 14.5, fy: 0.45, cy: 3.0 };
export const WIN = { x0: -1.5, x1: 1.5, y0: 1.35, y1: 2.45 };
export const DOME: V3 = [-40, 0, -88];
export const HYPO: V3 = [-10, 0, -125];
export const BURST_Y = 300;
export const END_HILL: V3 = [230, 34, 340];
/** height of the ending hill's surface (ellipsoid cap 90 x 40 x 70 m) */
export const hillY = (x: number, z: number) => {
  const u = ((x - END_HILL[0]) / 90) ** 2 + ((z - END_HILL[2]) / 70) ** 2;
  return u >= 1 ? 0 : END_HILL[1] - 40 + 40 * Math.sqrt(1 - u);
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- word beats (frames) ----------------
export const W = {
  sixty: 0, hiroshima: 28, august: 39, sixth: 62, y1945: 104, home: 165, couple: 201, sips: 212, tea: 237,
  siren: 255, falseAlarm: 285, orSo: 313, thought: 346,
  fifty: 362, sunlight: 382, windows: 430, laughs: 457, says: 482, children: 500, chase: 511, klass: 565,
  forty: 585, drone: 618, above: 669, nobody: 687, up: 706, planes: 717, time: 749,
  thirty: 764, drone2: 785, heavier: 804, oldMan: 828, pushes: 843, open: 867, silver: 883, bombers: 896, glint: 912, sky: 942,
  twenty: 959, why: 979, sirens: 991, pats: 1027, sit: 1054, finish: 1074, yourTea: 1086,
  ten: 1099, tiny: 1118, dot: 1144, slips: 1153, plane: 1181, falls: 1204, sunBright: 1230, city: 1249,
  five: 1264, stands: 1290, slowly: 1305, three: 1326, takes: 1348, hand: 1360, one: 1376,
  then: 1401, white: 1445, year: 1482, people: 1561, gone: 1577,
};
/** the detonation (the flash lands on "then") */
export const FLASH_F = 1403;
export const WHITE_FULL = 1440, WHITE_HOLD = 1462, WHITE_OUT = 1500;
export const FADE0 = 1606;
/** countdown beats shown as a big number (frame, value) */
export const COUNT: [number, number][] = [[0, 60], [W.fifty, 50], [W.forty, 40], [W.thirty, 30], [W.twenty, 20], [W.ten, 10], [W.five, 5], [W.three, 3], [W.one, 1]];

// ---------------- shots ----------------
export type Light = "day" | "golden" | "room" | "dusk";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 62, light: "day", sunAz: 120, sunEl: 40 },          // narrator in the street: "Sixty seconds. Hiroshima"
  { id: 2, a: 62, b: 142, light: "day", sunAz: 110, sunEl: 35 },        // aerial: the city on the river, the dome
  { id: 3, a: 142, b: 253, light: "room", sunAz: 10, sunEl: 26 },       // the couple at breakfast; CU sip
  { id: 4, a: 253, b: 362, light: "day", sunAz: 130, sunEl: 42 },       // the silent siren; narrator CU "or so everyone thought"
  { id: 5, a: 362, b: 451, light: "room", sunAz: -8, sunEl: 24 },       // FIFTY: sunlight through the paper windows
  { id: 6, a: 451, b: 500, light: "room", sunAz: 12, sunEl: 26 },       // she laughs
  { id: 7, a: 500, b: 585, light: "day", sunAz: 125, sunEl: 40 },       // kids chase down the street
  { id: 8, a: 585, b: 687, light: "day", sunAz: 150, sunEl: 40 },       // FORTY: the drone far above
  { id: 9, a: 687, b: 764, light: "day", sunAz: 120, sunEl: 40 },       // nobody looks up; narrator thinking
  { id: 10, a: 764, b: 828, light: "room", sunAz: 10, sunEl: 26 },      // THIRTY: grandpa pauses, looks up
  { id: 11, a: 828, b: 883, light: "day", sunAz: 150, sunEl: 35 },      // he pushes the window open (from the street)
  { id: 12, a: 883, b: 959, light: "day", sunAz: 160, sunEl: 30 },      // silver bombers glint
  { id: 13, a: 959, b: 1054, light: "room", sunAz: 12, sunEl: 26 },     // TWENTY: why no sirens? she pats his arm
  { id: 14, a: 1054, b: 1099, light: "room", sunAz: 12, sunEl: 26 },   // "Sit down. Finish your tea."
  { id: 15, a: 1099, b: 1181, light: "day", sunAz: 100, sunEl: 30 },    // TEN: the bomb slips from the plane
  { id: 16, a: 1181, b: 1230, light: "day", sunAz: 140, sunEl: 40 },    // it falls toward the city
  { id: 17, a: 1230, b: 1264, light: "day", sunAz: 120, sunEl: 40 },    // narrator looks up, shocked
  { id: 18, a: 1264, b: 1326, light: "room", sunAz: 10, sunEl: 26 },    // FIVE: he stands up slowly
  { id: 19, a: 1326, b: 1376, light: "room", sunAz: 10, sunEl: 26 },    // THREE: he takes her hand
  { id: 20, a: 1376, b: 1401, light: "room", sunAz: 0, sunEl: 22 },     // ONE: the window brightens
  { id: 21, a: 1401, b: WHITE_HOLD, light: "day", sunAz: 110, sunEl: 35 }, // the flash over the city
  { id: 22, a: WHITE_HOLD, b: TOTAL, light: "dusk", sunAz: 120, sunEl: 14 }, // the cloud; narrator on the hill
];
export const XFADE: Record<number, number> = {};

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- set pieces placed by the story ----------------
export const NAR1: V3 = [4.2, 0, -1.6];          // narrator, street (hook + shocked)
export const SIREN: V3 = [-9.2, 0, -6.7];        // siren pole by the south row
export const NAR4: V3 = [-7.4, 0, -5.2];
export const NAR7: V3 = [-13.4, 0, -0.5];         // watching the kids
export const NAR9: V3 = [10.6, 0, -2.4];         // thinking
export const GRANDPA_SIT: V3 = [0.5, ROOM.fy, 9.95];
export const GRANDMA_SIT: V3 = [-0.5, ROOM.fy, 9.95];
export const GRANDPA_WIN: V3 = [0.62, ROOM.fy, 9.0];     // standing at the window (the right shoji slides open)
export const GRANDPA_UP: V3 = [0.4, ROOM.fy, 9.75];     // standing, ready to take her hand
export const GRANDMA_UP: V3 = [-0.4, ROOM.fy, 9.75];
export const TABLE: V3 = [0, ROOM.fy, 10.65];
/** the ending: narrator on the hill, facing the lens, the cloud rising over the city behind him */
const toCity = (() => { const dx = HYPO[0] - END_HILL[0], dz = HYPO[2] - END_HILL[2], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
export const NAR_END: V3 = [END_HILL[0] + toCity[0] * 8, 0, END_HILL[2] + toCity[1] * 8];
NAR_END[1] = hillY(NAR_END[0], NAR_END[2]);
/** window shoji: 0 shut .. 1 slid open (grandpa pushes it on "pushes the window open") */
export const shojiOpen = (f: number) => (f < W.pushes - 4 ? 0 : smooth((f - (W.pushes - 4)) / 22));
/** how bright the window paper glows (the flash builds behind it on "One") */
export const windowGlow = (f: number) => (f < W.one ? 0 : smooth((f - W.one) / 25) ** 2);

// ---------------- the planes and the bomb ----------------
export const PLANE_Y = 330;
/** Enola Gay position at frame f (flies +x over the city, passes over HYPO at the drop); escorts trail it */
export const DROP_F = W.slips - 2;
const PLANE_V = 24; // m/s (screen speed, not 1945 speed)
export const planeAt = (f: number, k = 0): V3 => {
  const t = (f - DROP_F) / FPS, off: V3[] = [[0, 0, 0], [-46, 12, 36], [-52, -6, -40]];
  return [HYPO[0] - 30 + PLANE_V * t + off[k][0], PLANE_Y + off[k][1], HYPO[2] + off[k][2]];
};
/** the bomb: falls from the bay with the plane's forward speed, drag-free, then the shot cheats it lower */
export const bombAt = (f: number): V3 | null => {
  if (f < DROP_F) return null;
  const t = (f - DROP_F) / FPS, p = planeAt(DROP_F);
  return [p[0] + 1.5 + PLANE_V * 0.85 * t, p[1] - 2.2 - 4.9 * t * t * 1.6, p[2]];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const N1 = NAR1, GP = GRANDPA_SIT, GM = GRANDMA_SIT;
const CAMS: Record<number, Key[]> = {
  // 1: narrator in the street, talking to the lens; punch in on "Hiroshima"
  1: [{ f: 0, s: (f) => dolly([N1[0] + 2.0, 1.5, N1[2] - 4.6], [N1[0] + 0.1, 1.38, N1[2]], pushK(f, 0, 0.003, 0.009, 24), { fov: 38, roll: 0.02 }) },
    { f: W.hiroshima - 2, dur: 20, s: (f) => dolly([N1[0] + 1.6, 1.52, N1[2] - 3.7], [N1[0] + 0.1, 1.42, N1[2]], pushK(f, W.hiroshima, 0.003), { fov: 36, roll: -0.025 }) }],
  // 2: aerial over the delta: the river, the bridge, the dome; drifts on "nineteen forty-five"
  2: [{ f: 62, s: (f) => dolly([95, 78, 55], [-25, 2, -70], pushK(f, 62, 0.0022), { fov: 46 }) },
    { f: W.y1945 - 4, dur: 34, s: (f) => dolly([70, 62, 30], [-35, 4, -78], pushK(f, W.y1945, 0.0025), { fov: 44, roll: 0.03 }) }],
  // 3: the room, wide; cut to grandma's sip
  3: [{ f: 142, s: (f) => dolly([2.0, 1.6, 14.0], [-0.05, 1.05, 9.8], pushK(f, 142, 0.0025), { fov: 46 }) },
    { f: W.sips - 2, cut: true, s: (f) => dolly([GM[0] - 0.75, 1.38, GM[2] + 2.0], [GM[0], 1.22, GM[2]], pushK(f, W.sips, 0.003), { fov: 34, roll: -0.02 }) }],
  // 4: low up at the silent siren with the narrator shrugging; CU on "or so everyone thought"
  4: [{ f: 253, s: (f) => zoom([-3.3, 1.1, 1.2], [-8.6, 5.0, -6.4], 56, pushK(f, 253, 0.0025)) },
    { f: W.orSo - 2, cut: true, s: (f) => dolly([NAR4[0] + 1.6, 1.55, NAR4[2] + 2.4], [NAR4[0], 1.48, NAR4[2]], pushK(f, W.orSo, 0.0025, 0.007, 26), { fov: 34, roll: -0.03 }) }],
  // 5: the paper windows, sun pouring through; slow pan across the room
  5: [{ f: 362, s: (f) => zoom([-2.7, 0.95, 13.4], [0.4, 1.55, 8.6], 48, pushK(f, 362, 0.002)) },
    { f: 400, dur: 40, s: (f) => zoom([-1.6, 1.05, 13.1], [0.3, 1.45, 8.9], 44, pushK(f, 400, 0.002), { roll: 0.02 }) }],
  // 6: two-shot, she laughs
  6: [{ f: 451, s: (f) => dolly([0.1, 1.5, 13.4], [0.0, 1.25, 9.95], pushK(f, 451, 0.003, 0.006, 20), { fov: 44 }) }],
  // 7: down the street toward the lens: the kids run past the narrator
  7: [{ f: 500, s: (f) => zoom([-18.5, 1.3, -1.6], [0, 1.2, 0.8], 42, pushK(f, 500, 0.002)) },
    { f: W.klass - 6, dur: 24, s: (f) => zoom([-17.8, 1.35, -1.9], [NAR7[0], 1.4, NAR7[2]], 34, pushK(f, W.klass, 0.003), { roll: -0.02 }) }],
  // 8: low over the north roofs, tilting up into the sky (the bombers are specks with contrails)
  8: [{ f: 585, s: (f) => { const p = planeAt(f); const u = smooth((f - 585) / 80); return { pos: [3, 1.2, 5.5], look: [p[0] * 0.5 + 40 * (1 - u), 25 + (p[1] * 0.5 - 25) * u, p[2] * 0.5], fov: 54 }; } },
    { f: W.above - 10, dur: 30, s: (f) => { const p = planeAt(f); return zoom([3, 1.2, 5.5], [p[0] + 20, p[1] - 30, p[2]], 54, pushK(f, W.above, 0.003)); } }],
  // 9: the street; the narrator thinking in the foreground, looks up on "planes"
  9: [{ f: 687, s: (f) => dolly([NAR9[0] + 2.4, 1.5, NAR9[2] - 4.0], [NAR9[0] - 0.6, 1.55, NAR9[2] + 0.6], pushK(f, 687, 0.0025), { fov: 40 }) },
    { f: W.planes - 4, dur: 24, s: (f) => dolly([NAR9[0] + 1.9, 1.3, NAR9[2] - 3.1], [NAR9[0] - 0.2, 1.8, NAR9[2]], pushK(f, W.planes, 0.003), { fov: 38, roll: 0.03 }) }],
  // 10: CU grandpa, cup in hand, looks up
  10: [{ f: 764, s: (f) => dolly([GP[0] - 0.5, 1.42, GP[2] + 2.1], [GP[0], 1.3, GP[2]], pushK(f, 764, 0.003, 0.007, 26), { fov: 34 }) }],
  // 11: from the street: the window slides open and grandpa leans out
  11: [{ f: 828, s: (f) => dolly([-0.6, 1.8, 3.4], [0.3, 2.0, 8.5], pushK(f, 828, 0.003), { fov: 38 }) },
    { f: W.open - 4, dur: 18, s: (f) => dolly([-0.2, 1.85, 4.6], [0.6, 1.95, 8.6], pushK(f, W.open, 0.003), { fov: 34, roll: 0.02 }) }],
  // 12: up past the eaves to the bombers; tighten on "glint"
  12: [{ f: 883, s: (f) => { const p = planeAt(f); return zoom([0.3, 2.0, 7.4], [p[0] - 10, p[1] - 10, p[2] + 4], 40, pushK(f, 883, 0.002)); } },
    { f: W.glint - 6, dur: 26, s: (f) => { const p = planeAt(f); return zoom([0.3, 2.0, 7.4], [p[0] - 14, p[1] + 2, p[2]], 24, pushK(f, W.glint, 0.003), { roll: 0.02 }); } }],
  // 13: grandpa at the window, grandma at the table reaching to pat his arm
  13: [{ f: 959, s: (f) => dolly([0.9, 1.6, 13.6], [-0.05, 1.45, 9.4], pushK(f, 959, 0.0025), { fov: 44 }) },
    { f: W.pats - 6, dur: 24, s: (f) => dolly([0.9, 1.45, 12.2], [0.05, 1.35, 9.5], pushK(f, W.pats, 0.0025), { fov: 38, roll: 0.02 }) }],
  // 14: CU grandma: "Sit down. Finish your tea."
  14: [{ f: 1054, s: (f) => dolly([GM[0] + 0.6, 1.36, GM[2] + 1.95], [GM[0], 1.25, GM[2]], pushK(f, 1054, 0.003), { fov: 32, roll: -0.02 }) }],
  // 15: alongside the plane at altitude: the bomb slips from the bay
  15: [{ f: 1099, s: (f) => { const p = planeAt(f); return { pos: add(p, [46, -20, 52]), look: add(p, [-2, -2, 0]), fov: 44 }; } },
    { f: W.dot - 8, dur: 28, s: (f) => { const p = planeAt(f); return { pos: add(p, [40, -28, 50]), look: add(p, [2, -12, 0]), fov: 46, roll: 0.03 }; } }],
  // 16: above the falling bomb, the sun-bright city below
  16: [{ f: 1181, s: (f) => { const b = bombAt(f)!, o: V3 = [10, 30, 16]; return { pos: add(b, o), look: add(b, [-o[0] * 3 - 4, -o[1] * 3, -o[2] * 3 + 6]), fov: 46, roll: 0.05 }; } }],
  // 17: the narrator looks up, shocked
  17: [{ f: 1230, s: (f) => zoom([N1[0] + 1.3, 0.95, N1[2] - 3.0], [N1[0] + 0.05, 1.75, N1[2]], 36, pushK(f, 1230, 0.004, 0.012, 20), { roll: -0.04 }) }],
  // 18: grandpa rises from the table, the lens tilts up with him
  18: [{ f: 1264, s: (f) => dolly([GP[0] - 1.2, 1.3, GP[2] + 3.7], [GP[0] - 0.2, 1.1 + 0.6 * smooth((f - W.stands) / 30), GP[2]], pushK(f, 1264, 0.002), { fov: 44 }) }],
  // 19: he takes her hand
  19: [{ f: 1326, s: (f) => dolly([0.05, 1.5, 13.3], [0.0, 1.4, 9.8], pushK(f, 1326, 0.003, 0.006, 22), { fov: 44 }) }],
  // 20: ONE: push toward the glowing window
  20: [{ f: 1376, s: (f) => dolly([0.05, 1.6, 13.2], [0.0, 1.7, 8.6], pushK(f, 1376, 0.006), { fov: 44 }) }],
  // 21: the flash over the city (from the north-east, high)
  21: [{ f: 1401, s: (f) => dolly([160, 120, 170], [-10, 150, -125], pushK(f, 1401, 0.002), { fov: 50 }) }],
  // 22: the hill: narrator facing the lens, the cloud rising behind him; the lens eases back to show it
  22: [{ f: WHITE_HOLD, s: (f) => {
    const u = smooth((f - WHITE_HOLD) / 150), back = 2.7 + 2.6 * u;
    const n = NAR_END, dx = -(HYPO[0] - n[0]), dz = -(HYPO[2] - n[2]), l = Math.hypot(dx, dz);
    const px = n[0] + (dx / l) * back + (-dz / l) * -0.25, pz = n[2] + (dz / l) * back + (dx / l) * -0.25;
    return { pos: [px, n[1] + 1.5 + 0.4 * u, pz], look: [n[0] - (dx / l) * 30, n[1] + 2.6 + 7 * u, n[2] - (dz / l) * 30], fov: 42 + 6 * u };
  } }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[W.ten / FPS, 0.4], [W.five / FPS, 0.35], [W.three / FPS, 0.35], [W.one / FPS, 0.45], [FLASH_F / FPS, 1.8], [(FLASH_F + 10) / FPS, 1.2]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 12, focus: () => [N1[0], 1.5, N1[2]] },
  { f: 62, cInf: 0 },
  { f: 142, cInf: 9, focus: () => [0, 1.2, 9.95] },
  { f: W.sips - 2, cInf: 13, focus: () => [GM[0], 1.3, GM[2]] },
  { f: 253, cInf: 0 },
  { f: W.orSo - 2, cInf: 13, focus: () => [NAR4[0], 1.5, NAR4[2]] },
  { f: 362, cInf: 6, focus: () => [0, 1.3, 9.95] },
  { f: 451, cInf: 11, focus: () => [0, 1.3, 9.95] },
  { f: 500, cInf: 0 },
  { f: W.klass - 6, dur: 20, cInf: 10, focus: () => [NAR7[0], 1.5, NAR7[2]] },
  { f: 585, cInf: 0 },
  { f: 687, cInf: 11, focus: () => [NAR9[0], 1.5, NAR9[2]] },
  { f: 764, cInf: 13, focus: () => [GP[0], 1.3, GP[2]] },
  { f: 828, cInf: 8, focus: () => [GRANDPA_WIN[0], 2.0, GRANDPA_WIN[2]] },
  { f: 883, cInf: 0 },
  { f: 959, cInf: 9, focus: () => [0, 1.5, 9.4] },
  { f: 1054, cInf: 13, focus: () => [GM[0], 1.3, GM[2]] },
  { f: 1099, cInf: 0 },
  { f: 1230, cInf: 13, focus: () => [N1[0], 1.6, N1[2]] },
  { f: 1264, cInf: 10, focus: () => [GP[0], 1.5, GP[2]] },
  { f: 1326, cInf: 10, focus: () => [0, 1.35, 9.95] },
  { f: 1376, cInf: 8, focus: () => [0, 1.4, 9.95] },
  { f: 1401, cInf: 0 },
  { f: WHITE_HOLD, cInf: 8, focus: () => [NAR_END[0], NAR_END[1] + 1.5, NAR_END[2]] },
  { f: WHITE_HOLD + 60, dur: 90, cInf: 3, focus: () => [NAR_END[0], NAR_END[1] + 1.5, NAR_END[2]] },
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
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
