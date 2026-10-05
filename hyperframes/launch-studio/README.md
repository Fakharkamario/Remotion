# Launch Studio (HyperFrames)

A 30 s, 1920x1080 / 30 fps HyperFrames launch film for **Launch Studio**, a motion studio that makes
launch videos for SaaS brands. It is in the genre of a dark kinetic-type product film: a glyph-scramble
wordmark, a wall of real launch frames, punchy word cuts and a logo lockup. The storyboard, copy, mark,
icons and soundtrack are all original to this project.

| time (s)    | composition | beat |
|-------------|-------------|------|
| 0.00–2.00   | `intro`     | mark spins up, "Launch Studio" letters scramble through code glyphs and lock left to right, camera rushes through the lockup |
| 2.00–4.60   | `wall`      | three tilted bands of launch-video frames fly in from depth and run past each other; "Launch videos for *SaaS.*" rises out of blur |
| 4.60–7.00   | `premiere`  | "Your product / deserves a *premiere.*" word by word, the last word lands in orange under a spotlight |
| 7.00–10.00  | `process`   | Brief → Script → Design → Animate → Ship rail; a glowing playhead stops on each node and lights it; the last node launches up |
| 10.00–12.60 | `frames`    | "EVERY FRAME" as a window onto a scrolling strip of frames, "*on purpose.*" beneath, smear out |
| 12.60–16.00 | `formats`   | one card re-frames 16:9 → 1:1 → 9:16 with a new cut each time; "One cut. Every *feed.*" |
| 16.00–19.40 | `results`   | "Launches that *land.*" with three stat cards that count up (sample numbers, swap for real ones) |
| 19.40–23.40 | `verbs`     | Script. (typed) · Design. (spring drop + swatches) · Animate. (travelling wave + keyframes) · Ship. (launches off on a trail) |
| 23.40–26.40 | `offer`     | "Launch-ready in **14** days." — the count rolls down from 60 |
| 26.40–30.00 | `outro`     | roll of services (Launch films, Product demos, UI animation …), then the lockup, tagline and "Book a launch call →" |

```
index.html             root: mounts the ten scenes + soundtrack
compositions/*.html    one sub-composition per beat (local timelines)
assets/fx.js           shared helpers: palette, mark, icons, char/word splitting, glyph scramble, per-frame sets
assets/frames/         launch-video frames shown in the wall, the type window and the format card
assets/audio.m4a       soundtrack, from scripts/make_audio.py (oscillators + noise, no samples)
```

Everything is deterministic (fixed tweens plus per-frame `set`s), so any frame can be seeked alone.

```
npm run dev      # preview
npm run check    # lint + runtime validation
npm run render   # renders/launch-studio.mp4
```

To customise: swap the images in `assets/frames/`, edit the copy in each composition, and change the
palette in `FX.C` (`assets/fx.js`).
