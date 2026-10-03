# Pet carousel (HyperFrames)

A HyperFrames recreation of the 1.7 s "Another dead plant?" teaser, with the line
"Is your pet feeling off?" and the four pet photos as the card carousel.

Motion, matched to the reference frame by frame:

- 0.00–1.2 s  camera zoom-out (horizontal zoom streak on the first frames) on "Is your"
- 0.07–1.7 s  a train of 7 rounded photo cards loops counter-clockwise: up the right,
  over the top, down around the left, along the bottom, bunching up as it slows
- 0.50–1.4 s  "Is your" slides left; "pet" (0.83 s) and "feeling off?" (0.97 s) rise in
  blurred and light green, then darken to ink
- 1.42–1.74 s a slot opens between "Is your" and "pet"; the lead card (dog photo) swoops
  up into it, the rest stack in behind it
- 1.7–2.2 s   hold on the final line (the reference cuts at 1.7 s mid-landing)

```
index.html          the whole composition (1920x1080, 2.2s)
assets/photos       pet-1..4.jpg — the carousel photos (pet-1 is the card that lands)
assets/audio.m4a    soundtrack taken from the reference video
assets/vendor, assets/fonts   GSAP and Inter, stored locally
```

Tweak points in `index.html`: `P` (card path), `leadS` / `spacing` (train timing),
`photos` / `sizes` (card order and size), `camScale` (zoom curve).

## Commands

```bash
npx hyperframes preview --background
npx hyperframes check
npx hyperframes render -q high --fps 30 -o renders/pet-carousel.mp4
```
