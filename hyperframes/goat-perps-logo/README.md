# GOAT Funded Perps logo reveal (HyperFrames)

A 1.1 s, 1920x1080 / 30 fps clip (33 frames), rebuilt from the supplied reference logo reveal, frame for frame:
the extruded GOAT shield enters small and almost edge-on from the lower left, swings to centre and flares
white-hot (peak around frame 6), cools to brushed chrome by frame 10, then keeps turning slowly while a highlight
sweeps the face. The pose is fitted to the reference's measured centre and size on every frame.

- True motion blur inside the 3D renderer: every frame averages 24 sub-frame renders over a 0.4-frame shutter,
  so the fast swing smears smoothly instead of stepping.
- The mark stays monochrome per the brand rules (the reference's logo is gold): the flare is white light, the
  finish is chrome, and Perps orange only lights the room.

```bash
npx --yes hyperframes@0.8.114 render -f 30 -q high -o renders/goat-perps-logo.mp4
```
