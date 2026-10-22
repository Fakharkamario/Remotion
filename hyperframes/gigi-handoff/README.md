# Gigi handoff — chat after the storyboard

A 9.53 s, 30 fps, 1920×1080 clip that picks up where the storyboard cut leaves off (it whips off to the left), in the launch video's look: frosted white incoming bubbles, brand-blue outgoing ones, Inter, near-white background.

| frames | beat |
| --- | --- |
| 0–20 | the old chat ("hey aizal", "need a launch video", "quick", "On it" 🔥) slides in from the right, and the composer rises |
| 20–60 | "storyboard done " is typed, `https://figma.com/gigiai` is pasted and sent |
| 60–92 | the message lifts into the chat and the Gigi Storyboard link preview pops above it. The composer drops away |
| 92–145 | "i fucking love it!!" and "let's continue" pop in word by word while the view drifts and pushes in |
| 145–240 | a whip up and left lands close on "Perfect", with a typing bubble pulsing under it |
| 240–262 | it opens into "Let's animate" with a tilt that settles |
| 262–286 | everything lifts away upward |

The camera follows the reference edit's measured per-frame pan and zoom. Each bubble is placed by inverting that camera at the frame where the reference shows its counterpart. The link is a mock URL.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-handoff.mp4`)
