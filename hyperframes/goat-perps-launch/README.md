# GOAT Funded Perps launch, scenes 1–2 (HyperFrames)

An 11 s, 1920x1080 / 30 fps HyperFrames clip (330 frames): the first two scenes of the GOAT Funded Perps launch
video, built to the motion and look of the two supplied reference reels (`public/goat-perps/references/07-*.mp4`,
`08-*.mp4`) in the GOAT brand (black ground, Perps orange #EC8B1B as light, MD Nichrome + Altform).

| frames  | shot | beat |
|---------|------|------|
| 0–51    | 1A | trader silhouette at three live screens, amber wash; "Markets don't / sleep." builds by pixel dissolve; the camera dives into the centre screen |
| 52–91   | 1B | crimson field of matte cards; the camera trucks right to left while the cards switch LIVE → CLOSED in place; "Why should / your trading?" dissolves in; a near card wipes across the lens |
| 92–127  | 1C | focus pulled close (cards melt to bokeh); MARKET slams in, CLOSED? scrambles in |
| 128–149 | 1D | an orange streak slashes the headline, the halves fall away, light floods into the reveal |
| 150–189 | 2A | warm gold wash and louvre light; the extruded chrome GOAT shield rises; "• INTRODUCING" |
| 190–231 | 2B | lockup GOAT FUNDED / PERPS + subline; the camera whip-pans out |
| 232–283 | 2C | whip-pan in to 24/7, 365 counting up, the 3D 24h dial's arc sweeping; a near card wipes across |
| 284–329 | 2D | the camera tracks along Friday, Saturday, Sunday; the weekend lights up orange; "Weekends / included." |

- `assets/world.js`: the three.js (r149, vendored) scene. Every pose is a pure function of the frame. A two-pass
  thin-lens depth-of-field gather runs after the scene with a focus distance and blur per shot.
- `assets/scene.js`: the timeline and the DOM layer: pixel-dissolve copy (as in the reference's text builds, with
  the dashed selection box and a tint that settles out), section colour washes, the brand light shapes (comet,
  louvre), flashes, vignette and film grain.
- `assets/tex.js`: canvas textures (live trading screens, matte cards, the dial face).

No soundtrack or voiceover yet.

```bash
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/goat-perps-launch-30.mp4   # quick, no motion blur
./scripts/render-mb.sh                                                       # final, motion blurred
```
