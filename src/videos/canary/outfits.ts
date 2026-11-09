// Miners, early 1900s: domed helmets with lamps, work jackets, the old man's grey moustache.
import { Outfit, SKINS, SKIN } from "./toon";
export const OLD: Outfit = { jacket: "#4f5f7f", pants: "#4a3f36", boots: "#2a1e1a", hat: "helmet", cap: "#7a5a3a", moustache: "#a59d92", build: "stout", skin: SKINS[1], buttons: "#c9a23a" };
export const TOMMY: Outfit = { jacket: "#c0633a", pants: "#3b3f52", boots: "#2a1e1a", hat: "helmet", cap: "#8a6a44", skin: SKIN };
export const miner = (v: number): Outfit => ({
  jacket: ["#5d6a3a", "#6a4a3a", "#3f5f6a", "#7a6a4a", "#5a4a6a"][v % 5], pants: ["#3b3f52", "#4a3f36", "#2f3540"][v % 3], boots: "#2a1e1a",
  hat: "helmet", cap: ["#6e5236", "#806040", "#5e4a36"][v % 3], skin: SKINS[(v + 2) % 4], moustache: v % 3 === 1 ? "#3a2a20" : undefined,
});
