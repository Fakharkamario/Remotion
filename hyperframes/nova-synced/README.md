# nova network synced (HyperFrames)

A 5.27 s, 1920x1080 / 30 fps HyperFrames clip. The motion is rebuilt frame by frame from a reference cut: its
24 fps animation grid, its repeated-frame cadence, cube silhouettes, camera path, panel and cursor tracks,
flashes and pixel-letter hits. The content is the Nova Network one: "Nova Network Synced", the Markets table
(ORBT, unnamed, KILN, VOLT, MOSS, FLRE), the original token tiles with the robot mascot, the AMOUNT panel
ramping to 2180.40 USDC, and the "Nova" end card.

| ref frames | time (s)      | composition | beat |
|------------|---------------|-------------|------|
| 0–20       | 0.000–0.875   | `cube`      | tumbling cube silhouette with inverting "Nova Network Synced", slash hatch, strobes, dot and glyph rows |
| 21–43      | 0.875–1.833   | `market`    | Markets page: the header bar flares, the page settles left, rows resolve, the page scrolls away and tilts |
| 44–64      | 1.833–2.708   | `market`    | black, then a field of token tiles streams past (far tiles fall, near tiles rise) |
| 64–84      | 2.708–3.542   | `market`    | the tiles gather; the pixel cursor drops in, the AMOUNT panel slides down, the mascot tile lights up |
| 85–104     | 3.542–4.375   | `market`    | push-in; the cursor drags the slider to 100% and the panel flares white and green |
| 105–122    | 4.375–5.125   | `market`    | pull-back and reshuffle, the cursor flies off, pixel letters break in |
| 123–125    | 5.125–5.267   | `end`       | taupe flash, violet squares, "Nova" on a dashed orbit |

How it is measured:

- **Cube silhouettes** are traced from the reference per frame (`POLY` in `cube.html`).
- **Camera path for the pile** (frames 66–122) comes from feature tracking on the reference: a per-frame
  similarity transform chained into world-to-screen keys (`CAM` in `market.html`). The reshuffle at 105–109 is
  keyed by hand, because tracking breaks down there.
- **Panel anchor and scale, cursor track, values and percentages** are read off the reference frame by frame.
  The values follow the reference's ramp, scaled to the 2180.40 USDC balance.

Every scene is drawn on a canvas as a pure function of the reference frame number. `K.mount` maps time to
`floor(t * 24 + 0.2)`, so the 30 fps output repeats every fifth frame exactly where the reference does.
`assets/kit.js` holds the shared helpers (with a tinted-glow `K.tglow` added), and `assets/tokens.js` holds the original token art.
There is no soundtrack.

```bash
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/nova-synced.mp4
```
