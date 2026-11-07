// Flat ink drawings for effect cards (pixel space of their canvas): coins, the tax roll, the census book, the ALIVE
// check stamp, calendar pages, a tax bill. No letters or numbers anywhere: names are ink squiggles.
import { Pen, INK, rrect } from "./toon";

const squiggle = (p: Pen, x0: number, x1: number, y: number, amp: number, seed: number, w: number, col = "#3a2a2a") => {
  const pts: [number, number][] = [];
  for (let x = x0; x <= x1; x += 6) pts.push([x, y + amp * Math.sin(x * 0.11 + seed * 2.3) * Math.sin(x * 0.037 + seed)]);
  p.stroke(pts, w, col);
};

/** gold coin, 200 x 200 */
export const fxCoin = (p: Pen, spin = 1) => {
  const sx = Math.max(0.12, Math.abs(spin));
  p.ell(100, 100, 82 * sx, 82, "#e8b830", 10);
  p.ell(100, 100, 58 * sx, 58, null, 5, 0, 360);
  if (sx > 0.5) { p.stroke([[100 - 20 * sx, 80], [100, 66], [100 + 20 * sx, 80]], 7, "#b8861a"); p.stroke([[100, 66], [100, 130]], 7, "#b8861a"); p.stroke([[100 - 24 * sx, 112], [100 + 24 * sx, 112]], 7, "#b8861a"); }
  p.arc(100 - 30 * sx, 72, 22 * sx, 20, 200, 270, 6, "#fff2b0");
};

/** the tax roll, 700 x 1000: rolled top and bottom, n names (squiggles); names >= keep are gone */
export const fxRoll = (p: Pen, keep: number) => {
  p.poly(rrect(70, 90, 630, 910, 10), "#f2e4bf", 10);
  for (const y of [90, 910]) { p.ell(350, y, 300, 34, "#e2cf9e", 9); p.ell(60, y, 16, 34, "#c8b07a", 6); }
  for (let i = 0; i < 12; i++) {
    const y = 160 + i * 60;
    p.dot(118, y, 9, "#6a4a3a");
    if (i < keep) squiggle(p, 150, 420 + ((i * 53) % 130), y, 9, i, 7);
    else p.stroke([[150, y], [520, y]], 3, "rgba(120,100,80,0.25)");
  }
  p.ell(530, 840, 42, 42, "#c0353a", 7); p.ell(530, 840, 24, 24, null, 4);
};

/** the open census book, 1000 x 700 (lies flat on the desk): n lines written so far, the last one being written */
export const fxBook = (p: Pen, n: number) => {
  p.poly([[20, 60], [500, 30], [980, 60], [970, 680], [500, 650], [30, 680]], "#6a3a2a", 10);
  for (const s of [-1, 1]) p.poly(s < 0 ? [[50, 70], [500, 48], [500, 630], [55, 660]] : [[500, 48], [950, 70], [945, 660], [500, 630]], "#f6ecd2", 7);
  p.stroke([[500, 48], [500, 630]], 7);
  for (let i = 0; i < 18; i++) {
    const page = i < 9 ? 0 : 1, row = i % 9, x0 = page ? 540 : 90, y = 110 + row * 58;
    if (i >= n) break;
    const len = i === Math.floor(n) - 1 ? 1 : 1;
    p.dot(x0 + 6, y, 7, "#4a3a3a");
    squiggle(p, x0 + 24, x0 + 24 + (220 + ((i * 41) % 120)) * len, y, 8, i + 7, 6);
  }
};

/** big green check in a ring (stamped "alive"), 600 x 600 */
export const fxCheck = (p: Pen) => {
  p.ell(300, 300, 250, 250, "rgba(255,255,255,0.0)", 0);
  p.ell(300, 300, 240, 240, null, 26);
  p.ell(300, 300, 240, 240, null, 16, 0, 360);
  const g = p.g; g.save(); g.lineCap = "round"; g.lineJoin = "round";
  p.stroke([[170, 310], [265, 405], [440, 200]], 92, INK);
  p.stroke([[170, 310], [265, 405], [440, 200]], 64, "#3fb45a");
  g.restore();
  p.ell(300, 300, 240, 240, null, 0);
  const ring: [number, number][] = []; for (let i = 0; i <= 64; i++) ring.push([300 + 236 * Math.cos(i / 10.2), 300 + 236 * Math.sin(i / 10.2)]);
  p.stroke(ring, 30, INK); p.stroke(ring, 16, "#3fb45a");
};

/** a calendar page, 400 x 480: red header bar, grid of day boxes (no numbers), the seed varies the crossed days */
export const fxPage = (p: Pen, seed: number) => {
  p.poly(rrect(20, 20, 380, 460, 14), "#fbf7ee", 9);
  p.clip(rrect(20, 20, 380, 460, 14), () => p.poly([[20, 20], [380, 20], [380, 110], [20, 110]], "#d8443c", 0));
  p.stroke([[20, 110], [380, 110]], 8);
  for (const x of [120, 280]) { p.ell(x, 30, 14, 20, "#dcdcdc", 6); }
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
    const x = 50 + c * 52, y = 140 + r * 60;
    p.poly(rrect(x, y, x + 40, y + 44, 6), "#efe9da", 3);
    if (((r * 6 + c + seed) % 7) < 3) { p.stroke([[x + 6, y + 6], [x + 34, y + 38]], 5, "#c0353a"); p.stroke([[x + 34, y + 6], [x + 6, y + 38]], 5, "#c0353a"); }
  }
};

/** sparkle star, 200 x 200 */
export const fxSpark = (p: Pen) => {
  p.poly([[100, 6], [122, 78], [194, 100], [122, 122], [100, 194], [78, 122], [6, 100], [78, 78]], "#fff3a0", 8);
};
