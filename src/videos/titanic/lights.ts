// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
// "day" = the moonless night outside (cool starlight key, warm lit windows do the rest); "golden" = warm cabin lamps.
export const LIGHTS: Record<"day" | "golden", LightPreset> = {
  day: {
    az: 110, el: 40,
    lit: [0.78, 0.86, 1.25], shade: [0.16, 0.18, 0.34], lift: [0.03, 0.04, 0.1], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [0.8, 0.84, 1.0], charShade: 0.84, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.85, 0.88, 1.0],
    blob: [0.5, 0.52, 0.66], actorShadow: false,
    top: "#050a1c", hor: "#22325c", skyCurve: [0.0, 0.5, 0.6], fog: "#1c2a50", fogNear: 120, fogFar: 1100, sunDisc: "#000000",
    sunCol: "#c8d6ff", sunI: 1.6, sky: "#3a4a7a", ground: "#101828", hemiI: 0.4,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 60, el: 55,
    lit: [1.45, 1.12, 0.74], shade: [0.34, 0.25, 0.3], lift: [0.06, 0.04, 0.06], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.86, 0.7], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.95, 0.85, 0.85],
    blob: [0.62, 0.52, 0.5], actorShadow: false,
    top: "#3a2a20", hor: "#3a2a20", skyCurve: [0.0, 0.5, 0.6], fog: "#3a2a20", fogNear: 60, fogFar: 400, sunDisc: "#000000",
    sunCol: "#ffd8a0", sunI: 2.0, sky: "#ffe0b0", ground: "#5a3a2a", hemiI: 0.5,
    bias: -0.0004, normalBias: 0.01,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<"day" | "golden", WorldLook> = {
  day: {
    // moonless night: deep navy overhead, a faint lighter band at the horizon so the ship and the sea separate
    sky: { c: ["#24355f", "#1a2950", "#111d3e", "#0a1430", "#050a1e"], e: [0, 3, 9, 20, 50] },
    water: { near: "#0c1c38", mid: "#0f2244", far: "#1a2a52", crest: "#2c4a7c", trough: "#050d20", glint: "#6c8cc4", shade: [0.55, 0.6, 0.8] },
    cloud: { lit: "#2a3a66", mid: "#1e2c55", shade: "#152044" },
    bounce: [0, 0, 0],
    sat: 1.05,
  },
  golden: {
    sky: { c: ["#3a2a20", "#3a2a20", "#3a2a20", "#3a2a20", "#3a2a20"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.05,
  },
};
