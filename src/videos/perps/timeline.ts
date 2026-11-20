// Shot table for scenes 1-2 (30 fps). Global frame ranges [from, to).
export const SHOTS = {
  "1A": [0, 52], // trader at the screens, 2am
  "1B": [52, 92], // markets flip to CLOSED
  "1C": [92, 128], // MARKET CLOSED?
  "1D": [128, 150], // strike
  "2A": [150, 190], // chrome shield rises
  "2B": [190, 232], // lockup
  "2C": [232, 284], // 24/7 · 365
  "2D": [284, 330], // weekends included
} as const;
export type ShotId = keyof typeof SHOTS;
export const PERPS_FRAMES = 330;

export const shotAt = (f: number): ShotId => {
  for (const [id, [a, b]] of Object.entries(SHOTS)) if (f >= a && f < b) return id as ShotId;
  return "2D";
};
export const local = (f: number, id: ShotId) => f - SHOTS[id][0];
