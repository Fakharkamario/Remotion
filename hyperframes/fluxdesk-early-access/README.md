# fluxdesk early access (HyperFrames)

A 4.9 s, 1920x1080, 30 fps HyperFrames clip. It rebuilds the reference promo's opening (intro → headline →
dashboard) frame by frame. The timing, camera moves, flashes and glyph effects follow the reference, but all
copy and UI belong to the Fluxdesk launch: "Early Access is open.", Good to see you, Launchpad, Futures,
Vaults, and "Invite friends and split the fees".

Like the reference, the animation runs on a 24 fps grid shown at 30 fps: output frame `n` shows animation
frame `floor(n * 0.8)`, so every fifth frame repeats.

| anim frames | composition | beat |
|-------------|-------------|------|
| 0–22   | `intro`    | glyph tile pulls back through the grid ( / > + ) with glyph rings, spins, white flash on a red "+" tile, staircase of tiles shuffles and recedes into a fine grid |
| 23–53  | `headline` | "Early Access is open." word by word while the camera pulls back, glyph pops, dotted orbits, white flash with an orange highlight sweeping the words, push in, words break into glyphs |
| 54–116 | `dash`     | glyph burst → wired constellation → pixel cursor and cloud build the dashboard, Launchpad fills row by row, perspective tilt with a running bright row, white flash, scrolling glyph rows, pan away |

Values in the scenes are measured from the reference per frame: glyph and tile positions and sizes, grid
cells, background colours, text placement, and (in `dash`) the Launchpad card's corners, which drive a
homography camera. Everything is drawn on a canvas as a pure function of the animation frame (`K.mount`
drives it from a GSAP setter tween, so any frame seeks and renders by itself). The shared helpers are in
`assets/kit.js`. There's no soundtrack.

```bash
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/fluxdesk-early-access.mp4
```
