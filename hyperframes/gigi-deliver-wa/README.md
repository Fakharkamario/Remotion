# Gigi delivery — messenger chat

A 4.87 s, 30 fps, 1920×1080 clip that delivers the finished video in the messenger look, with the same motion as the handoff chat (`../gigi-handoff-wa`). Every element rides tracks measured from the reference edit (`assets/ref-keys.js`).

| frames | beat |
| --- | --- |
| 0–20 | the last chat ("i fucking love it!!", "let's continue", our "Perfect" / "Let's animate") swings in from the right; the composer rises |
| 20–60 | the cursor clicks the paperclip, "gigi video.mp4" lands in the box, "done" is typed, the cursor clicks send |
| 60–92 | the caption grows out of the composer, the video pops in above it, the composer drops |
| 92–122 | "You guys cooked!! 🔥" pops in word by word while the view pushes in |
| 122–146 | everything drops away downward |

The video thumbnail (`assets/img/thumb.jpg`) is the storyboard's end card.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render: `scripts/render-mb.sh` (outputs `renders/gigi-deliver-wa.mp4`)
