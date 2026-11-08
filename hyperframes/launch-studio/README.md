# Launch Studio (HyperFrames)

A 6.3 s, 1920x1080 / 30 fps HyperFrames spot (190 frames). Its motion is taken frame by frame from the
reference clip: the camera's scale and position were tracked with SIFT feature matching on the type, the
typing cadence was read from how far each line had been typed in each frame, the cursor's centre, size and
angle were measured from its blue silhouette, and the blue wave is a tint field sampled from the reference
(text removed) and multiplied over the paper. The tables live in `assets/motion.js`.

| frames  | copy | motion source (reference frames) |
|---------|------|-----------------------------------|
| 0–42    | **Scene 1** "You built / the product" | 0–42: zoom-out from 1.24x while typing, wave rises, swallows the line, sweeps off the top |
| 43      | blank paper | 43 |
| 44–75   | **Scene 2** "But nobody / understands it." | 88–119: hard cut in mid-typing, slide-in from the right, cursor swings from up-left to pointing at line 2, accelerating exit upward |
| 76–120  | **Scene 3** "Let's launch it / with Launch Studio" | 219–263: rises in from below, cursor flies in from the right and parks after line 1 |
| 121–189 | **Logo** mark + LAUNCH / STUDIO | 44–75: the mark takes the cursor's rise from the bottom edge, then eases to a hold |

Fresh words land at mid grey and settle to ink with the reference's measured curve; the shutter is ~0.15 frame,
as measured on the reference's fast moves. Where the new copy is wider than the reference's, each block is
shifted to keep the reference's centre and the cursor moves with whatever it was anchored to.

Every frame is drawn on one canvas by `assets/film.js` as a pure function of the frame number, mounted on the
root timeline in `index.html`. The mark and wordmark are clean alpha masks traced from the supplied logo
(`assets/mark.png`, `launch.png`, `studio.png`). The soundtrack (soft e-piano and pad bed, key clicks, wave
swell, cursor pop, whoosh, riser and logo hit) is synthesized from the film's own cue list:

```bash
node scripts/make-audio.mjs        # rebuilds assets/audio/soundtrack.wav
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/launch-studio.mp4
```
