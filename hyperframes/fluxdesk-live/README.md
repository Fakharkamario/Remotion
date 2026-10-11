# fluxdesk live (HyperFrames)

A 5.83 s, 1920x1080 / 30 fps HyperFrames clip (175 frames). It rebuilds the reference "Base is now live on
Terminal." spot beat for beat, measured frame by frame, with the Fluxdesk copy and brand swapped in:
"Nova", "Nova now trades on Fluxdesk.", the three-block stair mark, "Fluxdesk" and "fluxdesk.trade".

| frames  | composition | beat |
|---------|-------------|------|
| 0–16    | `open`  | pale blue field of glyph tiles wheels counter-clockwise around "Nova" (tile paths tracked from the reference), cools to taupe as "now" falls in |
| 17–47   | `line`  | headline builds word by word as warm tiles fly out left; gold glint on "Nova", orange sweep on "Fluxdesk."; grainy orange wipe, giant white then black brand word, small brand word on orange |
| 48–101  | `forge` | dark slash on orange; square shrinks while a diamond grows through the slash; wireframe cycles > + . <, tips into a cube and dives; two solid cubes on orange; pull back as the blocks land into the mark |
| 102–174 | `logo`  | white flash, the wordmark types in with focus pulling in; hold; dashed arcs and glyphs ( / > + . ) eat the word; "fluxdesk.trade" types out behind a glyph cursor |

The reference is 24 fps motion delivered at 30 fps (every fifth frame repeats the one before); `K.cadence`
reproduces that, so the clip lines up with the reference frame for frame. The 3D cube cameras (wire dive
and solid cubes, frames 73–91) are fitted to corner positions measured on the reference, including the right
cube sliding forward from side-by-side to corner-to-corner. `K.frame` supports per-scene motion blur
(`draw.shutter`), used only on the opening hand-off. The wipe uses a per-pixel dithered gradient for the
reference's film-grain dissolve. Every scene is drawn on a canvas
as a pure function of the frame number (`assets/scene-*.js`), mounted by the compositions through
`K.mount`. Text is Inter condensed to the reference's set width (`K.SX`). No soundtrack is included.

```bash
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/fluxdesk-live.mp4
```
