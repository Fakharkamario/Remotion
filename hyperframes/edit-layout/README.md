# edit layout (HyperFrames)

A 16.2 s, 1920x1080 / 30 fps clip that picks up on the last frame of `just-ask` and runs in the same kinetic
language on the acend desktop app (the settings menu, the layout editor and the Ask AI side panel, rebuilt from the
supplied screenshots).

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–30    | 0.00–1.00   | "just ask"'s last frame (Coca-Cola, floating in 3D): the window levels out and the camera dives into the spinning settings gear |
| 30–58   | 1.00–1.93   | cut on the gear to the headline: "Edit" grows, "layout" joins |
| 58–96   | 1.93–3.20   | the headline *is* the menu's "Edit layout" item: the Solana page opens out around it as the camera pulls back |
| 96–130  | 3.20–4.33   | click Edit layout: the menu folds away; grips, eyes, the hint and the drop zone arrive, the window floating in 3D |
| 130–176 | 4.33–5.87   | grab the chart and drag it below the activity panel, which slides up into its place |
| 176–222 | 5.87–7.40   | the settings menu again: Done editing; the editor's furniture leaves, the new layout stays |
| 222–306 | 7.40–10.20  | the camera dives into the Ask AI pill: its label becomes the headline "Ask AI", then rides back into the pill |
| 306–486 | 10.20–16.20 | click Ask AI: the side panel slides in; click Analyze: the message flies up, typing dots, a streamed reply and a Solana card; the camera eases out to the floating window |

- Frame 0 rebuilds `just-ask`'s last frame (Coca-Cola, $975.00, "Bought 4.00 KO", the camera at its final pose),
  so the two clips cut together.
- The two text moments are match moves on a UI label: the headline is drawn exactly where (and as large as) the
  label lands under the camera, rides it down as the camera pulls back, and hands over to the real label once small.
- Camera moves between are Gaussian-smoothed keyframes (velocity and acceleration continuous); the cursor is a soft
  mint dot whose clicks bloom; the reply card arrives with a pastel wash.
- Mock reply text and the Solana card's numbers follow the supplied screenshots.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
