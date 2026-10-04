# benchlane hire (HyperFrames)

An 8.1 s, 1920x1080 / 30 fps HyperFrames clip. Its content (copy, cards, the benchlane mark and wordmark,
the tagline) comes from the benchlane promo's calendar → best → logo-end → final beats. Its motion is
retimed against a reference cut of the same four beats.

| frames  | time (s)    | composition | beat |
|---------|-------------|-------------|------|
| 0–74    | 0.00–2.50   | `calendar`  | "so you interview less" lands word by word (accent → ink) behind a field of meeting cards seen by an orbiting camera: a fast whip that eases out, then a steady turn that picks up; the field pulls back into one blob between "and" and "hire", which land centred, then jump out to the sides; the cards turn vivid and smear sideways before the cut |
| 75–117  | 2.50–3.93   | `best`      | "with hard *evidence.*" pill: the first word lands in the accent, the pill re-centres as each word joins; an ink stroke chases round the orange outline, a gap opens along the bottom, the words fade left to right and the outline pulls in to a bracket |
| 118–164 | 3.93–5.50   | `logo`      | the mark pops in orange and darkens to ink while it grows; the wordmark slides out from behind it with an overshoot, settles, then drifts left |
| 165–242 | 5.50–8.10   | `final`     | "Hire on *proof,* not puzzles" in three beats (accent → ink), arriving a touch large and settling; black on the last frame |

How the motion is matched:

- **Per-frame data, not eases.** Word landings, colour switches and positions, the pill's width, re-centring and
  stroke (tail/head positions round its perimeter, measured per frame), and the mark's size, colour and position
  plus the wordmark's slide are all frame tables in the compositions. Frame numbers in the code are clip frames;
  held frames from the reference's 24 fps cadence are kept (`FX.held`).
- **Card field.** `scripts/gen_motion.py` writes `assets/motion.js`: one `[x, y, scale, blur, on]` entry per
  card per frame. The layout is original and seeded. The camera orbits a pivot at mid-depth so near cards sweep
  against far ones. Its yaw curve was set from feature tracks on the reference, and per-frame flow speeds were
  checked against it. The pull-back is sized per frame to the reference's measured card extents, with cards
  from just off frame drawn in so the cluster packs as densely.
- **Wordmark never clips.** The word is clipped on the left only, at the mark's right edge, so it comes out
  from behind the mark and shows in full once it is out (the promo's `logo-end` clipped it to a fixed width
  and cut the last letter).

```
index.html            root: mounts the four scenes + soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/motion.js      generated card-field tracks (python3 scripts/gen_motion.py)
assets/fx.js          shared helpers (per-frame set driver, word lines, the mark)
assets/audio.m4a      the benchlane promo soundtrack, 40.47–48.57 s, with a fade-out
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/benchlane-hire.mp4
python3 scripts/gen_motion.py          # rebuild assets/motion.js (needs numpy)
```

`check` flags low contrast on the meeting cards' pale labels. That is intended: they match the reference.
