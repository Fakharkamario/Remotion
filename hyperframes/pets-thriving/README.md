# Pets thriving (HyperFrames)

A frame-by-frame HyperFrames recreation of the 2.6 s "Keep your plants alive → Planta"
reference clip (1920x1080, 30 fps, 78 frames). The interiors are swapped for the four
pet photos, the line now reads "Keep your pets **thriving**", and the end card says
**Animala**.

```
0.00–1.60s  n0–48   the first photo drifts left; three more photos and then the white
                    headline panel are revealed by hard vertical edges sweeping right → left
                    (staggered and overlapping, edge x tracked per frame from the reference)
0.97–2.03s  n29–60  "Keep your pets" glides in with the panel and settles; "thriving" rises
                    out of a mask, motion-blurred and bright green, then the dark fill pours
                    in from the top; the whole line lifts just before the cut
2.03–2.60s  n61–77  hard cut to dark green; "Animala" rises and de-blurs
```

Wipe order: `dog-lying` (base) → `cat-looking` → `dog-sitting` → `cat-sitting` → headline.

```
index.html     root composition (all scenes + soundtrack)
assets/*.jpg   the four pet photos
assets/audio.m4a  soundtrack taken from the reference video
assets/vendor  GSAP, stored locally
assets/fonts   Inter (variable), stored locally
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout checks
npx hyperframes render -q high -o renders/pets-thriving.mp4
```

If Chrome isn't installed, either run `npx hyperframes browser ensure` or point
`HYPERFRAMES_BROWSER_PATH` at an existing headless Chrome.
