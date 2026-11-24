# GOAT Funded Perps opener: "Markets don't sleep." (HyperFrames)

A 2.27 s, 1920x1080 / 30 fps clip (68 frames), rebuilt beat for beat from the supplied reference clip
("Every Trade tells a story"), with the GOAT copy, Altform and Perps orange:

| frames | beat |
|--------|------|
| 0–40   | the camera settles upward in one long exponential ease (measured on the reference: half-life ~6 frames), then holds still; the copy rides with it |
| 9–35   | "Markets", "don't", "sleep." each resolve from soft and dim where they stand; "sleep." in a gold gradient with a soft glow |
| 57–67  | the screen light dies first, then the room falls to black; the copy dims last |

- `assets/trader.png`: the supplied clean cutout of the back-view photo. It is
  graded into the scene and relit with `shade.png` (shadow side), `rim-warm.png` (the amber key catching the
  upper-left edges) and `rim-screen.png` (a faint wrap of screen light).
- Depth: the screen sits behind the subject's focus plane (soft, with bloom and glass), and the camera moves the
  subject more than the screen (parallax) through the crane and the slow push-in.
- `assets/opener.js`: the live chart (candles keep printing: top and sell-off left of the head, base by his neck,
  the climb printing on the right with the price tag riding it), the camera, the copy timing and the fade.

```bash
./scripts/render-mb.sh   # final, motion blurred (240 fps samples, 180-degree shutter) -> renders/goat-perps-opener.mp4
```

Colours are measured from the reference: wall ~#241709 at its brightest, warm white copy #FFFAF4, gold #EAC25C to #FFEBA8.
