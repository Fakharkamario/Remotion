// Timeline of "The Gentleman Thief": shots timed to the voice-over (shorts/thief/voice/words.json, word onsets noted
// in frames @30 fps), the camera grammar of the bridge short (slow push-ins, smootherstep glides, hard cuts on big
// reframes, flip-sign impact kicks), fast-paced: a cut every ~1-2 s.
// World layout (metres, y up): the main street runs along x (road z 2..12, south pavement z 0..2, north pavement
// z 12..14). South house fronts at z = -0.5, north fronts at z = 14.5. Police station on the north side at x = 0,
// the red post box at x = 24, the owner's front door (3D door + window + lock) at x = 41.1. Interiors (open-fronted
// rooms) stand far away at x = -300 .. -380: the narrator's den, a kitchen and a dining room.
export const FPS = 30;
export const TOTAL = 2650;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- places ----------------
export const STATION: V3 = [0, 0.12, 13.2];
export const MAILBOX: V3 = [24, 0.12, 1.7];
export const DOOR: V3 = [41.125, 0.12, -0.5]; // centre of the owner's door, on the facade plane
export const WIN: V3 = [38.875, 1.525, -0.5]; // the window left of the door (centre)
export const LOCK: V3 = [DOOR[0] + 0.38, 1.02, -0.378]; // keyhole on the lock plate
export const NEWS: V3 = [-20, 0.12, 1.1];
export const ROOM_W = 7, ROOM_D = 5, ROOM_H = 3.2;
export const DEN: V3 = [-300, 0, -300], KITCHEN: V3 = [-340, 0, -300], DINING: V3 = [-380, 0, -300];
export const DESK: V3 = [DEN[0], 0.78, DEN[2] - 1.45]; // desk top centre
export const PILE: V3 = [DEN[0] + 2.0, 0, DEN[2] - 0.7];
export const KTABLE: V3 = [KITCHEN[0], 0.76, KITCHEN[2] - 0.6];
export const DTABLE: V3 = [DINING[0], 0.76, DINING[2] - 0.7];

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night" | "room";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 80, light: "day", sunAz: 140, sunEl: 45 },          // the police laughed at him for months
  { id: 2, a: 80, b: 178, light: "night", sunAz: 150, sunEl: 35 },       // then he robbed the whole city in one night
  { id: 3, a: 178, b: 230, light: "day", sunAz: 130 },                  // it started with a wallet
  { id: 4, a: 230, b: 288, light: "day", sunAz: 120 },                  // every morning, he lifted one
  { id: 5, a: 288, b: 360, light: "golden", sunAz: 150, sunEl: 12 },      // every evening, he mailed it back
  { id: 6, a: 360, b: 512, light: "room", sunAz: 160, sunEl: 62 },      // cash, cards, photos, receipt
  { id: 7, a: 512, b: 570, light: "room", sunAz: 150, sunEl: 55 },      // all of it, untouched
  { id: 8, a: 570, b: 694, light: "room", sunAz: 150, sunEl: 55 },      // he only ever added one thing: a note
  { id: 9, a: 694, b: 768, light: "day", sunAz: 130 },                  // found this. be more careful.
  { id: 10, a: 768, b: 872, light: "day", sunAz: 120 },                 // the papers loved him: the gentleman thief
  { id: 11, a: 872, b: 948, light: "day", sunAz: 140, sunEl: 45 },      // and the police just laughed
  { id: 12, a: 948, b: 1055, light: "day", sunAz: 140, sunEl: 45 },     // what were they supposed to charge him with?
  { id: 13, a: 1055, b: 1228, light: "day", sunAz: 110 },               // wallets hanging out of back pockets
  { id: 14, a: 1228, b: 1330, light: "room", sunAz: 155, sunEl: 55 },   // bragging at dinner parties
  { id: 15, a: 1330, b: 1464, light: "room", sunAz: 150, sunEl: 58 },   // a hundred, two hundred, three hundred
  { id: 16, a: 1464, b: 1612, light: "night", sunAz: 140, sunEl: 35 },  // one Sunday night... all at once
  { id: 17, a: 1612, b: 1694, light: "night", sunAz: 150, sunEl: 35 },  // no broken glass, no kicked-in doors
  { id: 18, a: 1694, b: 1795, light: "night", sunAz: 150, sunEl: 35 },  // every lock opened clean, with its own key
  { id: 19, a: 1795, b: 1898, light: "night", sunAz: 160, sunEl: 40 },  // on every kitchen table, a small folded note
  { id: 20, a: 1898, b: 1952, light: "night", sunAz: 160, sunEl: 40 },  // told you to be more careful
  { id: 21, a: 1952, b: 2002, light: "room", sunAz: 150, sunEl: 55 },   // he never wanted the money
  { id: 22, a: 2002, b: 2096, light: "room", sunAz: 150, sunEl: 55 },   // the two things every wallet carries
  { id: 23, a: 2096, b: 2125, light: "room", sunAz: 160, sunEl: 62 },   // your home address
  { id: 24, a: 2125, b: 2222, light: "room", sunAz: 160, sunEl: 62 },   // that spare key tucked inside
  { id: 25, a: 2222, b: 2294, light: "room", sunAz: 160, sunEl: 62 },   // thirty seconds in a bar of soap
  { id: 26, a: 2294, b: 2368, light: "golden", sunAz: 150, sunEl: 12 },  // in the mail before dinner
  { id: 27, a: 2368, b: 2410, light: "room", sunAz: 150, sunEl: 55 },   // nothing was missing
  { id: 28, a: 2410, b: 2490, light: "day", sunAz: 130 },               // nobody ever changed their locks
  { id: 29, a: 2490, b: 2564, light: "night", sunAz: 150, sunEl: 35 },  // three hundred families robbed in one night
  { id: 30, a: 2564, b: TOTAL, light: "room", sunAz: 150, sunEl: 55 },  // most of them wrote to thank him
];
export const XFADE: Record<number, number> = {};
export const FLASH_AT = 178;
/** set used by each shot (world.ts shows the matching interior / street dressing) */
export const SET: Record<number, "street" | "den" | "kitchen" | "dining"> = {
  1: "street", 2: "street", 3: "street", 4: "street", 5: "street", 6: "den", 7: "den", 8: "den", 9: "street", 10: "street", 11: "street",
  12: "street", 13: "street", 14: "dining", 15: "den", 16: "street", 17: "street", 18: "street", 19: "kitchen", 20: "kitchen", 21: "den",
  22: "den", 23: "den", 24: "den", 25: "den", 26: "street", 27: "kitchen", 28: "street", 29: "street", 30: "den",
};

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (frames) ----------------
export const LIFT = 259;            // "lifted" @259: the wallet changes hands
export const POST1 = 322;           // "mailed" @322: the envelope goes into the slot
export const ITEMS = { cash: 360, cards: 380, photos: 402, receipt: 450 }; // "cash" @360 "cards" @380 "photos" @402 "crumpled" @450
export const NOTE_UP = 576, NOTE_IN = 640, WALLET_SHUT = 676;
export const GENTLEMAN = 845;       // "gentleman" @847: top hat + monocle poof
export const RETURNING = 998;
export const CLONES = 1522, ALL_AT_ONCE = 1578; // "three hundred homes" @1523, "All" @1578
export const KEY_IN = 1700, KEY_TURN = 1716, DOOR_OPEN = 1728;
export const ID_OUT = 2098, KEY_OUT = 2138, GLINT = 2182;
export const PRESS0 = 2232, PRESS1 = 2262;
export const POST2 = 2318;
export const PILE_N: [number, number][] = [[1330, 100], [1378, 200], [1415, 300]];

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
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** top-down over the desk (or any table top): (dx, dz) from the table centre, h above the top */
const top = (c: V3, dx: number, dz: number, h: number, k: number, rest: Partial<Cam> = {}): Shot => {
  const l: V3 = [c[0] + dx, c[1], c[2] + dz];
  return dolly([l[0], l[1] + h, l[2] + 0.16 * h], l, k, { fov: 40, ...rest });
};

