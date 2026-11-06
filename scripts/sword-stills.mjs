// usage: node scripts/sword-stills.mjs <outPrefix> <frame,frame,...> [scale] [inputPropsJSON]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, frames, scale = "0.5", props = "{}"] = process.argv.slice(2);
const browserExecutable = process.env.BROWSER_EXE || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: process.env.REMOTION_GL || "swangle" };
const inputProps = JSON.parse(props);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "SwordShort", browserExecutable, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (l.type === "error") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale),
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 240000, onBrowserLog, inputProps });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
process.exit(0);
