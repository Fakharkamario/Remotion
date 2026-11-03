// Timeline of "Why the Titanic Was Horrifying" (14-15 April 1912): shots timed to the stand-in voice
// (shorts/titanic/voice/words.json, word onsets in frames noted below), the ship's sinking pose and the camera grammar
// of the bridge short: continuous slow push-ins, smootherstep glides, cuts for big reframes, flip-sign kicks.
// Ship frame (metres): bow toward +x, starboard +z, waterline y = 0 (hull top 10, boat deck 16). The ship pitches
// bow-down about the break point (BREAK_X, 0, 0) and settles; shots on board keep their cameras in the ship frame,
// so the sea and the horizon tilt while the deck stays put. Interiors (cabin, corridor) are their own small sets.
export const FPS = 30;
export const TOTAL = 1350;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

// ---------------- ship dimensions ----------------
export const HULL_X0 = -100, HULL_X1 = 100, BEAM = 22, HULL_TOP = 10, KEEL = -11, DECK = 16;
export const BREAK_X = -17; // between funnels 3 and 4
export const FUNNELS = [36, 14, -8, -30];
/** lifeboats on the boat deck: [x, side]; they leave in this order (index into LAUNCH) */
export const BOATS: [number, number][] = [[50, 1], [41, 1], [50, -1], [41, -1], [-40, 1], [-49, 1], [-58, 1], [-40, -1], [-49, -1], [-58, -1]];
export const BOAT_Z = 7.4;
/** frame at which each boat has gone from its davits */
export const LAUNCH = [600, 640, 660, 700, 740, 760, 1e9, 780, 800, 1e9];

// ---------------- the sinking: pitch (deg, bow down < 0) and sink (m) by frame ----------------
const SINK: [number, number, number][] = [ // [frame, pitch, y]
  [0, 0, 0], [300, -0.3, -0.3], [400, -1.0, -1.0], [558, -2.0, -2.5], [637, -3.0, -4.0], [777, -5.5, -8.0], [887, -8.0, -11.0], [968, -11, -13],
];
export const BREAK_F = 1005; // "snaps" @1008
export type Pose = { pitch: number; y: number };
export const sinkAt = (f: number): Pose => {
  if (f >= SINK[SINK.length - 1][0]) {
    const u = smooth((f - 968) / (BREAK_F - 968));
    return { pitch: -11 - 9 * u, y: -13 - 2 * u };
  }
  let i = 0; while (i + 1 < SINK.length && f >= SINK[i + 1][0]) i++;
  const a = SINK[i], b = SINK[i + 1], u = (f - a[0]) / (b[0] - a[0]);
  return { pitch: a[1] + (b[1] - a[1]) * u, y: a[2] + (b[2] - a[2]) * u };
};
/** after the break: front half dives, stern falls back level then starts to rise again */
export const halvesAt = (f: number): { front: Pose; back: Pose } => {
  const p = sinkAt(Math.min(f, BREAK_F));
  if (f < BREAK_F) return { front: p, back: p };
  const s = (f - BREAK_F) / FPS;
  const fu = clamp01(s / 1.6);
  const bu = clamp01(s / 0.9);
  const bounce = Math.sin(Math.min(1, s / 1.2) * Math.PI) * 1.2 * Math.exp(-s);
  return {
    front: { pitch: p.pitch - 22 * fu * fu, y: p.y - 22 * fu * fu },
    back: { pitch: p.pitch + 10 * easeOut(bu) - bounce, y: p.y + 1.5 * easeOut(bu) - 2.5 * s * 0.3 },
  };
};
/** emissive lamps on the ship: 1 = all lit; flicker and die on "lights go out" (@893) */
export const LIGHTS_OUT = 893;
export const lampsAt = (f: number) => {
  if (f < LIGHTS_OUT - 2) return 1;
  const k = f - (LIGHTS_OUT - 2);
  const fl = [0.2, 0.9, 0.1, 0.7, 0.05, 0.4, 0, 0.15, 0];
  return k < fl.length ? fl[k] : 0;
};

