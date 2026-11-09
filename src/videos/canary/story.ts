// Timeline of "The Canary" (coal miners): shots timed to the user's voiceover (shorts/canary/voice/words.json, word
// onsets in frames noted below). Two places: the pithead on the surface (headframe over the shaft at the origin) and
// the gallery underground (Y0 = -200: a timbered tunnel running from the shaft bottom at x = 0 to the coal face at
// x = -90). The Narrator (the user's character) tells the story on screen: at the pithead, in the gallery, in the
// explanation and in the final whistle.
import WORDS from "../../../shorts/canary/voice/words.json";

export const FPS = 30;
export const TOTAL = 1845;
export const D0 = 0; // ground height (build.ts)
export type V3 = [number, number, number];
export const Y0 = -200; // gallery floor
export const FACE_X = -90; // coal face
export const TW = 2.3; // tunnel half width (z)
export const TH = 2.9; // tunnel height

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- voice ----------------
type W = { w: string; s: number; e: number };
const words = WORDS as W[];
/** narrator mouth openness 0..1 at time t: open on syllable beats inside words, shut in gaps */
export const mouthAt = (t: number) => {
  for (const w of words) {
    if (t < w.s - 0.02) break;
    if (t <= w.e + 0.02) {
      const syl = Math.max(1, Math.round((w.e - w.s) / 0.17)), u = (t - w.s) / Math.max(0.05, w.e - w.s);
      return Math.round((0.25 + 0.7 * Math.abs(Math.sin(Math.PI * u * syl))) * 5) / 5;
    }
  }
  return 0;
};

// ---------------- shots ----------------
export type Light = "day" | "golden" | "mine";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: "top" | "mine"; sunAz?: number; sunEl?: number; hideNear?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 130, light: "golden", place: "top", sunAz: 150, sunEl: 16 },        // three notes, the canary answers
  { id: 2, a: 130, b: 305, light: "golden", place: "top", sunAz: -145, sunEl: 16 },     // the young guys howl; Tommy
  { id: 3, a: 305, b: 432, light: "mine", place: "mine" },                             // new seam, deep, quiet
  { id: 4, a: 432, b: 660, light: "mine", place: "mine" },                             // the whistle; nothing; swaying
  { id: 5, a: 660, b: 860, light: "mine", place: "mine" },                             // drops the pick, shoves; Tommy laughs
  { id: 6, a: 860, b: 962, light: "mine", place: "mine", hideNear: true },             // drags him by the collar
  { id: 7, a: 962, b: 1085, light: "mine", place: "mine" },                            // lamps dim, men stumble
  { id: 8, a: 1085, b: 1170, light: "day", place: "top", sunAz: 60, sunEl: 40 },       // at the top: Tommy coughing
  { id: 9, a: 1170, b: 1360, light: "day", place: "top", sunAz: 70, sunEl: 38 },       // breathes into the bird; three notes
  { id: 10, a: 1360, b: 1670, light: "day", place: "top", sunAz: -60, sunEl: 40 },     // the Narrator explains
  { id: 11, a: 1670, b: TOTAL, light: "golden", place: "top", sunAz: 145, sunEl: 14 },  // the whole crew whistles
];
export const XFADE: Record<number, number> = { 3: 10, 8: 10, 11: 12 };
export const FLASH_AT = -100;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- set pieces ----------------
// surface
export const POST1: V3 = [5.6, 0, 5.0];   // cage post at the pithead (hook at 2.05 m)
export const OLD1: V3 = [4.8, 0, 5.25];
export const NARR1: V3 = [6.45, 0, 5.7];
export const CREW: V3[] = [[3.0, 0, 1.6], [4.1, 0, 1.1], [5.5, 0, 1.5], [6.4, 0, 2.3], [2.4, 0, 2.6]];
export const TOMMY1: V3 = [4.6, 0, 2.9];
export const KNEEL: V3 = [3.0, 0, 4.4];       // Tommy coughing at the top
export const OLD9: V3 = [1.2, 0, 4.6];        // old man with the bird in his hands
export const NARR10: V3 = [-6.0, 0, 6.2];     // explanation
export const POST10: V3 = [-5.0, 0, 6.0];
export const LINE: V3[] = [[-1.9, 0, 2.0], [-1.15, 0, 2.3], [-0.4, 0, 2.45], [0.4, 0, 2.45], [1.15, 0, 2.3], [1.9, 0, 2.0]]; // ending line-up
export const TOMMY11: V3 = [0.0, 0, 3.3];
export const NARR11: V3 = [1.3, 0, 4.0];
// underground
export const CAGEM: V3 = [-84.4, Y0 + 2.42, -1.35]; // hook under a cap beam
export const OLDM: V3 = [-86.0, Y0, 0.95];
export const TOMMYM: V3 = [-87.6, Y0, -0.5];
export const MINERSM: V3[] = [[-88.4, Y0, 1.35], [-86.4, Y0, -1.55], [-87.3, Y0, 1.95]];
export const NARRM: V3 = [-88.6, Y0, -1.7];
export const NOTES_OLD = [521, 553];      // "One" @521, "two" @553
export const DROP = 686;                  // "drops" @693
export const STUMBLE = [1014, 1053];      // "stumbles" @1028, "another" @1061
export const DIM0 = 978;                  // "lamps dim" @986..996
export const BREATH = [1270, 1294];       // "Once" @1272, "twice" @1296
export const REVIVE = 1322;               // "three notes" @1325
export const SING_BACK = 72;              // "the canary whistled them right back" @73

