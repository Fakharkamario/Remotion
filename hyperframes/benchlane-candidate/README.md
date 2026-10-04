# benchlane candidate (HyperFrames)

A 9.23 s, 1920x1080 / 30 fps HyperFrames clip. Its content (copy, mascot, `forge-cli` prompt, IDE code
and agent log, Submit button) comes from the benchlane promo's start → term → ide → submit beats.
Its motion is retimed frame by frame against a reference cut of the same four beats.

| frames  | time (s)    | composition | beat |
|---------|-------------|-------------|------|
| 0–152   | 0.00–5.10   | `prompt`    | candidate cursor glides onto "Start project", press squish + purple flash, purple wash in the footer, cursor tips up → modal whips left over the terminal → mascot blinks, cut to a 2.22x close-up, cursor clicks the prompt bar (bar squishes), command types in with the camera following the caret |
| 153–229 | 5.10–7.67   | `ide`       | editor writes `usePantryScan.ts` line by line under two selection bands; agent log types a Bash card, a spinner that settles to "Thought", and an Update card while it scrolls; mascot blinks; frame dips before the cut |
| 230–276 | 7.67–9.23   | `submit`    | Submit drops in squashed on its orange edge, cursor arrives, press squish + purple flash, dark pixel ring blooms off-frame, paper plane tips over then flies out of the top-right corner while the button re-fits around "Submit" |

How the motion is matched:

- **Per-frame data, not eases.** `assets/motion.js` holds one entry per 30 fps reference frame:
  the cursor tip, rotation and scale (from fitting the cursor polygon to every frame), the Candidate
  tag's centre and scale, the start-modal camera (from the button box), the terminal slide and
  close-up camera (from the prompt bar and version label), the typed-character count, the editor
  and log scroll, and the pixel-ring cell grids. Hand-measured tables (button flash, Submit button
  box, plane path) sit in the compositions. Frame numbers in the code are global reference frames.
- **Clicks:** both presses use the reference's flash ramp (cream → lavender → `#AA7EFA` → `#865AF8` → back)
  and its squish (0.89x on Start project, 0.92x on Submit), with the cursor shrinking under the press.
  The cursor tip lands on the button, as in the reference.
- **Paper plane:** after the Submit click it wobbles, then leaves through the top-right corner,
  accelerating, while the icon slot collapses. It is white with `mix-blend-mode: difference`, so it
  reads dark over the button and light over the background as it crosses the edge.
- **Mascot:** the promo's boxy robot ("Volt", as it appears in the promo's render) with blinkable eyes.

```
index.html            root: mounts the three scenes + soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/motion.js      measured per-frame motion tables
assets/fx.js          shared helpers (per-frame set driver, cursor/tag tracks, mascot, blink, icons)
assets/audio.m4a      the benchlane promo soundtrack, 21.27–30.5 s, with a fade-out
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/benchlane-candidate.mp4
```

`check` warns about low contrast on the dim editor line numbers, the faded log lines, the version
labels and the grey modal copy. That is intended: they match the reference.
