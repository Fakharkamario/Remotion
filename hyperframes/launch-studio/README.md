# Launch Studio (HyperFrames)

An 11 s, 1920x1080 / 30 fps HyperFrames spot (330 frames) in the style of the reference clip: off-white paper
with soft window-blind shadows, typed headlines (fresh letters land light and settle to ink), blue gradient
type, a blurred blue wave wipe, and a glossy 3D blue cursor that carries the story between scenes.

| frames  | seconds   | beat |
|---------|-----------|------|
| 0–85    | 0.0–2.8   | **Scene 1** — "You built" types in blue gradient while the camera leans after the caret; a blue wave rises, "the product" reads white on it, then the wave sweeps off the top |
| 78–172  | 2.6–5.7   | **Scene 2** — "But nobody / understands it." types in; the cursor pops up, looks left and right, then turns to point right; whip pan out with motion blur |
| 169–262 | 5.6–8.7   | **Scene 3** — "Let's launch it" whips in and types with the cursor riding the caret; "with **Launch Studio**" (blue) follows |
| 246–330 | 8.2–11.0  | **Outro** — the text drifts out of focus, the cursor turns up, grows and becomes the Launch Studio mark; light sweep; LAUNCH / STUDIO track in |

Every frame is drawn on one canvas by `assets/film.js` as a pure function of the frame number, mounted on the
root timeline in `index.html`. The mark and wordmark are clean alpha masks traced from the supplied logo
(`assets/mark.png`, `launch.png`, `studio.png`). The soundtrack (soft e-piano and pad bed, key clicks, wave
swell, cursor pop, whoosh, riser and logo hit) is synthesized from the film's own cue list:

```bash
node scripts/make-audio.mjs        # rebuilds assets/audio/soundtrack.wav
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/launch-studio.mp4
```
