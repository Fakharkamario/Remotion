// Timeline of "The Sweetest Disaster" (Great Molasses Flood, Boston, 15 Jan 1919): shots timed to the stand-in voice
// (shorts/molasses/voice/words.json, word onsets in frames noted below), the wave physics and the camera grammar of
// the bridge short: continuous slow push-ins, symmetric smootherstep glides, cuts for big reframes, flip-sign kicks.
// World layout (metres, y up, ground y = 0): the tank at the origin (r 12, h 15) on the harbour side of Commercial St
// (z 16..32, elevated railway over z = 24), brick blocks fronting the street at z = 34, warehouses either side of the
// tank, the quay wall at z = -24 and the harbour beyond.
export const FPS = 30;
export const TOTAL = 930;
export const D0 = 0; // ground height (build.ts houses stand on D0)
export type V3 = [number, number, number];

export const TANK_R = 12, TANK_H = 15;
export const STREET_Z0 = 16, STREET_Z1 = 32, EL_Z = 24, EL_Y = 6.4;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- wave physics (ts = seconds since the burst) ----------------
/** front radius from the tank centre: starts at ~14 m/s (31 mph), slows as it spreads */
export const frontR = (ts: number) => TANK_R + 140 * (1 - Math.exp(-Math.max(0, ts) / 10));
/** crest height (m): 9.5 m (31 ft) at the burst, ~6.7 m (22 ft) after 3 s */
export const crestH = (ts: number) => 3 + 7 * Math.exp(-Math.max(0, ts) / 10);
/** level behind the crest: settles to 0.9 m (the knee-to-waist deep sheet that set like glue) */
export const baseH = (ts: number) => 0.9 + 4.5 * Math.exp(-Math.max(0, ts) / 2.2);
/** how much of a crest bump is left (fades out once the wave has spent itself) */
export const bumpK = (ts: number) => Math.exp(-Math.max(0, ts) / 20);
const CREST_W = 7;
/** molasses surface height at distance r from the tank centre (0 = no molasses there) */
export const waveH = (r: number, ts: number) => {
  if (ts < 0) return 0;
  const rf = frontR(ts), hb = baseH(ts), hc = hb + (crestH(ts) - hb) * bumpK(ts);
  if (r > rf) return 0;
  const d = rf - r; // distance behind the front
  if (d < CREST_W) {
    const u = 1 - d / CREST_W; // 1 at the front edge
    return Math.max(0.05, hc * Math.sqrt(Math.max(0, 1 - u * u * u)));
  }
  return hb + (hc - hb) * Math.exp(-(d - CREST_W) / 14);
};
/** front x position along the street centre line (z = EL_Z) */
export const frontX = (ts: number) => Math.sqrt(Math.max(0, frontR(ts) ** 2 - EL_Z ** 2));
export const BURST_F = 371; // "burst" @373, the break lands 2 f early
export const BURST_T = BURST_F / FPS;

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Tank = "intact" | "burst" | "gone";
export type ShotDef = { id: number; a: number; b: number; light: Light; tank: Tank; wave: (t: number) => number | null; sunAz?: number; sunEl?: number };
const after = (t: number) => t - BURST_T;
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 88, light: "day", tank: "burst", wave: (t) => 1.0 + 0.9 * t },          // hook: the wave chases people at the lens
  { id: 2, a: 88, b: 186, light: "day", tank: "intact", wave: () => null },                 // waterfront aerial
  { id: 3, a: 186, b: 288, light: "day", tank: "intact", wave: () => null, sunAz: 150, sunEl: 38 },                // the painter
  { id: 4, a: 288, b: 362, light: "day", tank: "intact", wave: () => null, sunAz: 140, sunEl: 40 },                // groan + rivets
  { id: 5, a: 362, b: 390, light: "day", tank: "burst", wave: after, sunAz: 155, sunEl: 35 },                      // burst
  { id: 6, a: 390, b: 505, light: "day", tank: "burst", wave: after },                      // the wave down the street
  { id: 7, a: 505, b: 590, light: "day", tank: "burst", wave: after },                      // luckily / unluckily
  { id: 8, a: 590, b: 658, light: "day", tank: "intact", wave: () => null },                // honey from the fridge
  { id: 9, a: 658, b: 742, light: "day", tank: "burst", wave: () => 40 },                  // set like glue
  { id: 10, a: 742, b: 810, light: "day", tank: "gone", wave: () => null },                 // engineers sign off
  { id: 11, a: 810, b: TOTAL, light: "golden", tank: "gone", wave: () => null, sunAz: 115, sunEl: 13 },            // hot day, sweet street
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 8: 6, 9: 6, 10: 8, 11: 10 };
export const FLASH_AT = 88;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- set pieces placed by the story ----------------
export const PAINTER: V3 = [1.6, 0, 13.0];
/** wall angle (rad from +z toward +x) and height range of the leak streaks the painter covers */
export const DRIPS: { th: number; y0: number; y1: number; w: number }[] = [
  { th: 0.02, y0: 1.2, y1: 5.2, w: 1.0 }, { th: 0.12, y0: 0.6, y1: 4.0, w: 0.8 }, { th: 0.2, y0: 1.6, y1: 6.2, w: 0.9 }, { th: -0.07, y0: 0.4, y1: 3.4, w: 0.7 },
];
export const LEAK0 = 193, PAINT0 = 228, PAINT1 = 262; // "leaked" @193, "painted" @230
export const NOTICE = 254; // "nobody would notice" @256: the painter turns to the lens
/** rivets that pop: [wall angle, height, frame] ("popped" @325, "gunshots" @344) */
export const RIVETS: [number, number, number][] = [[0.1, 7.6, 323], [-0.06, 9.3, 342], [0.24, 8.4, 343]];
export const LOCAL: V3 = [87, 0, 27.6]; // the calm local of shot 7
export const JAR: V3 = [-60, 0, 30.4]; // crate + jar of shot 8
export const BOARD: V3 = [-40, 0, 28.2]; // the engineer's plan board (shot 10)
export const STAMPS = [772, 793]; // "sign" @774, "designs" @795
export const SNIFFER: V3 = [-22, 0, 24.5]; // shot 11

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
const T = (f: number) => f / FPS;
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
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// shot 1 (hook): low on Commercial St ahead of the wave, looking back at it; the lens backs off a little
const S1a = (f: number) => { const x = 58 + 1.2 * T(f); return zoom([x, 1.5, 25.2], [x - 30, 5.2, 23.6], 46, pushK(f, 0, 0.0025)); };
const S1b = (f: number) => { const x = 58 + 1.2 * T(f); return zoom([x, 1.1, 25.4], [x - 30, 6.4, 23.4], 50, pushK(f, 50, 0.003), { roll: 0.04 }); }; // "tidal wave"
// shot 2 (waterfront aerial from over the harbour), punch in on "two point three million gallons" (@134)
const S2a = (f: number) => dolly([-34, 40, -78], [6, 4, 12], pushK(f, 88, 0.002), { fov: 44 });
const S2b = (f: number) => dolly([-20, 22, -44], [0, 8, 2], pushK(f, 124, 0.0018, 0.005, 40), { fov: 42 });
// shot 3: the painter at the leaking wall; closer as the paint goes on, he turns to the lens on "nobody would notice"
const S3a = (f: number) => dolly([6.2, 2.4, 21.5], [1.0, 3.0, 12.2], pushK(f, 186, 0.0022), { fov: 42 });
const S3b = (f: number) => dolly([4.6, 1.9, 18.6], [1.0, 2.6, 12.4], pushK(f, 226, 0.002), { fov: 40, roll: -0.03 });
const S3c = (f: number) => dolly([3.1, 1.7, 16.6], [PAINTER[0], 1.55, PAINTER[2]], pushK(f, 252, 0.003, 0.006, 30), { fov: 38, roll: 0.035 });
// shot 4: low up the wall ("groaned" @294), the rivet seam ("rivets" @315), kicks on the pops
const S4a = (f: number) => zoom([4.5, 0.7, 19.5], [0.6, 9.5, 11.6], 52, pushK(f, 288, 0.0025));
const S4b = (f: number) => zoom([2.6, 5.2, 16.8], [0.9, 8.2, 11.8], 40, pushK(f, 313, 0.003));
// shot 5: wide across the street, the burst
const S5a = (f: number) => dolly([17, 2.6, -21.5], [0, 7.5, 0], pushK(f, 362, 0.002), { fov: 48 });
// shot 6: ahead of the wave down Commercial St; tilt up on "twenty five feet high" (@406), back away on "thirty five miles" (@466)
const X6 = (f: number) => 50 + 16 * smooth((f - 390) / 115);
const S6a = (f: number) => zoom([X6(f), 1.7, 26.5], [X6(f) - 34, 4.2, 23.8], 44, pushK(f, 390, 0.002));
const S6b = (f: number) => zoom([X6(f), 1.2, 26.5], [X6(f) - 30, 8.5, 23.6], 50, pushK(f, 404, 0.0025), { roll: -0.04 });
const S6c = (f: number) => { const x = X6(f) + 4 * smooth((f - 456) / 50); return zoom([x, 2.2, 27], [x - 28, 4.0, 23.5], 46, pushK(f, 456, 0.002), { roll: 0.03 }); };
// shot 7: the calm local; cut on "Unluckily" (@546) to the wave rearing up behind him
const S7a = (f: number) => dolly([LOCAL[0] + 5.2, 1.65, LOCAL[2] - 1.6], [LOCAL[0], 1.55, LOCAL[2]], pushK(f, 505, 0.0022), { fov: 36 });
const S7b = (f: number) => zoom([LOCAL[0] + 9.5, 0.7, LOCAL[2] - 2.6], [LOCAL[0] - 6, 3.6, LOCAL[2] - 0.6], 46, pushK(f, 544, 0.003, 0.006, 30), { roll: 0.04 });
// shot 8: jar of cold honey on a crate, push in on "thick" (@612)
const S8a = (f: number) => dolly([JAR[0] + 0.75, 1.55, JAR[2] - 3.7], [JAR[0] + 0.3, 1.15, JAR[2]], pushK(f, 590, 0.0025, 0.006, 30), { fov: 34 });
// shot 9: the street the morning after: stuck townsfolk
const S9a = (f: number) => dolly([60, 3.0, 19.5], [44, 0.9, 25], pushK(f, 652, 0.0025), { fov: 42 });
const S9b = (f: number) => dolly([50.5, 1.9, 21.0], [44.5, 1.1, 24.5], pushK(f, 699, 0.003), { fov: 38, roll: -0.035 }); // "set like glue" @691
// shot 10: the engineer stamps the plans
const S10a = (f: number) => dolly([BOARD[0] + 1.0, 1.75, BOARD[2] - 6.6], [BOARD[0] + 0.65, 1.45, BOARD[2]], pushK(f, 742, 0.0025), { fov: 38 });
const S10b = (f: number) => zoom([BOARD[0] + 1.0, 1.75, BOARD[2] - 6.6], [BOARD[0] + 0.45, 1.5, BOARD[2]], 32, pushK(f, 770, 0.0025, 0.005, 24));
// shot 11: hot summer evening, the sniffer, then crane out over the waterfront
const S11a = (f: number) => dolly([SNIFFER[0] + 3.2, 1.6, SNIFFER[2] - 3.4], [SNIFFER[0], 1.5, SNIFFER[2]], pushK(f, 806, 0.002), { fov: 38 });
const S11b = (f: number) => dolly([SNIFFER[0] + 2.0, 1.55, SNIFFER[2] - 2.3], [SNIFFER[0], 1.6, SNIFFER[2]], pushK(f, 864, 0.003, 0.006, 30), { fov: 36, roll: 0.035 }); // "smells sweet"
// crane out: a cubic path that first slides out from under the elevated deck toward the yard, then rises over the
// warehouses and pulls back over the harbour (the lens never threads the deck or a roof)
const CRANE: V3[] = [[-20, 3, 14.5], [-20, 40, 14.5], [10, 42, -50], [-6, 4, 18]];
const S11c = (f: number): Shot => {
  const a = S11b(888), s = glide((f - 888) / 50), r = 1 - s, [C1, C2, B, L] = CRANE;
  return { pos: [0, 1, 2].map((i) => r * r * r * a.pos[i] + 3 * r * r * s * C1[i] + 3 * r * s * s * C2[i] + s * s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: (a.fov ?? 36) + (44 - (a.fov ?? 36)) * s, roll: 0.035 * r };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 50, dur: 30, s: S1b }], // "tidal wave" @55
  2: [{ f: 88, s: S2a }, { f: 124, dur: 30, s: S2b }], // centred on "two point three" @139
  3: [{ f: 186, s: S3a }, { f: 226, dur: 24, s: S3b }, { f: 252, cut: true, s: S3c }],
  4: [{ f: 288, s: S4a }, { f: 313, cut: true, s: S4b }, { f: 313, dur: 20, s: rolled(S4b, 0.04) }],
  5: [{ f: 362, s: S5a }],
  6: [{ f: 390, s: S6a }, { f: 404, dur: 22, s: S6b }, { f: 456, dur: 26, s: S6c }],
  7: [{ f: 505, s: S7a }, { f: 544, cut: true, s: S7b }],
  8: [{ f: 590, s: S8a }],
  9: [{ f: 652, s: S9a }, { f: 691, dur: 24, s: S9b }],
  10: [{ f: 742, s: S10a }, { f: 770, cut: true, s: S10b }],
  11: [{ f: 806, s: S11a }, { f: 864, cut: true, s: S11b }, { f: 888, cut: true, s: S11c }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[294 / FPS, 0.35], [323 / FPS, 0.7], [342 / FPS, 0.8], [BURST_T, 1.7], [STAMPS[0] / FPS, 0.6], [STAMPS[1] / FPS, 0.5]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: depth of field + foreground framing ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // hook: the wave must read
  { f: 88, cInf: 0 }, // aerial
  { f: 186, cInf: 10, focus: () => [PAINTER[0], 1.6, PAINTER[2]] }, // painter MS
  { f: 252, cInf: 13, focus: () => [PAINTER[0], 1.6, PAINTER[2]] }, // painter CU
  { f: 288, cInf: 0 }, // tank wall
  { f: 390, cInf: 0 }, // wave, street
  { f: 505, cInf: 14, focus: () => [LOCAL[0], 1.6, LOCAL[2]] }, // calm local, the wave far behind and soft
  { f: 544, cInf: 0 }, // the wave rears up
  { f: 590, cInf: 15, focus: () => [JAR[0], 1.05, JAR[2]] }, // jar insert
  { f: 658, cInf: 0 }, // stuck street
  { f: 691, cInf: 10, focus: () => [44.5, 1.5, 24.8] },
  { f: 742, cInf: 11, focus: () => [BOARD[0] + 0.3, 1.5, BOARD[2]] }, // engineer
  { f: 806, cInf: 12, focus: () => [SNIFFER[0], 1.6, SNIFFER[2]] }, // sniffer
  { f: 888, dur: 30, cInf: 0 }, // crane out
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
  { a: 806, b: 864, kit: "plant_bushDetailed", pos: [SNIFFER[0] + 1.3, 0, SNIFFER[2] - 1.6], s: 0.9, yaw: 0.4 },
];
