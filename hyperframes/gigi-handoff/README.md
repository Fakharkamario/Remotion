# Gigi handoff — chat after the storyboard

A 7.33 s, 30 fps, 1920×1080 clip that picks up where the storyboard cut leaves off (it whips off to the left), in the launch video's look: frosted white incoming bubbles, brand-blue outgoing ones, Inter, near-white background.

| frames | beat |
| --- | --- |
| 0–20 | the old chat ("hey aizal", "need a launch video", "quick", "On it" 🔥) slides in from the right, and the composer rises |
| 20–60 | "storyboard done " is typed, `https://figma.com/gigiai` is pasted and sent |
| 60–92 | the message lifts into the chat and the Gigi Storyboard link preview pops above it. The composer drops away |
| 92–145 | "i fucking love it!!" and "let's continue" pop in word by word while the view drifts and pushes in |
| 145–198 | the chat whips away up and left. A blue typing bubble flies in from the right, as "On it" does in the launch video. It opens into "Perfect, let's animate" word by word and the 🔥 badge pops |
| 198–220 | everything lifts away upward |

Every element rides a track measured from its counterpart in the reference edit: the old chat, the cursor, the composer, the sent message, the preview card and the replies. The closing message reuses the launch video's measured "On it" beat. The tracks are stored in `assets/ref-keys.js` with one row per real source frame at its true 24 fps time, and a monotone cubic runs through them so the motion keeps the reference's speed curves and plays smoothly. The link is a mock URL.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-handoff.mp4`)