/** lamp brightness in the gallery (1 = normal): flickers and sinks on "the lamps dim" */
export const dimAt = (id: number, f: number) => {
  if (id !== 7) return 1;
  const u = smooth((f - DIM0) / 20);
  const fl = f > DIM0 && f < DIM0 + 30 ? 0.08 * Math.sin(f * 2.7) * Math.sin(f * 1.3) : 0;
  return 1 - 0.5 * u + fl;
};

/** ending: which line-up spot whistles how loud */
export const SPOTS = { POST1, POST10 };

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
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const Y = (v: V3, dy: number): V3 => [v[0], v[1] + dy, v[2]];
const at = (v: V3, dx: number, dy: number, dz: number): V3 => [v[0] + dx, v[1] + dy, v[2] + dz];

// 1: the old man whistles to the cage at the pithead, the Narrator tells it to the lens
const S1a = (f: number) => dolly([5.9, 1.6, 12.0], [5.6, 1.5, 5.1], pushK(f, 0, 0.0022), { fov: 40 });
const S1b = (f: number) => dolly([5.75, 1.85, 8.3], [5.45, 1.8, 5.0], pushK(f, 66, 0.0025, 0.006, 26), { fov: 38, roll: 0.03 }); // canary answers
// 2: the crew howls; the teaser; punch in on Tommy ("Loudest" @247)
const S2a = (f: number) => dolly([1.0, 1.7, 10.5], [4.3, 1.35, 2.0], pushK(f, 130, 0.0022), { fov: 40 });
const S2b = (f: number) => dolly([3.9, 1.65, 6.8], [4.5, 1.5, 2.9], pushK(f, 190, 0.0025), { fov: 36, roll: -0.03 });
const S2c = (f: number) => dolly([4.75, 1.6, 5.4], [4.6, 1.55, 2.9], pushK(f, 245, 0.003, 0.007, 28), { fov: 34, roll: 0.035 });
// 3: the coal face ("hit" @327), the long gallery ("Deep" @371), the cage ("quiet" @402)
const S3a = (f: number) => dolly([-81.2, Y0 + 1.45, 1.4], [-87.2, Y0 + 1.3, 0.1], pushK(f, 305, 0.0022), { fov: 46 });
const S3b = (f: number) => dolly([-34, Y0 + 1.5, 0.4], [-88, Y0 + 1.25, 0], pushK(f, 365, 0.0018), { fov: 30 });
const S3c = (f: number) => dolly([-82.6, Y0 + 2.0, 0.5], [CAGEM[0], CAGEM[1] - 0.35, CAGEM[2]], pushK(f, 398, 0.0025), { fov: 34 });
// 4: old man whistles ("whistles" @473), "One" @521, "two" @553; "Nothing" @583 -> the silent cage, swaying @614
const S4a = (f: number) => dolly([-82.9, Y0 + 1.6, 2.05], [-86.0, Y0 + 1.5, 0.7], pushK(f, 432, 0.0022), { fov: 38 });
const S4b = (f: number) => dolly([-83.6, Y0 + 1.68, 1.55], [-85.9, Y0 + 1.62, 0.7], pushK(f, 515, 0.0025, 0.005, 30), { fov: 34, roll: 0.03 });
const S4c = (f: number) => dolly([-82.3, Y0 + 1.8, 0.75], [CAGEM[0] - 0.5, CAGEM[1] - 0.6, CAGEM[2]], pushK(f, 580, 0.003, 0.007, 30), { fov: 38, roll: -0.035 });
// 5: the pick drops (@686), he shoves men toward the shaft (@720), "Tommy laughs" @787 / "She's just shy" @824
const S5a = (f: number) => dolly([-83.2, Y0 + 1.35, 1.9], [-86.0, Y0 + 1.0, 0.85], pushK(f, 660, 0.0025), { fov: 42 });
const S5b = (f: number) => dolly([-72.5, Y0 + 1.65, 0.9], [-83.5, Y0 + 1.2, 0], pushK(f, 715, 0.0018), { fov: 42 });
const S5c = (f: number) => dolly([-85.0, Y0 + 1.62, 1.2], [TOMMYM[0], Y0 + 1.55, TOMMYM[2]], pushK(f, 780, 0.003, 0.007, 30), { fov: 34, roll: 0.035 });
// 6: side-on tracking: the old man drags Tommy toward the shaft (near wall hidden)
export const DRAG_X = (f: number) => -80 + 1.35 * (T(f) - 860 / FPS);
const S6a = (f: number) => { const x = DRAG_X(f) + 0.1; return dolly([x, Y0 + 1.35, 6.2], [x, Y0 + 1.15, 0], pushK(f, 860, 0.0015), { fov: 42 }); };
// 7: looking back down the gallery: lamps dim (@986), a man stumbles (@1028), then another (@1061)
const S7a = (f: number) => dolly([-58.5, Y0 + 1.55, 0.7], [-70, Y0 + 1.15, -0.1], pushK(f, 962, 0.002), { fov: 42 });
const S7b = (f: number) => dolly([-61.5, Y0 + 1.3, 0.9], [-69.5, Y0 + 0.9, 0.0], pushK(f, 1010, 0.003, 0.006, 26), { fov: 40, roll: 0.04 });
// 8: at the top: Tommy coughing on his knees (@1125)
const S8a = (f: number) => dolly([1.4, 1.5, 9.4], [2.6, 0.9, 4.4], pushK(f, 1085, 0.0025), { fov: 40 });
const S8b = (f: number) => dolly([2.6, 1.3, 8.2], [3.0, 0.85, 4.4], pushK(f, 1122, 0.003), { fov: 36, roll: -0.03 });
// 9: the old man breathes into the bird ("Once" @1272, "twice" @1296), "three notes" @1325
const S9a = (f: number) => dolly([1.6, 1.6, 8.2], [1.2, 1.35, 4.6], pushK(f, 1170, 0.0022), { fov: 38 });
const S9b = (f: number) => dolly([1.35, 1.45, 6.5], [1.2, 1.38, 4.6], pushK(f, 1262, 0.0028, 0.005, 30), { fov: 34, roll: 0.03 });
const S9c = (f: number) => dolly([1.4, 1.5, 7.6], [1.2, 1.45, 4.6], pushK(f, 1322, 0.0022), { fov: 38 });
// 10: the Narrator explains beside the cage post
const S10a = (f: number) => dolly([-5.2, 1.55, 11.2], [-5.6, 1.35, 6.1], pushK(f, 1360, 0.0018), { fov: 40 });
const S10b = (f: number) => dolly([-4.8, 1.6, 9.6], [-5.6, 1.4, 6.1], pushK(f, 1462, 0.0022), { fov: 38, roll: -0.03 }); // carbon monoxide
const S10c = (f: number) => dolly([-4.9, 1.75, 10.2], [-5.5, 1.55, 6.0], pushK(f, 1518, 0.0025, 0.005, 30), { fov: 38, roll: 0.03 }); // the canary feels it
const S10d = (f: number) => dolly([-6.2, 1.55, 9.8], [-6.25, 1.45, 6.2], pushK(f, 1600, 0.003, 0.007, 34), { fov: 36 }); // you had minutes
// 11: the line-up whistles before going down; push in on Tommy ("Tommy whistles loudest" @1774), ease back to end
const S11a = (f: number) => dolly([0.2, 1.7, 11.8], [0.3, 1.45, 2.4], pushK(f, 1670, 0.0018), { fov: 42 });
const S11b = (f: number) => dolly([0.1, 1.6, 6.6], [0.0, 1.55, 3.3], pushK(f, 1772, 0.003, 0.006, 30), { fov: 36, roll: 0.03 });
const S11c = (f: number): Shot => {
  const a = S11b(1812), u = glide((f - 1812) / 33);
  return { pos: [a.pos[0] + 0.3 * u, a.pos[1] + 0.25 * u, a.pos[2] + 3.4 * u] as V3, look: [a.look[0] + 0.3 * u, a.look[1] - 0.05 * u, a.look[2] - 0.6 * u] as V3, fov: 36 + 6 * u, roll: 0.03 * (1 - u) };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 66, cut: true, s: S1b }],
  2: [{ f: 130, s: S2a }, { f: 190, dur: 26, s: S2b }, { f: 245, cut: true, s: S2c }],
  3: [{ f: 305, s: S3a }, { f: 365, cut: true, s: S3b }, { f: 398, cut: true, s: S3c }],
  4: [{ f: 432, s: S4a }, { f: 512, dur: 26, s: S4b }, { f: 580, cut: true, s: S4c }],
  5: [{ f: 660, s: S5a }, { f: 715, cut: true, s: S5b }, { f: 780, cut: true, s: S5c }],
  6: [{ f: 860, s: S6a }],
  7: [{ f: 962, s: S7a }, { f: 1008, dur: 30, s: S7b }],
  8: [{ f: 1085, s: S8a }, { f: 1120, cut: true, s: S8b }],
  9: [{ f: 1170, s: S9a }, { f: 1260, dur: 28, s: S9b }, { f: 1320, dur: 26, s: S9c }],
  10: [{ f: 1360, s: S10a }, { f: 1460, cut: true, s: S10b }, { f: 1516, cut: true, s: S10c }, { f: 1598, cut: true, s: S10d }],
  11: [{ f: 1670, s: S11a }, { f: 1770, cut: true, s: S11b }, { f: 1812, s: S11c }],
};

