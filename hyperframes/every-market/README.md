# one terminal, every market — markets circles (HyperFrames)

A 4.5 s, 1920x1080 / 30 fps clip that follows the supplied circles reference beat for beat (same 135 frames), in
the acend style (warm paper, ink, Inter). The headline uses the same word animation as `one-terminal`.

| frames  | beat |
|---------|------|
| 0–26    | two huge circles slide in, turning, and frame a gap; "One" grows, "terminal," joins |
| 27–54   | "every" punches in and settles, "market" joins; the circles keep a slow clockwise turn |
| 55–57   | the words drop out, left to right |
| 55–74   | the camera pulls back and keeps turning: four circles, their ink rims lightening to grey |
| 75–134  | cut: Stocks, Crypto, ETFs and Pre-IPO as overlapping glass circles, still turning and pulling back, settle into a 2 x 2 cluster inside a thin ring |

- The motion is tracked off the reference: circle fits on its rims give the camera (gap position, circle radius,
  turn) for every frame before the cut, and label positions and sizes give the cluster's centre, scale and
  decaying spin after it, including the lift out of frame at the end. Each runs on a monotone spline.
- Before the cut the circles are only rims with an inner glow; after it they are frosted discs with hairline
  edges and soft shadows; two thin rings (fitted on the reference) sit behind, the lit one crossing the glass.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