// ---------------- the iceberg (world frame; the ship stands still, the berg slides past) ----------------
export const SCRAPE_F = 173; // "grinding" @175
export const ICE_Z = 17.0;
export const iceX = (f: number) => 84 - 0.37 * (f - SCRAPE_F);

// ---------------- sets ----------------
export const CABIN: V3 = [0, 300, 0];   // cabin set origin (floor centre)
export const HALL: V3 = [0, 300, 60];   // corridor set origin
export const H1: V3 = [28, DECK, 6.4];  // the host on the boat deck (hook)
export const SLEEPER: V3 = [-0.12, 0.84, -0.66];
export const HOST_CABIN: V3 = [0.4, 0, -0.1];
export const STEWARD: V3 = [-1.2, 0, -0.55];
export const KNOCK_F = 342; // "knock" @344
export const TURN_F = 359;  // "Top deck. Now." @361
export const OFFICERS: V3[] = [[58.4, DECK, 8.6], [59.4, DECK, 7.2]];
export const BAND: V3 = [24, DECK, 5.7];
export const LOWER: { x: number; side: number; f0: number; f1: number } = { x: 41, side: 1, f0: 637, f1: 704 };
export const HOST_HALL: V3 = [1.6, 0, 0.4];
export const RAFT: V3 = [-150, 0, 80];       // lifeboat on the calm sea
export const SWIM: V3 = [-168, 0, 62];       // people in the water
export const LAST: V3 = [-120, 0, 120];      // the final lifeboat (empty seats)
export const SEA_BOATS: [number, number, number][] = [[-120, 120, 0.3], [-150, 80, -0.6], [-60, 170, 1.0], [-210, 150, 2.1], [-30, 95, -1.2], [-260, 60, 0.4]];

// ---------------- shots ----------------
export type Light = "day" | "golden"; // day = the night outside, golden = warm lamp-lit interiors
export type Frame = "world" | "ship" | "cabin" | "hall";
export type ShotDef = { id: number; a: number; b: number; light: Light; frame: Frame; dark?: number; ship?: boolean; flood?: boolean; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 80, light: "day", frame: "ship" },                    // hook: host on the boat deck
  { id: 2, a: 80, b: 150, light: "day", frame: "world" },                 // aerial, iceberg ahead in the dark
  { id: 3, a: 150, b: 215, light: "day", frame: "world" },                // grinding shudder
  { id: 4, a: 215, b: 300, light: "golden", frame: "cabin" },             // went back to sleep
  { id: 5, a: 300, b: 400, light: "golden", frame: "hall" },              // the steward knocks
  { id: 6, a: 400, b: 433, light: "day", frame: "ship" },                 // pyjamas on deck
  { id: 7, a: 433, b: 472, light: "day", frame: "ship" },                 // host: "a drill?"
  { id: 8, a: 472, b: 530, light: "day", frame: "ship" },                 // the officers know
  { id: 9, a: 530, b: 558, light: "day", frame: "ship" },                 // host laughs: "You don't."
  { id: 10, a: 558, b: 637, light: "day", frame: "ship" },                // the band
  { id: 11, a: 637, b: 704, light: "day", frame: "ship" },                // half-empty lifeboat lowered
  { id: 12, a: 704, b: 777, light: "golden", frame: "hall", flood: true }, // seawater in the hallway
  { id: 13, a: 777, b: 822, light: "day", frame: "ship", dark: 0.2 },     // host: it hits you
  { id: 14, a: 822, b: 887, light: "day", frame: "ship", dark: 0.25 },    // not enough boats
  { id: 15, a: 887, b: 968, light: "day", frame: "world", dark: 0.3 },    // lights out, no moon
  { id: 16, a: 968, b: 1046, light: "day", frame: "world", dark: 0.65 },  // snaps in half
  { id: 17, a: 1046, b: 1108, light: "day", frame: "world", dark: 0.6 },  // the calm sea
  { id: 18, a: 1108, b: 1178, light: "day", frame: "world", dark: 0.6 },  // twenty-eight degrees
  { id: 19, a: 1178, b: TOTAL, light: "day", frame: "world", dark: 0.6 }, // the empty seats
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 4: 8, 5: 6, 12: 8, 17: 10, 19: 10 };
export const FLASH_AT = 80;
export const FADE_OUT = 1322; // fade to black over the last frames

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

