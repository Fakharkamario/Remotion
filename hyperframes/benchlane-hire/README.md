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

How the motion is matched, and made smooth:

- **Measured beats, smooth curves.** Word landings, colour switches and positions, the pill's width, re-centring
  and stroke (tail/head positions round its perimeter), the mark's size, colour and position, and the wordmark's
  slide were all measured frame by frame off the reference. They play back through monotone cubic curves
  (`FX.curve`), so every frame moves and nothing overshoots its keys. The reference's 24 fps holds are dropped.
- **Eased type.** Words fade up over two frames while settling a few px (`FX.land`), and colours blend over
  three frames instead of switching (`FX.colors`).
- **Card field.** `scripts/gen_motion.py` writes `assets/motion.js`: one `[x, y, scale, blur x, blur y, on]`
  entry per card per frame. The layout is original and seeded. The camera orbits a pivot at mid-depth so near
  cards sweep against far ones. Its yaw curve was set from feature tracks on the reference, smoothed, and
  checked against the reference's per-frame flow speeds. The pull-back is sized per frame to the reference's
  measured card extents, with cards from just off frame drawn in so the cluster packs as densely.
- **Frosted cards with motion blur.** Each card is frosted glass (`backdrop-filter`), so words and cards behind it
  blur through, with a soft shadow. Each card also has its own SVG blur filter that smears it along its direction
  of travel, sized from its speed; the strength follows the beat (`BLUR`): full in the opening whip, light in the
  steady sweep, crisp while the cards gather, smeared again before the cut. The filter sits on the glass and the
  contents, never on the card itself, because a filter there would cut the glass off from what is behind it.
- **Wordmark never clips.** The word is clipped on the left only, at the mark's right edge, so it comes out
  from behind the mark and shows in full once it is out (the promo's `logo-end` clipped it to a fixed width
  and cut the last letter).

```
index.html            root: mounts the four scenes + soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/motion.js      generated card-field tracks (python3 scripts/gen_motion.py)
assets/fx.js          shared helpers (per-frame sets, smooth curves, colour blends, word landings, the mark)
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
