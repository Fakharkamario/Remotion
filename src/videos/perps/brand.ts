// GOAT Funded Perps brand tokens + one-shot asset loader (fonts for DOM and canvas textures, logo SVG source).
import { staticFile } from "remotion";

export const C = {
  ground: "#090C10",
  perps: "#EC8B1B",
  perpsHot: "#F6A03A",
  text: "#EFF4FA",
  t2: "#B9BDC3",
  t3: "#8D9197",
  icon: "#63676C",
  success: "#36C46E",
  error: "#FF756A",
};
export const FD = '"MD Nichrome", Impact, "Arial Narrow", sans-serif';
export const FB = 'Altform, Inter, "Helvetica Neue", Arial, sans-serif';

export type Brand = { shieldSvg: string };
let loading: Promise<Brand> | null = null;

export const loadBrand = () =>
  (loading ??= (async () => {
    const faces = [
      new FontFace("MD Nichrome", `url(${staticFile("goat-perps/fonts/MDNichrome-Black.woff2")})`, { weight: "900" }),
      new FontFace("Altform", `url(${staticFile("goat-perps/fonts/altform-regular.woff2")})`, { weight: "400" }),
      new FontFace("Altform", `url(${staticFile("goat-perps/fonts/altform-semibold.woff2")})`, { weight: "600" }),
    ];
    for (const f of faces) {
      await f.load();
      (document.fonts as unknown as Set<FontFace>).add(f);
    }
    const shieldSvg = await fetch(staticFile("goat-perps/logo/goat-logo-white.svg")).then((r) => r.text());
    return { shieldSvg };
  })());

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
/** progress of frame t through [a, b] */
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
