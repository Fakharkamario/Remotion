# benchlane developers (HyperFrames)

A 12.67 s, 1920x1080 / 30 fps HyperFrames teaser. Its content comes from the benchlane
"developers" cut (copy, original icon glyphs, benchlane mark, synthesized soundtrack). Every motion
beat is retimed frame by frame against the "Engineers" reference cut.

| frames  | time (s)     | composition | beat |
|---------|--------------|-------------|------|
| 0–53    | 0.00–1.80    | `intro`     | "Teams now build *differently*", stepped camera pull-back, pink pixel noise |
| 54–134  | 1.80–4.50    | `icons`     | orange tiles land streaky, step into icon tiles, field sweeps clockwise around "alongside AI" |
| 135–319 | 4.50–10.67   | `words`     | glyph scramble → "Yet interviews still live in 2015." → words drop out → "Old-school coding quizzes" + code confetti → "< can't reveal how >" → dot grid "developers *truly* build now" → pixel ring burst → "Meet" corners |
| 320–379 | 10.67–12.67  | `logo-dark` | corners snap into the mark, wordmark types in → "Find the real *builders*" |

What was retuned against the reference:

- **Icon field:** every tile follows a Catmull-Rom path through positions sampled from the reference
  (`P` in `icons.html`). The path is written as one `set` per frame, so the sweep is fast as the
  tiles land, slow mid-way, and accelerating out. Per-tile resolve times are in `FLIP`.
- **Cuts and word hits** are aligned to the reference frame numbers: "differently", the
  "< can't reveal how >" line, the wordmark cut, and the closing line.
- **Closing line:** words land in place with no lift, so they never overlap mid-entry.
- **First frames:** each timeline is primed with `tl.seek(0.001).seek(0)`. A fresh GSAP timeline
  seeked to 0 skips its zero-time `set`s, which made each scene's first frame flash its unset state.

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
