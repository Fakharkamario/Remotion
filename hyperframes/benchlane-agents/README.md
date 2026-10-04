# benchlane agents (HyperFrames)

An 8.53 s, 1920x1080 / 30 fps HyperFrames clip. Its content comes from the benchlane promo's
cards → errors → assign beats (copy, icons, project brief, "Bring any AI coding agent"). Its motion
is retimed frame by frame against a reference cut of the same three beats.

| frames  | time (s)    | composition | beat |
|---------|-------------|-------------|------|
| 0–45    | 0.00–1.53   | `cards`     | achievement cards over the photo backdrop: orange wash + gradient scanner sweep, one-card scroll steps, staircase shear, whip into the cut |
| 46–126  | 1.53–4.23   | `errors`    | "and the *autopilots*" one word per frame → forge-cli terminal slides in, stepped log scroll, red error chips pop on/off |
| 127–255 | 4.23–8.53   | `assign`    | "Assign [tile] a project" click → tile swells, plane drops in, tile shrinks into the window → pixel ring → brief page → whip into header → pill opens empty, label appears → click → agent avatars |

How the motion is matched:

- **Per-frame data, not eases.** Card slot tops/lefts, the line drift, terminal x, the log
  scroll steps, every chip's on/off frame and lift, the tile's scale and centre, the brief
  window's path and the close-up camera were measured off the reference video and are
  written as one `set` per 30 fps frame (frame numbers in the code are reference frames
  counted from each scene's cut).
- **Backdrop:** `assets/backdrop.jpg` (the supplied photo), slow push-in, an orange wash that
  lifts to a peach tint, and a diagonal gradient scanner that sweeps across it.

```
index.html            root: mounts the three scenes + soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/fx.js          shared helpers (pixel ring, mosaic, cursor, icons)
assets/audio.m4a      the benchlane promo soundtrack, 12.67–21.2 s, with a fade-out
assets/backdrop.jpg   photo used behind the cards
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/benchlane-agents.mp4
```

`check` warns about low contrast on the faint card categories, terminal sub-lines and mock UI
text. That is intended: they match the reference.
