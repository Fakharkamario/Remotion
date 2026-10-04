# benchlane replay (HyperFrames)

A 9.9 s, 1920x1080 / 30 fps HyperFrames clip. Its content (copy, Final build / Source / Agent workflow /
AI review cards, the Volt mascot, the rubric, the skills checklist) comes from the benchlane promo's
watch → replay → review → checklist beats. Its motion is retimed frame by frame against a reference cut
of the same four beats.

| frames  | time (s)    | composition | beat |
|---------|-------------|-------------|------|
| 0–30    | 0.00–1.03   | `title`     | "Replay" fills the frame in accent, goes ink; the camera cuts wider as "the whole" lifts in, then wider again as *session* lifts in; the paper plane tumbles across and shrinks into the line while the line drifts down |
| 31–192  | 1.03–6.43   | `replay`    | list and first card settle in, Final build tiles fade up, bullet tumbles in and the item steps right; three stack wipes (old card's bottom edge and new card's top edge sweep up, the bullet stretches down to the next item); code types and scrolls, agent log spins then reads "Thought", rubric chips open hairline → box → pill; list spreads out before the cut |
| 193–255 | 6.43–8.53   | `review`    | "AI agents ◌ *grade* every session" on a dark band that keeps opening; accent → white, spinner slot opens and the arc spins; glows step dark → ember → cream → ember on a 20 px grid; the line lifts before the cut |
| 256–296 | 8.53–9.90   | `checklist` | skills checklist: fast flick then a steady glide, each item ticks in turn |

How the motion is matched:

- **Per-frame data, not eases.** `assets/motion.js` holds one entry per 30 fps reference frame: the title
  camera and plane path, every card's mask top, mask bottom and window top (from row runs of the card
  and window on each frame), the bullet square and the list offsets. Smaller hand-measured tables (item
  indents, band size, spinner arc, glow colour keys, checklist scroll) sit in the compositions.
  Frame numbers in the code are global reference frames; held frames from the reference's 24 fps cadence
  are kept.
- **Stack wipes:** each card is a rounded mask whose top and bottom edges move separately from the
  window inside it, so the outgoing card is wiped from below and the incoming card is revealed from its
  bottom up, exactly as in the reference.
- Checked against the reference: list, bullet and card edges land within 1–2 px on sampled frames, and
  the title's cap heights and drift match.

```
index.html            root: mounts the four scenes + soundtrack
compositions/*.html   one sub-composition per beat (local timelines)
assets/motion.js      measured per-frame motion tables
assets/fx.js          shared helpers (per-frame set driver, word slots, painted landscapes, mascot, plane)
assets/audio.m4a      the benchlane promo soundtrack, 30.53–40.43 s, with a fade-out
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/benchlane-replay.mp4
```

`check` warns about low contrast on the dim line numbers, faded log lines, unticked/ticked checklist
items and the rubric labels. That is intended: they match the reference.
