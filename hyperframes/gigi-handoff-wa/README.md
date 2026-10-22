# Gigi handoff — messenger version

A 9.53 s, 30 fps, 1920×1080 clip that picks up where the storyboard cut leaves off (it whips off to the left), restyled as a full-screen messenger: rounded white incoming bubbles and pale-green outgoing ones, each with a time stamp (and read ticks on ours), on the doodle wallpaper in `assets/img/doodle.jpg`. The wallpaper lifts away with the chat at the end. This copy keeps the two-message ending ("Perfect", typing, "Let's animate"), and its tracks are averaged wherever the motion is slow so the bubbles hold steady.

| frames | beat |
| --- | --- |
| 0–20 | the old chat ("hey aizal", "need a launch video", "quick", "On it" 🔥) slides in from the right, and the composer rises |
| 20–60 | "storyboard done " is typed, `https://figma.com/gigiai` is pasted and sent |
| 60–92 | the message lifts into the chat and the Gigi Storyboard link preview pops above it. The composer drops away |
| 92–145 | "i fucking love it!!" and "let's continue" pop in word by word while the view drifts and pushes in |
| 145–240 | a whip up and left lands close on "Perfect", with a typing bubble pulsing under it |
| 240–262 | it opens into "Let's animate" with a tilt that settles |
| 262–286 | everything lifts away upward |

Every element rides a track measured from its counterpart in the reference edit: the old chat, the cursor, the composer, the sent message, the preview card, the replies, "Perfect", the typing bubble and the final message with its tilt. The tracks are stored in `assets/ref-keys.js` with one row per real source frame at its true 24 fps time, and a monotone cubic runs through them so the motion keeps the reference's speed curves and plays smoothly. The link is a mock URL.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-handoff.mp4`)
