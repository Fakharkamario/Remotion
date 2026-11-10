# App launch promo (HyperFrames)

A 21 s, 1920×1080 promo for an app-promo-video service, cut to the supplied voiceover. The read is opened up with
pauses between its five phrases; an original music bed fills the pauses and ducks under the voice. The look is
soft and simple: a white wall with window light, glassy blue shapes, a blue pointer that leads the eye, words
that settle out of a blur, and a camera that never stops drifting.

| frames (30 fps) | voice | picture |
| --- | --- | --- |
| 0–110 | "Launching your app?" / "Make people notice it." | app icon, pointer glides in; the icon pulses and collects likes, a rating, "Trending today" |
| 110–146 | pause | the pointer taps the icon and we fly into it |
| 136–232 | "We create eye-catching animated videos" | a video being animated: stage, timeline, playhead, the phone turning |
| 205–307 | "that show what your app does and why people need it." | push into the phone; the app builds; callouts; a five-star review |
| 307–356 | pause | the goal ring completes, "Goal reached"; blue wipe |
| 352–448 | "Simple, clear, and made to get downloads." | two words, then the line and a Download button |
| 448–502 | pause | tap; downloads count up along a rising line; blue wipe |
| 498–630 | "Message us today." | the call-to-action button pulls back into view, a tap, hold |

Everything is drawn in `assets/scene.js` as a pure function of the frame, so any frame seeks and renders on its
own. Styles live in `index.html`. Inter and GSAP are stored locally. The app, its UI and the numbers on screen
are made-up stand-ins.

## Sound

`scripts/make-audio.py <source voiceover>` writes both tracks:

- `assets/voiceover.mp3`: the supplied read, cut into its phrases and re-spaced to the shots.
- `assets/music.mp3`: a bed synthesised in the script (100 BPM, so a bar is 72 frames) with soft whooshes,
  clicks and chimes on the moves.

## Commands

```bash
npx --yes hyperframes@0.8.114 preview
npx --yes hyperframes@0.8.114 render -f 60 -q high -o renders/app-launch-promo.mp4
```
