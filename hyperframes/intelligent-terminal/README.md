# your intelligent trading terminal (HyperFrames)

A 7.67 s, 1920x1080 / 30 fps HyperFrames clip: the supplied reference's motion beat for beat (same 230 frames
and the same cuts), restyled in the acend look of the earlier clips (warm paper, ink, the green "Slide to buy",
Inter, the acend wordmark).

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–52    | 0.00–1.77   | 3D "Slide to buy": the green knob flicks away up the track, the camera flies low along it and skims over the knob |
| 53–102  | 1.77–3.43   | cut: the order pop-up fills 17% → 100% as it slowly grows, turns to "Bought", then whips past camera |
| 103–162 | 3.43–5.43   | cut: "your intelligent trading terminal" builds word by word, the line re-centring as each word lands |
| 163–229 | 5.43–7.67   | cut: the acend wordmark, held |

- Beat 1 is a three.js scene (`assets/slider3d.js`, three r149 vendored in `assets/vendor`): an extruded pill
  track with the label printed along it, a bevelled green knob with two white chevrons, a contact shadow, soft
  hemisphere + key light and a horizon haze. Camera and knob follow splines matched to the reference's framing.
- The pop-up is the Buy · Market order for Coca-Cola: KO @ $93.76, $375.00 for 4.00 KO, the fill ring counts to
  100% and flips to a green check with "Bought". Its scale and drift curves follow the reference's card.
- `assets/acend-logo.png` is the supplied wordmark with its background keyed out.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
