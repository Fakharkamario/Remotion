# fluxdesk launch (HyperFrames)

A 16 s, 1920x1080 / 24 fps HyperFrames clip. It is a beat-for-beat rebuild of the reference launch promo's
motion and timing, rebranded: the product is **Fluxdesk** (fluxdesk.trade), launching on the **Nova Network**.
All copy, the stair-block mark, the wordmark, the UI text and the token artwork are new.

| ref frames | composition | beat |
|------------|-------------|------|
| 0–23    | `intro`    | a glyph tile pulls back through the grid ( / > + ), spins to a diamond; a flash reveals a tile staircase |
| 24–53   | `headline` | "Early Access is open." word by word with glyph pops, orbit paths, a light flash, push-in, break-up |
| 54–117  | `dash`     | glyph burst → constellation → pixel cursor wires up the dashboard; Launchpad fills; 3D push, flash, pan away |
| 118–138 | `nova1`    | tumbling cube silhouette with inverting "Nova Network Synced", stroke rows, glyph rows, strobe |
| 139–241 | `market`   | Markets table scroll, token field gathers, amount slider to 100%, pixel letters |
| 242–283 | `nova2`    | "Nova" with spinning diamonds, "Nova now trades on Fluxdesk.", grainy orange wipe |
| 284–335 | `logo`     | mark square, wireframe cube cycling glyphs, solid cubes, blocks drop into the mark, wordmark types in |
| 336–383 | `outro`    | wordmark holds, scrambles to a dot, "fluxdesk.trade" types out |

Every scene is drawn on a canvas as a pure function of the reference frame number (`K.mount` drives it from a
GSAP setter tween, so any frame seeks and renders on its own). Shared helpers: `assets/kit.js` (grids, glyphs,
glow/bloom, 3D projection, pixel cursor), `assets/tokens.js` (original token art), `assets/brand.js` (mark +
wordmark). No soundtrack is included.

```bash
npx hyperframes preview
npx hyperframes render -f 24 -q high -o renders/fluxdesk-launch.mp4
```