/** bust close-ups: the card sits BUST_D in front of the lens, the background is the deck behind */
export const BUST_D = 0.78;

// 1 hook: low on the boat deck, the host in front of the funnels; punch in on "horrifying" (@33)
const S1a = (f: number) => dolly([32.4, 17.0, 8.3], [27.6, 18.1, 5.9], pushK(f, 0, 0.0022, 0.006, 30), { fov: 50 });
// 2 aerial from astern-port, the berg ahead in the dark; glide forward toward the bow
const S2a = (f: number) => dolly([-150, 62, -120], [55, 4, 10], pushK(f, 80, 0.0025), { fov: 42 });
const S2b = (f: number) => dolly([-40, 44, -95], [95, 2, 14], pushK(f, 112, 0.0025), { fov: 40 });
// 3 at the waterline ahead of the scrape, the berg grinds down the starboard bow toward the lens
const S3a = (f: number) => zoom([36, 7, 66], [76, 7, 12], 42, pushK(f, 150, 0.003));
const S3b = (f: number) => zoom([40, 5.5, 60], [74, 8, 12], 44, pushK(f, 175, 0.003), { roll: 0.04 }); // "shudder" @190
// 4 cabin: the sleeper rolls over; the host stands by the bed
const S4a = (f: number) => dolly([2.1, 1.55, 1.5], [-0.5, 0.8, -0.8], pushK(f, 215, 0.0025), { fov: 58 });
const S4b = (f: number) => dolly([0.25, 1.28, 0.55], [-1.55, 0.85, -0.8], pushK(f, 262, 0.003), { fov: 48, roll: -0.03 }); // "back to sleep" @270
// 5 corridor: the steward knocks (@344), turns on "Top deck. Now." (@361)
const S5a = (f: number) => dolly([4.6, 1.55, 0.7], [-1.6, 1.25, -0.5], pushK(f, 300, 0.0025), { fov: 44 });
const S5b = (f: number) => dolly([0.9, 1.5, 0.75], [STEWARD[0], 1.55, STEWARD[2]], pushK(f, 359, 0.003, 0.007, 26), { fov: 40, roll: 0.035 });
// 6 pyjamas on deck: along the starboard promenade
const S6a = (f: number) => dolly([38.5, 17.6, 8.6], [27, 17.0, 6.2], pushK(f, 400, 0.003), { fov: 44 });
// 7 host bust thinking, the crowd soft behind
const S7a = (f: number) => dolly([31.2, 17.62, 7.7], [31.2 - 3.0, 17.52, 7.7 - 1.6], pushK(f, 433, 0.0025), { fov: 40 });
// 8 officers at the bridge wing look at the bow; it is already a little low
const S8a = (f: number) => dolly([56.2, 17.9, 11.0], [82, 12.0, 1.5], pushK(f, 472, 0.003), { fov: 50 });
const S8b = (f: number) => dolly([55.6, 17.6, 10.8], [59.0, 17.3, 7.9], pushK(f, 494, 0.003, 0.006, 26), { fov: 40, roll: -0.035 }); // "knows" @494
// 9 host bust laughing
const S9a = (f: number) => dolly([22.5, 17.6, 7.9], [22.5 - 3.0, 17.5, 7.9 - 1.4], pushK(f, 530, 0.003), { fov: 40, roll: 0.04 });
// 10 the band on the promenade
const S10a = (f: number) => dolly([31, 17.3, 8.7], [23.6, 17.1, 5.6], pushK(f, 558, 0.0025), { fov: 44 });
const S10b = (f: number) => dolly([28.2, 17.4, 8.2], [24.0, 17.2, 5.8], pushK(f, 600, 0.0025), { fov: 42, roll: 0.03 }); // "nobody panics" @608
// 11 low over the water looking up the hull: a half-empty boat comes down
const S11a = (f: number) => zoom([30, 7.5, 30], [41, 13.5, 12.5], 48, pushK(f, 637, 0.0025));
const S11b = (f: number) => zoom([32, 7.0, 28], [41, 11.2, 12.8], 42, pushK(f, 668, 0.003), { roll: -0.03 }); // "half empty" @676
// 12 flooded corridor: low, the water runs at the lens
const S12a = (f: number) => dolly([-5.5, 1.15, 0.6], [4, 0.7, -0.2], pushK(f, 704, 0.0028), { fov: 46 });
const S12b = (f: number) => dolly([-4.2, 0.8, 0.55], [4, 0.5, -0.1], pushK(f, 731, 0.003), { fov: 46, roll: 0.04 }); // "creeps" @731
// 13 host bust: it hits you (@802)
const S13a = (f: number) => dolly([29.5, 17.6, 7.9], [29.5 - 3.1, 17.5, 7.9 - 1.3], pushK(f, 777, 0.002, 0.008, 26), { fov: 40, roll: -0.04 });
// 14 high over the crowd on the tilted deck, the last boats
const S14a = (f: number) => dolly([36, 19.6, 8.2], [10, 16.6, 6.6], pushK(f, 822, 0.0025), { fov: 46 });
const S14b = (f: number) => dolly([33, 19.2, 8.5], [-6, 16.6, 6.8], pushK(f, 846, 0.0025), { fov: 44, roll: 0.03 }); // "boats" @848
// 15 the ship from the sea; lights die (@893); "No moon" (@919) tilt up to the sky; "Pitch black" (@939) back down
const S15a = (f: number) => dolly([-175, 9, 135], [-20, 10, 0], pushK(f, 887, 0.0022), { fov: 44 });
const S15b = (f: number) => ({ ...dolly([-175, 9, 135], [-60, 110, 40], pushK(f, 887, 0.0022), { fov: 52 }) });
const S15c = (f: number) => dolly([-165, 8, 125], [-20, 9, 0], pushK(f, 937, 0.003), { fov: 44 });
// 16 the snap, side on
const S16a = (f: number) => dolly([-175, 7, 110], [-30, 16, 0], pushK(f, 968, 0.0022), { fov: 44 });
const S16b = (f: number) => dolly([-160, 6, 100], [-30, 13, 0], pushK(f, BREAK_F, 0.003), { fov: 48, roll: 0.04 });
// 17 the calm sea, low over glassy water, a lifeboat
const S17a = (f: number) => dolly([RAFT[0] + 9, 1.3, RAFT[2] + 10], [RAFT[0], 1.6, RAFT[2]], pushK(f, 1046, 0.0025), { fov: 44 });
// 18 in the water: heads and lifebelts, breath in the cold
const S18a = (f: number) => dolly([SWIM[0] + 6.0, 1.6, SWIM[2] + 5.0], [SWIM[0], 0.4, SWIM[2]], pushK(f, 1108, 0.003, 0.006, 30), { fov: 44, roll: 0.035 });
// 19 the empty seats, then crane up and away over the sea
const S19a = (f: number) => dolly([LAST[0] + 5.0, 4.8, LAST[2] + 10.0], [LAST[0] - 1.2, 0.5, LAST[2] + 0.4], pushK(f, 1178, 0.0025), { fov: 46 });
const S19b = (f: number): Shot => {
  const u = glide((f - 1258) / 80);
  const a = S19a(1258);
  return { pos: [a.pos[0] + 24 * u, a.pos[1] + 30 * u, a.pos[2] + 30 * u], look: [a.look[0] - 18 * u, 0.5, a.look[2] - 26 * u], fov: 46 + 4 * u, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }],
  2: [{ f: 80, s: S2a }, { f: 106, dur: 40, s: S2b }],
  3: [{ f: 150, s: S3a }, { f: 186, dur: 20, s: S3b }],
  4: [{ f: 215, s: S4a }, { f: 260, cut: true, s: S4b }],
  5: [{ f: 300, s: S5a }, { f: 357, cut: true, s: S5b }],
  6: [{ f: 400, s: S6a }],
  7: [{ f: 433, s: S7a }],
  8: [{ f: 472, s: S8a }, { f: 492, cut: true, s: S8b }],
  9: [{ f: 530, s: S9a }],
  10: [{ f: 558, s: S10a }, { f: 598, dur: 30, s: S10b }],
  11: [{ f: 637, s: S11a }, { f: 664, dur: 30, s: S11b }],
  12: [{ f: 704, s: S12a }, { f: 729, dur: 28, s: S12b }],
  13: [{ f: 777, s: S13a }],
  14: [{ f: 822, s: S14a }, { f: 844, dur: 30, s: S14b }],
  15: [{ f: 887, s: S15a }, { f: 915, dur: 22, s: S15b }, { f: 935, dur: 20, s: S15c }],
  16: [{ f: 968, s: S16a }, { f: BREAK_F, cut: true, s: S16b }],
  17: [{ f: 1046, s: S17a }],
  18: [{ f: 1108, s: S18a }],
  19: [{ f: 1178, s: S19a }, { f: 1258, s: S19b }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[SCRAPE_F / FPS, 1.0], [184 / FPS, 0.8], [196 / FPS, 1.1], [KNOCK_F / FPS, 0.4], [(KNOCK_F + 5) / FPS, 0.3], [BREAK_F / FPS, 2.0]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
/** camera in its shot's own frame (ship / set / world); world.ts maps it to the world */
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: depth of field ----------------
/** focus points are in the shot's own frame; null focus = the camera's look target */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const bustFocus = (id: number) => (f: number): V3 => { const c = run(CAMS[id], f); const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], n = Math.hypot(...d);
  return [c.pos[0] + (d[0] / n) * BUST_D, c.pos[1] + (d[1] / n) * BUST_D, c.pos[2] + (d[2] / n) * BUST_D]; };
