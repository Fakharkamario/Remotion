# one terminal, every market — markets circles (HyperFrames)

A 4.5 s, 1920x1080 / 30 fps clip that follows the supplied circles reference beat for beat (same 135 frames), in
the acend style (warm paper, ink, Inter). The headline uses the same word animation as `one-terminal`.

| frames  | beat |
|---------|------|
| 0–26    | two huge circles slide in, turning, and frame a gap; "One" grows, "terminal," joins |
| 27–54   | "every" punches in and settles, "market" joins; the circles keep a slow clockwise turn |
| 55–57   | the words drop out, left to right |
| 46–82   | the camera pulls back and turns faster; the four circles close up and, in one continuous move, their rims become overlapping glass discs (Stocks, Crypto, ETFs, Pre-IPO) as the labels resolve and two thin rings fade in |
| 82–134  | the spin decays, the 2 x 2 cluster settles, then lifts out of frame |

- The motion is tracked off the reference: circle fits on its rims give the camera (gap position, circle radius,
  turn) for every frame before the cut, and label positions and sizes give the cluster's centre, scale and
  decaying spin after it, including the lift out of frame at the end. Where the reference cuts from rims to
  glass, ours keeps one move: radius, spin, spacing and centre each run on a single monotone spline across it.
- Before the cut the circles are only rims with an inner glow; after it they are frosted discs with hairline
  edges and soft shadows; two thin rings (fitted on the reference) sit behind, the lit one crossing the glass.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 360-degree shutter
```
