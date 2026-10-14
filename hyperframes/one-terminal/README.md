# one terminal, every market (HyperFrames)

A 7 s, 1920x1080 / 30 fps HyperFrames clip in the same type and motion language as `sentence-trade`:
"One terminal, every market", then a walk through the Explore screen's categories (Crypto → Stocks → ETFs →
Pre-IPO), rebuilt from the four supplied screenshots.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–26    | 0.00–0.90   | "One" grows, "terminal," joins, the line squeezes shut |
| 27–46   | 0.90–1.56   | "every" punches in big and settles, "market" joins |
| 47–60   | 1.56–2.00   | a dark pill grows behind "market", the label fades, the pill rounds into a circle |
| 56–84   | 1.87–2.80   | the camera pulls back: the circle is the selected Crypto button; the Explore screen fades up |
| 84–126  | 2.80–4.20   | the cursor comet swoops in and taps Stocks, then ETFs; content swaps with a stagger |
| 126–162 | 4.20–5.40   | it drags the category row left; the row keeps gliding after release |
| 162–209 | 5.40–7.00   | it taps Pre-IPO and drifts off; the camera keeps a slow push-in |

- The transition follows the second reference: a button's label fades, the pill rounds off, and the camera
  pulls back to reveal the screen it belongs to. The pill morphs onto the Crypto circle's *projected*
  position while the pull-back is already starting, so the hand-off frame is exact.
- The cursor follows the first reference: a blue brush-stroke comet (its last ~3 frames of path) that
  collapses to a dot at rest; taps bloom a mint halo that grows and fades, and the drag holds one.
- `assets/ui.js` builds the screen at iPhone point size (430 x 932 pt); card logos are cropped from the
  screenshots into `assets/icons`. "Gainers" is shared by every category, so it stays put during swaps.
- `assets/scene.js` drives everything from one continuous frame number on monotone splines.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
