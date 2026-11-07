// The cast of Petrine Russia (1720s) as outfits for toon.ts bodyFront: the tsar, peasants, a grandfather, the tax
// collector, the census clerk, a wealthy aristocrat and a banker.
import { Outfit, SKINS } from "./toon";

/** Peter the Great: tall, dark-green Preobrazhensky coat with red cuffs/sash, tricorn, his small moustache */
export const PETER: Outfit = { jacket: "#2f5a3c", pants: "#2c2a30", boots: "#1f1a1a", hat: "tricorn", moustache: "#2a1c14", sash: "#b8333a", buttons: "#e2c25a", skin: SKINS[1] };
const SHIRTS = ["#d9cdb4", "#b84a3a", "#e4dccb", "#7a8fb0", "#c9a46a"];
const CAPS = ["#7a5236", "#5a4a3a", "#8a6a4a"];
/** bearded peasant men in long shirts (rubakha) with a belt, felt kolpak caps */
export const PEASANT = (v = 0): Outfit => ({
  jacket: SHIRTS[v % 5], pants: ["#6a6050", "#4a4a52", "#7a6a52"][v % 3], boots: "#b89a6a", belt: null, hat: v % 3 === 2 ? "hair" : "kolpak", cap: CAPS[v % 3],
  hair: "#6a4a2a", beard: ["#6a4a2a", "#8a6a3a", "#3a2a1c"][v % 3], skin: SKINS[(v + 1) % 3],
});
/** women in sarafans with headscarves */
export const BABA = (v = 0): Outfit => ({
  jacket: ["#efe6d2", "#e8dcc4"][v % 2], pants: "#4a3a32", boots: "#6a4a2a", hat: "scarf", cap: ["#c0403a", "#3f6fb5", "#d9a441"][v % 3],
  dress: ["#b0353a", "#2f5f8a", "#7a3a5a"][v % 3], skin: SKINS[v % 3],
});
export const GRANDPA: Outfit = { jacket: "#d9cdb4", pants: "#6a6050", boots: "#b89a6a", hat: "hair", hair: "#e8e4dc", beard: "#efebe4", skin: SKINS[0] };
export const KIDP: Outfit = { jacket: "#c9a46a", pants: "#5a5048", boots: "#b89a6a", hat: "hair", hair: "#c89a5a", build: "kid", skin: SKINS[1] };
/** the tsar's tax collector: blue official's coat, tricorn */
export const COLLECTOR: Outfit = { jacket: "#2f4a7a", pants: "#2c2a30", boots: "#1f1a1a", hat: "tricorn", buttons: "#d9b45a", moustache: "#3a2a20", build: "stout" };
/** census clerk: brown coat, powdered wig */
export const CLERK: Outfit = { jacket: "#6a4a3a", pants: "#3b3530", boots: "#2a1e1a", hat: "wig", buttons: "#d9b45a", skin: SKINS[2] };
/** wealthy aristocrat: rose silk coat, powdered wig, stout */
export const ARISTO: Outfit = { jacket: "#c8607a", pants: "#efe3d0", boots: "#2a1e1a", hat: "wig", buttons: "#f0d070", build: "stout", sash: "#4a8ac0", skin: SKINS[0] };
/** banker: plum coat, wig */
export const BANKER: Outfit = { jacket: "#4a3a5a", pants: "#2c2a30", boots: "#1f1a1a", hat: "wig", buttons: "#e2c25a", moustache: "#5a4a3a", skin: SKINS[1] };
