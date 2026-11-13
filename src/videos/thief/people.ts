// The cast of "The Gentleman Thief": the narrator (character sheet: curly top, round eyes, black hoodie, grey jeans),
// the police, and the townsfolk whose wallets he borrows.
import { Outfit, SKINS, INK } from "./toon";

export const NARRATOR: Outfit = {
  jacket: "#34343c", pants: "#6a6e78", boots: "#2a2c34", skin: "#f6dcc6", curls: "#4a3226", roundEyes: true, hoodie: true, hands: true,
  soles: "#8a8e98",
};
export const COP: Outfit = { jacket: "#2b3c6b", pants: "#26304f", boots: INK, hat: "cap", cap: "#1f2a4a", badge: true, buttons: "#e8c45a", skin: SKINS[1] };
export const CHIEF: Outfit = { ...COP, build: "stout", moustache: "#4a3020", skin: SKINS[2] };
const HAIR = ["#5a3b2a", "#2a2220", "#b07a3a", "#8a5a3a", "#d9b46a", "#6a4a3a"];
const COATS = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#c9a03f", "#4a8a8a"];
/** modern-ish townsfolk: jackets / dresses, hair or a cap */
export const citizen = (v = 0): Outfit => {
  const o: Outfit = { jacket: COATS[v % 8], pants: ["#3b3f52", "#4a3f36", "#2f3540", "#5a5f6a"][v % 4], boots: ["#3a2a22", "#2a2c34", "#5a3b2a"][v % 3],
    skin: SKINS[v % 4], hat: "hair", hair: HAIR[v % 6], hands: true };
  if (v % 3 === 1) return { ...o, dress: ["#d9a441", "#c25a7a", "#5a8fc2", "#6aa86a"][v % 4] };
  if (v % 5 === 2) return { ...o, hat: "cap", cap: ["#5a5048", "#3d4450", "#6a5a42"][v % 3], moustache: v % 2 ? "#3a2a20" : undefined };
  return o;
};
