# remy — promo (HyperFrames)

A 30.9 s, 1920x1080 / 30 fps HyperFrames promo for **Remy**, an AI friend you text. It is a rebranded
recreation of the supplied reference edit (854x480, 928 frames). The motion is keyed frame by frame to the
reference, and the brand and copy are new:

| reference | here |
|---|---|
| Lucas, sunburst mark, meetlucas.ai | Remy, sparkle mark, textremy.ai |
| "Meet Insights" chip (lime spiral) | "Sync Notes" chip (violet waveform) |
| SoHo wine tasting, $40 | Tribeca wine tasting, $35 |
| Margherita Pizza Artigianale | Forno Lumen Pizzeria |
| Johannes 2013, Vivino 9.4 | Alta Viña Reserva 2016, 4.3 stars |
| docusign, Whoop, tiktoks | e-signatures, "your ring", reels |

| frames  | shot |
|---------|------|
| 0–200   | chip outline draws and opens into the event card → recap streams in → pull back to the phone over foliage, replies typed |
| 200–297 | whip to the chat header: venue suggestion streams in, "u down?!?", "HAHA - ye book it." with reactions |
| 297–349 | close-up on the reply, LFG pops |
| 349–399 | map-link bubble lands tilted and settles while the search types |
| 399–459 | map zooms in on the pin |
| 459–501 | booking page fades up and drifts |
| 501–744 | "dis good wine?" + photo, pull back to the phone, wine notes; cut close, pick-up line, whip-pan; zoom out to white |
| 739–846 | clouds: morning chat |
| 846–909 | "Text Remy today", URL pill types |
| 909–928 | logo |

How the motion is matched:

- **Anchored cameras.** Every shot pins one anchor (the event card, the phone, a bubble, the map pin…) to a
  screen position and scale measured off the reference. Values are written in reference pixels (x2.25) on
  reference frame numbers, and replayed through a monotone cubic.
- **Chat engine.** Bubbles appear at their final size (a quick blur/scale-in), then the text types inside
  them with a per-character fade. Untyped text stays in the layout, invisible, so lines never reflow. Lists
  are bottom-anchored like a real chat, so new messages push the thread up.
- **Whips and cuts** use directional SVG blur at the same frames as the reference.
- Everything is drawn in code: the phone, foliage backdrop with live grain, the map, the clouds (fractal
  noise with slope lighting), the wine photo and the booking page. No third-party logos.

`assets/audio.m4a` is the reference's soundtrack.

## Commands

```bash
npx --yes hyperframes@0.8.114 preview
npx --yes hyperframes@0.8.114 render -q high -o renders/remy-promo.mp4
```
