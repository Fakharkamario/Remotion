# GOAT Funded Perps logo reveal (HyperFrames)

A 1.1 s, 1920x1080 / 30 fps clip (33 frames), copied frame by frame from the supplied reference logo reveal.

The shield's position and rotation are solved per frame from the reference (`tools/`): the reference logo's
silhouette is extracted on every frame (plate-subtracted, holes filled), and our extruded shield's silhouette is
fitted to it by a Nelder-Mead search over position and rotation (overlap + bounding box), each frame starting from
its neighbour's solution. The mark may not be stretched, so on the settled frames its tilt is held to the
reference's visible facing and the fit matches width, centre and turn. The solved poses are smoothed over time and
written into `assets/logo.js` as per-frame keys. Brightness (entry warmth, the white-hot flare, the settled level)
follows the reference's measured logo brightness per frame.

- True motion blur inside the 3D renderer: every frame averages 24 sub-frame renders over a 0.4-frame shutter,
  so the fast swing smears smoothly instead of stepping.
- The mark stays monochrome per the brand rules (the reference's logo is gold): the flare is white light, the
  finish is chrome, and Perps orange only lights the room.

```bash
npx --yes hyperframes@0.8.114 render -f 30 -q high -o renders/goat-perps-logo.mp4
```
