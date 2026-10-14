# your intelligent trading terminal (HyperFrames)

A 7.67 s, 1920x1080 / 30 fps HyperFrames clip: the supplied reference's motion beat for beat (same 230 frames
and the same cuts), restyled in the acend look of the earlier clips (warm paper, ink, the green "Slide to buy",
Inter, the acend wordmark).

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–52    | 0.00–1.77   | 3D "Slide to buy": the knob launches up the track and cruises, the camera follows it, catches up and settles onto its top face |
| 53–102  | 1.77–3.43   | cut: the order pop-up fills 17% → 100% as it slowly grows, turns to "Bought", then whips past camera |
| 103–162 | 3.43–5.43   | cut: "your intelligent trading terminal" builds word by word: each word pops in with extra space, the gap closes as the line re-centres |
| 163–229 | 5.43–7.67   | cut: the acend wordmark, held |

- Beat 1 is a three.js scene (`assets/slider3d.js`, three r149 vendored in `assets/vendor`): an extruded pill
  track with the label printed along it, a bevelled green knob with two white chevrons, a contact shadow, soft
  hemisphere + key light and a horizon haze. The knob's path and the camera pose at each keyframe were *solved*
  from the reference: a grid search over a pinhole model fitted to the knob's measured height and width and the
  track end's height on screen (and, for the dive, the knob's far edge and chevrons). The knob is translucent so
  the label shows through as it slides over it, and it overhangs the track, as in the reference.
- Look: the knob is a slim translucent glass slab (clear-coat, a soft studio environment for reflections, the
  label glowing through it); the sky drifts toward a faint green haze as the camera travels, and a shallow depth
  of field blurs the foreground while the knob and chevrons stay in focus. The 3D scene builds lazily on the
  first render so page load stays fast on software GL.
- The pop-up is the Buy · Market order for Coca-Cola: KO @ $93.76, $375.00 for 4.00 KO, the fill ring counts to
  100% and flips to a green check with "Bought". Its scale and drift curves follow the reference's card.
- `assets/acend-logo.png` is the supplied wordmark with its background keyed out.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
