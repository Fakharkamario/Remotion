# GOAT Funded Perps opener: "Markets don't sleep." (HyperFrames)

A 2.27 s, 1920x1080 / 30 fps clip (68 frames), rebuilt beat for beat from the supplied reference clip
("Every Trade tells a story"), with the GOAT copy, Altform and Perps orange:

| frames | beat |
|--------|------|
| 0–8    | the camera cranes up from low and decelerates hard (speed-driven vertical motion blur), then keeps a slow push-in |
| 9–28   | "Markets", "don't", "sleep." each focus in from a soft blur where they stand; "sleep." in Perps orange with a glow |
| 57–67  | the screen light dies first, then the room falls to black; the copy dims last |

- `assets/trader.png`: the supplied back-view photo, keyed off its white background with a feathered edge. It is
  graded into the scene and relit with `shade.png` (shadow side), `rim-warm.png` (the amber key catching the
  upper-left edges) and `rim-screen.png` (a faint wrap of screen light).
- Depth: the screen sits behind the subject's focus plane (soft, with bloom and glass), and the camera moves the
  subject more than the screen (parallax) through the crane and the slow push-in.
- `assets/opener.js`: the live chart (candles keep printing: top and sell-off left of the head, base by his neck,
  the climb printing on the right with the price tag riding it), the camera, the copy timing and the fade.

```bash
./scripts/render-mb.sh   # final, motion blurred (240 fps samples, 180-degree shutter) -> renders/goat-perps-opener.mp4
```