export const DOF: Dof[] = [
  { f: 0, cInf: 9, focus: () => [H1[0], H1[1] + 1.6, H1[2]] },
  { f: 80, cInf: 0 },
  { f: 150, cInf: 0 },
  { f: 215, cInf: 8, focus: () => [SLEEPER[0], 0.8, SLEEPER[2]] },
  { f: 300, cInf: 8, focus: () => [STEWARD[0], 1.6, STEWARD[2]] },
  { f: 400, cInf: 7 },
  { f: 433, cInf: 15, focus: bustFocus(7) },
  { f: 472, cInf: 0 },
  { f: 492, cInf: 11, focus: () => [OFFICERS[0][0], 17.6, OFFICERS[0][2]] },
  { f: 530, cInf: 15, focus: bustFocus(9) },
  { f: 558, cInf: 9, focus: () => [BAND[0], 17.6, BAND[2]] },
  { f: 637, cInf: 0 },
  { f: 704, cInf: 6 },
  { f: 777, cInf: 15, focus: bustFocus(13) },
  { f: 822, cInf: 0 },
  { f: 1046, cInf: 8, focus: () => [RAFT[0], 1.2, RAFT[2]] },
  { f: 1108, cInf: 10, focus: () => [SWIM[0], 0.6, SWIM[2]] },
  { f: 1178, cInf: 7, focus: () => [LAST[0], 0.8, LAST[2]] },
  { f: 1258, dur: 40, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const FOREGROUND: { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number }[] = [];