// walkers of shot 4 (also read by cast.ts): the mark walks +x, the narrator 1.3 m behind
export const MARK_X = (f: number) => 6 + 1.05 * (f - 230) / FPS;
/** narrator x while tailing the mark (closes in for the lift), then where he stops to show the wallet */
export const NAR_X = (f: number) => MARK_X(f) - (1.3 - 0.62 * smooth((f - 232) / 14));
export const NAR4 = NAR_X(262);
// parade of shot 13: everyone walks +x at ~1 m/s
export const PARADE_X = (f: number) => (f - 1055) / FPS * 1.0;

const S: Record<number, (f: number) => Shot> = {
  // 1: police station, three officers laughing; cut in on the chief ("for months" @46)
  11: (f) => dolly([0.9, 1.2, 6.2], [0.1, 1.4, 13.2], pushK(f, 0, 0.003), { fov: 48, roll: 0.02 }),
  12: (f) => dolly([0.55, 1.55, 10.9], [0.2, 1.62, 13.0], pushK(f, 40, 0.0035, 0.007, 25), { fov: 34, roll: -0.04 }),
  // 2: night: CU narrator grin in the road, crane up and back to the whole street
  21: (f) => dolly([30.35, 1.5, 9.0], [30, 1.48, 7], pushK(f, 80, 0.003), { fov: 36 }),
  22: (f) => dolly([46, 19, 19], [24, 0.5, 6], pushK(f, 100, 0.0015), { fov: 46, roll: 0.03 }),
  // 3: the wallet in a back pocket
  31: (f) => dolly([10.05, 0.9, 2.15], [9.85, 0.84, 1.0], pushK(f, 178, 0.004, 0.008, 20), { fov: 40 }),
  // 4: morning lift: track the two walkers
  41: (f) => { const x = MARK_X(f) - 0.4; return dolly([x + 0.3, 1.25, 6.4], [x, 1.1, 1.0], pushK(f, 230, 0.002), { fov: 42 }); },
  42: (f) => { const x = NAR4 + 0.1; return dolly([x + 0.2, 1.42, 3.4], [x, 1.38, 1.0], pushK(f, 266, 0.003, 0.006, 20), { fov: 36, roll: 0.035 }); },
  // 5: golden post box
  51: (f) => dolly([23.95, 1.25, 5.0], [23.65, 1.2, 1.6], pushK(f, 288, 0.0025), { fov: 38 }),
  52: (f) => dolly([23.7, 1.2, 3.9], [23.55, 1.12, 1.6], pushK(f, 318, 0.003, 0.006, 20), { fov: 34, roll: -0.03 }),
  // 6: desk top-down inserts: cash / cards / photos / receipt, then wide
  61: (f) => top(DESK, -0.06, 0.02, 1.45, pushK(f, 360, 0.003)),
  62: (f) => top(DESK, 0.16, -0.06, 0.85, pushK(f, 380, 0.004), { roll: 0.06 }),
  63: (f) => top(DESK, -0.18, 0.12, 0.8, pushK(f, 402, 0.004), { roll: -0.05 }),
  64: (f) => top(DESK, 0.18, 0.14, 0.75, pushK(f, 436, 0.004, 0.008, 20), { roll: 0.05 }),
  65: (f) => top(DESK, 0.0, 0.04, 1.65, pushK(f, 474, 0.003)),
  // 7: narrator behind the desk, wallet in hand
  71: (f) => dolly([DEN[0] + 0.4, 1.45, DEN[2] + 0.6], [DEN[0], 1.3, DEN[2] - 2.1], pushK(f, 512, 0.003), { fov: 40 }),
  72: (f) => dolly([DEN[0] + 0.25, 1.62, DEN[2] - 0.2], [DEN[0], 1.55, DEN[2] - 2.1], pushK(f, 532, 0.003, 0.006, 20), { fov: 36, roll: 0.03 }),
  // 8: the note: holds it up, then top-down it slides into the wallet
  81: (f) => dolly([DEN[0] - 0.4, 1.5, DEN[2] + 0.6], [DEN[0], 1.45, DEN[2] - 2.1], pushK(f, 570, 0.0025), { fov: 38, roll: -0.02 }),
  82: (f) => dolly([DEN[0] - 0.15, 1.6, DEN[2] + 0.3], [DEN[0], 1.6, DEN[2] - 2.1], pushK(f, 598, 0.003, 0.007, 22), { fov: 34, roll: 0.04 }),
  83: (f) => top(DESK, 0.04, 0.1, 0.95, pushK(f, 634, 0.004)),
  // 9: owner at his door reads the note; over-shoulder insert of the note
  91: (f) => dolly([DOOR[0] + 1.3, 1.55, 3.1], [DOOR[0] + 0.85, 1.5, 0.75], pushK(f, 694, 0.0035), { fov: 36 }),
  92: (f) => dolly([DOOR[0] + 1.0, 1.55, 2.4], [DOOR[0] + 0.85, 1.45, 0.75], pushK(f, 724, 0.003), { fov: 34, roll: 0.03 }),
  // 10: newsboy, flying paper, the front page
  101: (f) => dolly([NEWS[0] + 1.2, 1.3, 5.2], [NEWS[0], 1.3, 1.1], pushK(f, 768, 0.0025), { fov: 40, roll: 0.02 }),
  102: (f) => dolly([NEWS[0] + 0.6, 1.5, 4.6], [NEWS[0] + 0.2, 1.5, 1.1], pushK(f, 823, 0.002, 0.006, 25), { fov: 36 }),
  // 11: police laugh, low wide
  111: (f) => dolly([-2.6, 0.9, 7.4], [0.2, 1.5, 13.2], pushK(f, 872, 0.003), { fov: 48, roll: 0.05 }),
  // 12: the chief shrugs; an officer holds up a returned wallet
  121: (f) => dolly([0.35, 1.58, 11.0], [0.2, 1.6, 13.0], pushK(f, 948, 0.003), { fov: 34 }),
  122: (f) => dolly([1.9, 1.5, 10.8], [1.7, 1.55, 13.4], pushK(f, 998, 0.003, 0.006, 20), { fov: 34, roll: -0.04 }),
  // 13: the parade of wallets, tracking along the pavement
  131: (f) => { const x = PARADE_X(f) + 2.6; return dolly([x + 0.6, 1.15, 7.8], [x, 0.95, 1.0], pushK(f, 1055, 0.002), { fov: 46 }); },
  132: (f) => { const x = PARADE_X(f) + 2.2; return dolly([x + 0.2, 0.85, 3.9], [x, 0.8, 1.0], pushK(f, 1112, 0.003), { fov: 42, roll: 0.03 }); },
  133: (f) => dolly([PARADE_X(1190) + 6.3, 1.5, 3.0], [PARADE_X(1190) + 6.1, 1.45, 0.9], pushK(f, 1176, 0.003, 0.006, 20), { fov: 36 }),
  // 14: dinner party
  141: (f) => dolly([DTABLE[0] + 0.4, 1.6, DTABLE[2] + 3.6], [DTABLE[0], 1.25, DTABLE[2] - 0.6], pushK(f, 1228, 0.0025), { fov: 40 }),
  142: (f) => dolly([DTABLE[0] + 0.2, 1.55, DTABLE[2] + 1.4], [DTABLE[0], 1.52, DTABLE[2] - 0.95], pushK(f, 1268, 0.003, 0.006, 20), { fov: 36, roll: 0.03 }),
  // 15: the wallet pile grows
  151: (f) => dolly([PILE[0] - 0.7, 1.4, PILE[2] + 3.6], [PILE[0] - 0.75, 0.95, PILE[2] - 0.3], pushK(f, 1330, 0.003), { fov: 40 }),
  152: (f) => dolly([PILE[0] + 1.8, 0.6, PILE[2] + 2.6], [PILE[0] - 0.3, 0.8, PILE[2] - 0.3], pushK(f, 1378, 0.003), { fov: 42, roll: -0.04 }),
  153: (f) => dolly([PILE[0] - 0.9, 1.05, PILE[2] + 3.5], [PILE[0], 1.35, PILE[2] - 0.3], pushK(f, 1415, 0.0025, 0.006, 25), { fov: 46, roll: 0.03 }),
  // 16: Sunday night; clones at every door; all at once
  161: (f) => dolly([62, 1.6, 7.5], [20, 3.5, 6.5], pushK(f, 1464, 0.002), { fov: 46 }),
  162: (f) => dolly([58, 9.5, 10.5], [36, 0.8, 0.4], pushK(f, 1520, 0.0025), { fov: 44, roll: 0.03 }),
  163: (f) => dolly([46.5, 2.2, 6.8], [40, 1.2, 0.2], pushK(f, 1576, 0.003, 0.007, 20), { fov: 40, roll: -0.04 }),
  // 17: the intact window, then the intact door with an officer
  171: (f) => dolly([WIN[0] + 0.5, 1.6, 1.5], [WIN[0], 1.5, -0.45], pushK(f, 1612, 0.004), { fov: 34 }),
  172: (f) => dolly([DOOR[0] + 1.0, 1.35, 3.8], [DOOR[0] + 0.5, 1.2, -0.3], pushK(f, 1652, 0.003), { fov: 38, roll: 0.03 }),
  // 18: the lock: key in, turn, the door swings open
  181: (f) => dolly([LOCK[0] + 0.42, 1.12, 0.32], [LOCK[0], 1.02, LOCK[2]], pushK(f, 1694, 0.003), { fov: 32 }),
  182: (f) => dolly([DOOR[0] + 1.9, 1.45, 4.4], [DOOR[0] - 0.1, 1.3, -0.5], pushK(f, 1728, 0.003), { fov: 42 }),
  183: (f) => dolly([LOCK[0] + 0.24, 1.06, 0.06], [LOCK[0], 1.02, LOCK[2]], pushK(f, 1750, 0.004), { fov: 30, roll: 0.04 }),
  // 19: dark kitchen, the note on the table
  191: (f) => dolly([KTABLE[0] + 2.0, 1.75, KTABLE[2] + 3.1], [KTABLE[0], 0.85, KTABLE[2]], pushK(f, 1795, 0.002), { fov: 40 }),
  192: (f) => dolly([KTABLE[0] + 0.9, 1.35, KTABLE[2] + 1.6], [KTABLE[0], 0.8, KTABLE[2]], pushK(f, 1800, 0.002), { fov: 38, roll: 0.03 }),
  193: (f) => top(KTABLE, 0.04, 0.06, 0.75, pushK(f, 1842, 0.004, 0.007, 20), { roll: 0.04 }),
  // 20: the homeowner reads it
  201: (f) => dolly([KTABLE[0] + 0.3, 1.58, KTABLE[2] + 1.6], [KTABLE[0], 1.55, KTABLE[2] - 0.75], pushK(f, 1898, 0.004, 0.007, 20), { fov: 36, roll: -0.03 }),
  // 21: never wanted the money
  211: (f) => dolly([DEN[0] - 0.3, 1.55, DEN[2] - 0.1], [DEN[0], 1.45, DEN[2] - 2.1], pushK(f, 1952, 0.003), { fov: 38, roll: 0.03 }),
  // 22: two things
  221: (f) => dolly([DEN[0] + 0.35, 1.58, DEN[2] - 0.4], [DEN[0] + 0.1, 1.55, DEN[2] - 2.1], pushK(f, 2002, 0.0035), { fov: 36 }),
  222: (f) => top(DESK, 0.0, 0.04, 0.95, pushK(f, 2044, 0.003)),
  // 23: the ID card
  231: (f) => top(DESK, -0.06, -0.06, 0.75, pushK(f, 2096, 0.006), { roll: 0.05 }),
  // 24: the spare key
  241: (f) => top(DESK, 0.08, 0.02, 0.9, pushK(f, 2125, 0.003)),
  242: (f) => top(DESK, 0.2, 0.1, 0.6, pushK(f, 2176, 0.004, 0.008, 20), { roll: -0.06 }),
  // 25: soap
  251: (f) => top(DESK, -0.4, 0.04, 0.95, pushK(f, 2222, 0.003), { roll: 0.03 }),
  // 26: golden post box again (reverse angle, sun behind)
  261: (f) => dolly([22.6, 0.9, 4.4], [23.8, 1.25, 1.5], pushK(f, 2294, 0.0025), { fov: 40, roll: 0.03 }),
  // 27: nothing missing
  271: (f) => dolly([KTABLE[0] - 0.3, 1.6, KTABLE[2] + 1.5], [KTABLE[0], 1.5, KTABLE[2] - 0.75], pushK(f, 2368, 0.004), { fov: 36 }),
  // 28: owner locks his door; pull back to the narrator across the street
  281: (f) => dolly([DOOR[0] + 0.3, 1.45, 2.4], [DOOR[0] + 0.6, 1.3, 0.3], pushK(f, 2410, 0.003), { fov: 38 }),
  282: (f) => dolly([DOOR[0] - 3.5, 1.6, 15.6], [DOOR[0] + 0.2, 1.3, 2.0], pushK(f, 2456, 0.002), { fov: 44, roll: 0.02 }),
  // 29: night aerial: the whole street, the narrator strolling away
  291: (f) => dolly([10, 21, 22], [34, 0.5, 7], pushK(f, 2490, 0.002), { fov: 46, roll: -0.03 }),
  // 30: thank-you letters
  301: (f) => dolly([DEN[0] + 0.3, 1.55, DEN[2] - 0.3], [DEN[0], 1.4, DEN[2] - 2.1], pushK(f, 2564, 0.003), { fov: 36 }),
  302: (f) => { const u = glide((f - 2600) / 45); return dolly([DEN[0] + 0.3 + 0.6 * u, 1.55 + 0.25 * u, DEN[2] - 0.3 + 2.4 * u], [DEN[0], 1.3, DEN[2] - 2.1], 1, { fov: 36 + 6 * u }); },
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S[11] }, { f: 40, cut: true, s: S[12] }],
  2: [{ f: 80, s: S[21] }, { f: 100, dur: 72, s: S[22] }],
  3: [{ f: 178, s: S[31] }],
  4: [{ f: 230, s: S[41] }, { f: 266, cut: true, s: S[42] }],
  5: [{ f: 288, s: S[51] }, { f: 318, cut: true, s: S[52] }],
  6: [{ f: 360, s: S[61] }, { f: 380, cut: true, s: S[62] }, { f: 402, cut: true, s: S[63] }, { f: 436, cut: true, s: S[64] }, { f: 474, cut: true, s: S[65] }],
  7: [{ f: 512, s: S[71] }, { f: 532, cut: true, s: S[72] }],
  8: [{ f: 570, s: S[81] }, { f: 598, cut: true, s: S[82] }, { f: 634, cut: true, s: S[83] }],
  9: [{ f: 694, s: S[91] }, { f: 724, cut: true, s: S[92] }],
  10: [{ f: 768, s: S[101] }, { f: 823, cut: true, s: S[102] }],
  11: [{ f: 872, s: S[111] }],
  12: [{ f: 948, s: S[121] }, { f: 998, cut: true, s: S[122] }],
  13: [{ f: 1055, s: S[131] }, { f: 1112, cut: true, s: S[132] }, { f: 1176, cut: true, s: S[133] }],
  14: [{ f: 1228, s: S[141] }, { f: 1268, cut: true, s: S[142] }],
  15: [{ f: 1330, s: S[151] }, { f: 1378, cut: true, s: S[152] }, { f: 1415, cut: true, s: S[153] }],
  16: [{ f: 1464, s: S[161] }, { f: 1520, cut: true, s: S[162] }, { f: 1576, cut: true, s: S[163] }],
  17: [{ f: 1612, s: S[171] }, { f: 1652, cut: true, s: S[172] }],
  18: [{ f: 1694, s: S[181] }, { f: 1728, cut: true, s: S[182] }],
  19: [{ f: 1795, s: S[191] }, { f: 1800, dur: 40, s: S[192] }, { f: 1842, cut: true, s: S[193] }],
  20: [{ f: 1898, s: S[201] }],
  21: [{ f: 1952, s: S[211] }],
  22: [{ f: 2002, s: S[221] }, { f: 2044, cut: true, s: S[222] }],
  23: [{ f: 2096, s: S[231] }],
  24: [{ f: 2125, s: S[241] }, { f: 2176, cut: true, s: S[242] }],
  25: [{ f: 2222, s: S[251] }],
  26: [{ f: 2294, s: S[261] }],
  27: [{ f: 2368, s: S[271] }],
  28: [{ f: 2410, s: S[281] }, { f: 2456, cut: true, s: S[282] }],
  29: [{ f: 2490, s: S[291] }],
  30: [{ f: 2564, s: S[301] }, { f: 2600, cut: true, s: S[302] }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[LIFT / FPS, 0.4], [POST1 / FPS, 0.35], [GENTLEMAN / FPS, 0.6], [1418 / FPS, 0.9], [ALL_AT_ONCE / FPS + 0.1, 1.2],
  [KEY_TURN / FPS + 0.2, 0.5], [GLINT / FPS, 0.4], [PRESS0 / FPS + 0.5, 0.5], [POST2 / FPS, 0.35]];
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
const eyes = (p: V3, y = 1.55): (() => V3) => () => [p[0], y, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: eyes(STATION) },
  { f: 40, cInf: 13, focus: eyes([0.2, 0, 13.0], 1.62) },
  { f: 80, cInf: 12, focus: eyes([30, 0, 7], 1.5) },
  { f: 100, dur: 40, cInf: 0 },
  { f: 178, cInf: 15, focus: () => [9.85, 0.84, 1.0] },
  { f: 230, cInf: 8 },
  { f: 266, cInf: 12 },
  { f: 288, cInf: 10, focus: eyes([23.4, 0, 1.5], 1.45) },
  { f: 318, cInf: 12, focus: () => [23.8, 1.2, 1.6] },
  { f: 360, cInf: 12, focus: () => [DESK[0], DESK[1], DESK[2]] },
  { f: 474, cInf: 9, focus: () => [DESK[0], DESK[1], DESK[2]] },
  { f: 512, cInf: 10, focus: eyes([DEN[0], 0, DEN[2] - 2.1], 1.5) },
  { f: 532, cInf: 13, focus: eyes([DEN[0], 0, DEN[2] - 2.1], 1.55) },
  { f: 634, cInf: 12, focus: () => [DESK[0], DESK[1], DESK[2]] },
  { f: 694, cInf: 12, focus: eyes([DOOR[0] + 0.85, 0, 0.75], 1.55) },
  { f: 724, cInf: 14, focus: () => [DOOR[0] + 0.95, 1.5, 1.7] },
  { f: 768, cInf: 10, focus: eyes(NEWS, 1.45) },
  { f: 823, cInf: 14, focus: () => [NEWS[0] + 0.5, 1.5, 3.5] },
  { f: 872, cInf: 8, focus: eyes(STATION) },
  { f: 948, cInf: 13, focus: eyes([0.2, 0, 13.0], 1.62) },
  { f: 998, cInf: 13, focus: eyes([1.7, 0, 13.4], 1.55) },
  { f: 1055, cInf: 6 },
  { f: 1112, cInf: 12 },
  { f: 1176, cInf: 13 },
  { f: 1228, cInf: 8, focus: eyes([DTABLE[0], 0, DTABLE[2] - 0.95], 1.5) },
  { f: 1268, cInf: 13, focus: eyes([DTABLE[0], 0, DTABLE[2] - 0.95], 1.55) },
  { f: 1330, cInf: 6, focus: () => [PILE[0] - 0.6, 1.0, PILE[2]] },
  { f: 1415, cInf: 4, focus: () => [PILE[0], 1.4, PILE[2]] },
  { f: 1464, cInf: 0 },
  { f: 1576, cInf: 8, focus: () => [41.1, 1.4, 0.4] },
  { f: 1612, cInf: 13, focus: () => [WIN[0], WIN[1], WIN[2]] },
  { f: 1652, cInf: 10, focus: () => [DOOR[0] + 0.3, 1.3, -0.3] },
  { f: 1694, cInf: 15, focus: () => [LOCK[0], LOCK[1], LOCK[2] + 0.05] },
  { f: 1728, cInf: 10, focus: () => [DOOR[0], 1.2, -0.4] },
  { f: 1795, cInf: 8, focus: () => [KTABLE[0], KTABLE[1], KTABLE[2]] },
  { f: 1842, cInf: 13, focus: () => [KTABLE[0], KTABLE[1], KTABLE[2]] },
  { f: 1898, cInf: 13, focus: eyes([KTABLE[0], 0, KTABLE[2] - 0.75], 1.55) },
  { f: 1952, cInf: 12, focus: eyes([DEN[0], 0, DEN[2] - 2.1], 1.5) },
  { f: 2044, cInf: 12, focus: () => [DESK[0], DESK[1], DESK[2]] },
  { f: 2222, cInf: 12, focus: () => [DESK[0] - 0.5, DESK[1], DESK[2] + 0.1] },
  { f: 2294, cInf: 10, focus: eyes([23.4, 0, 1.5], 1.45) },
  { f: 2368, cInf: 13, focus: eyes([KTABLE[0], 0, KTABLE[2] - 0.75], 1.55) },
  { f: 2410, cInf: 11, focus: eyes([DOOR[0] + 0.6, 0, 0.3], 1.5) },
  { f: 2456, cInf: 3, focus: eyes([DOOR[0] - 0.4, 0, 4.0], 1.5) },
  { f: 2490, cInf: 0 },
  { f: 2564, cInf: 12, focus: eyes([DEN[0], 0, DEN[2] - 2.1], 1.5) },
  { f: 2600, dur: 40, cInf: 7, focus: eyes([DEN[0], 0, DEN[2] - 2.1], 1.5) },
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

/** near framing objects: visible while a <= f < b inside their own shot */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 0, b: 40, kit: "plant_bushDetailed", pos: [-1.6, 0.12, 9.2], s: 0.9, yaw: 0.4 },
  { a: 1055, b: 1112, kit: "plant_bushDetailed", pos: [PARADE_X(1080) + 8.5, 0.12, 2.6], s: 0.7 },
  { a: 2456, b: 2490, kit: "plant_bushDetailed", pos: [DOOR[0] - 4.6, 0.12, 13.0], s: 0.9 },
];
export { add };
