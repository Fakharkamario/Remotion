# GOAT Funded Perps opener: "Markets don't sleep." (HyperFrames)

A 2.27 s, 1920x1080 / 30 fps clip (68 frames), rebuilt beat for beat from the supplied reference clip
("Every Trade tells a story"), with the GOAT copy, Altform and Perps orange:

| frames | beat |
|--------|------|
| 0–8    | the camera cranes up from low and decelerates hard (speed-driven vertical motion blur), then keeps a slow push-in |
| 9–28   | "Markets", "don't", "sleep." each focus in from a soft blur where they stand; "sleep." in Perps orange with a glow |
| 57–67  | the screen light dies first, then the room falls to black; the copy dims last |

- `assets/trader.png`: the supplied back-view photo, keyed off its white background; it is graded into the scene
  (crushed, warm, slightly soft, darker toward the bottom) in `index.html`.
- `assets/opener.js`: the live chart (a V: sell-off, base, climb), the camera, the copy timing and the fade.

```bash
./scripts/render-mb.sh   # final, motion blurred (240 fps samples, 180-degree shutter) -> renders/goat-perps-opener.mp4
```
