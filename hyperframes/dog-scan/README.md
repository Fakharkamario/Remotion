# Dog scan (HyperFrames)

A frame-by-frame HyperFrames recreation of the 3.43 s "scan → diagnosis → dashboard"
reference clip (1920x1080, 30 fps, 103 frames), with the plant swapped for the dog
photo and the dashboard rewritten for a pet.

```
0.00–1.50s  n0–44   scan card zooms out and drifts left; scan line climbs, the dog turns
                    into a green glowing mesh below it, then the line drops back down.
                    "Scanning" glitches in (particles → spinner, dark blocks,
                    "pet..." fragments, bold wave) and settles as "Scanning pet..."
1.50–2.40s  n45–71  "Diagnosis ready" rises and slows; a green highlight sweeps across it
2.40–3.43s  n72–102 pet dashboard: card, chips, badge, title, Upcoming and Ideal
                    Temperature panels rise in staggered and de-blur, then drift left
```

Every motion value in `index.html` was tracked from the reference frames (card centre and
scale, scan-line position, text positions, highlight edges, dashboard bounds) and is
replayed as dense per-frame keys. Frame `n` sits at `n / 30` s, with linear tweens between
frames so playback stays smooth at any render fps.

```
index.html          root composition (all three scenes + soundtrack)
assets/dog.png      the dog photo (transparent PNG)
assets/audio.m4a    soundtrack taken from the reference video
assets/vendor       GSAP, stored locally
assets/fonts        Inter (variable), stored locally
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout checks
npx hyperframes render -q high -o renders/dog-scan.mp4
```

If Chrome isn't installed, either run `npx hyperframes browser ensure` or point
`HYPERFRAMES_BROWSER_PATH` at an existing headless Chrome.

## Editing the pet details

The dashboard text lives in the `Scene 3` markup: chips (`Large / Active / Friendly`),
badge (`Checkup due`), title (`Golden Retriever`), the `Upcoming` items
(`Walk / Vaccine / Bath`) and the `Ideal Temperature` ranges. To move a range pill,
change its `left`/`width` inside `.track`. The track is 692px wide for 0–30°C, so 1°C ≈ 23px.