// impact kicks: offset flips sign every frame, decays over 7 f
const KICKS: [number, number][] = [[326 / FPS, 0.9], [338 / FPS, 0.5], [(DROP + 8) / FPS, 0.5], [(STUMBLE[0] + 10) / FPS, 0.45], [(STUMBLE[1] + 10) / FPS, 0.45]];
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
  { f: 0, cInf: 8, focus: () => Y(OLD1, 1.6) },
  { f: 66, cInf: 12, focus: () => [POST1[0], 1.85, POST1[2]] },
  { f: 130, cInf: 6, focus: () => [4.4, 1.5, 2.0] },
  { f: 245, cInf: 13, focus: () => Y(TOMMY1, 1.6) },
  { f: 305, cInf: 8, focus: () => [-87, Y0 + 1.5, 0.2] },
  { f: 365, cInf: 0 },
  { f: 398, cInf: 13, focus: () => Y(CAGEM, -0.3) },
  { f: 432, cInf: 11, focus: () => Y(OLDM, 1.6) },
  { f: 580, cInf: 13, focus: () => Y(CAGEM, -0.35) },
  { f: 660, cInf: 10, focus: () => Y(OLDM, 1.2) },
  { f: 715, cInf: 5, focus: () => [-80, Y0 + 1.5, 0] },
  { f: 780, cInf: 13, focus: () => Y(TOMMYM, 1.6) },
  { f: 860, cInf: 6, focus: (f) => [DRAG_X(f), Y0 + 1.4, 0] },
  { f: 962, cInf: 6, focus: () => [-64, Y0 + 1.4, 0] },
  { f: 1085, cInf: 9, focus: () => Y(KNEEL, 1.0) },
  { f: 1170, cInf: 11, focus: () => Y(OLD9, 1.4) },
  { f: 1360, cInf: 9, focus: () => Y(NARR10, 1.6) },
  { f: 1516, cInf: 12, focus: () => [POST10[0], 1.75, POST10[2]] },
  { f: 1598, cInf: 12, focus: () => Y(NARR10, 1.6) },
  { f: 1670, cInf: 4, focus: () => [0, 1.5, 2.5] },
  { f: 1770, cInf: 12, focus: () => Y(TOMMY11, 1.6) },
  { f: 1812, dur: 30, cInf: 5, focus: () => Y(TOMMY11, 1.6) },
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
export const FOREGROUND: { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number }[] = [];
export { at };
