# benchlane developers (HyperFrames)

A 12.67 s, 1920x1080 / 30 fps (24 fps motion cadence) HyperFrames teaser. Its content comes from the benchlane
"developers" cut (copy, original icon glyphs, benchlane mark, synthesized soundtrack). Every motion
beat is retimed frame by frame against the "Engineers" reference cut.

| frames  | time (s)     | composition | beat |
|---------|--------------|-------------|------|
| 0–53    | 0.00–1.79    | `intro`     | "Teams now build *differently*", stepped camera pull-back, pink pixel noise |
| 54–134  | 1.79–4.50    | `icons`     | orange tiles land streaky, step into icon tiles, field sweeps clockwise around "alongside AI" |
| 135–319 | 4.50–10.67   | `words`     | glyph scramble → "Yet interviews still live in 2015." → words drop out → "Old-school coding quizzes" + code confetti → "< can't reveal how >" → dot grid "developers *truly* build now" → pixel ring burst → "Meet" corners |
| 320–379 | 10.67–12.67  | `logo-dark` | corners snap into the mark, wordmark types in → "Find the real *builders*" |

How the motion is matched:

- **Measured, not eased.** Every move (camera zoom/pan/rise in the intro, each word's drop-in and
  long settle, line re-centring, bracket pushes, exits, ring growth, the "Meet" corners, the
  wordmark build and squeeze, the closing pan) was measured off the reference frame by frame and is
  replayed with `FX.curve`: a monotone cubic through the measured keys, written out as one `set` per
  frame. Keys are written as reference frame numbers.
- **24 fps cadence.** The reference is 24 fps footage in a 30 fps file (every fifth frame repeats).
  `FX.f(n)` maps reference frame `n` to its source frame (`floor(n * 0.8) / 24`) and curves are
  sampled on that 24 fps grid, so the 30 fps render repeats the same frames the reference does.
- **Icon field:** tile paths are Catmull-Rom splines through sampled positions (`P` in `icons.html`).
- **Reveals:** words fade up in the accent colour over two source frames, then settle to ink.
- **First frames:** each timeline is primed with `tl.seek(0.001).seek(0)`, because a fresh GSAP
  timeline seeked to 0 skips its zero-time `set`s.

```
index.html            root: mounts the four scenes + soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/fx.js          shared helpers: seeded RNG, word-slot line builder, pixel rings, mark, icons
assets/audio.m4a      first 12.67 s of the benchlane synthesized soundtrack, with a short fade-out
assets/fonts, vendor  Inter, Newsreader Italic, JetBrains Mono and GSAP, stored locally
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/benchlane-developers.mp4
```

If Chrome isn't installed, either run `npx hyperframes browser ensure` or point
`HYPERFRAMES_BROWSER_PATH` at an existing headless Chrome.

`check` warns about overlapping text in the code confetti (7.2–8.2 s) and about tiles painted
off-canvas in the icon sweep. Both are intended.
