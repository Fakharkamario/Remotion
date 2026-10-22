# Gigi in After Effects

A 13 s, 30 fps, 1920×1080 clip in the Gigi launch look: white and light grey, Inter, the brand blue for selection, keyframes and the playhead, and black accents. It is one continuous session in the real (dark) After Effects UI, animating storyboard frame 04 ("Which / respectfully / is a terrible database") and rendering it. A virtual camera rides the work and punches in on every interaction, and every click does what it does in the app.

| frames | beat |
| --- | --- |
| 0–26 | the app rises in from below, slow push |
| 26–60 | the playhead is dragged to 1 s: the comp scrubs in the viewer and the collage pops in |
| 60–132 | "Which" twirled open, the Scale stopwatch set at 1 s, playhead back to 10 f, Scale scrubbed to 0 % (a second keyframe) |
| 132–176 | both keyframes marquee-selected, right-click → Keyframe Assistant → Easy Ease |
| 176–220 | Graph Editor: the speed graph; the out-handle is dragged for a snappier landing |
| 220–254 | Play: the preview runs, the word scales in, the cache bar fills green |
| 254–354 | Composition → Add to Render Queue, a calm glide to the queue → Render; progress fills over 1.4 s, Done holds |
| 354–390 | pull out, the whole window slides off left |

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-ae.mp4`)
