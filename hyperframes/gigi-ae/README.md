# Gigi in After Effects

An 11.07 s, 30 fps, 1920×1080 clip in the Gigi launch look: white and light grey, Inter, the brand blue for selection, keyframes and the playhead, and black accents. It shows storyboard frame 04 ("Which / respectfully / is a terrible database") being animated in a light After Effects UI, then exported. The motion is the storyboard cut's (`../gigi-figma`), which copies the reference edit beat for beat: hard cuts on its exact frames, an iridescent blur for changes, and scrolls at the reference's measured speeds.

| frames | beat |
| --- | --- |
| 0–37 | the app rises in close on the comp. The entrance-preset menu flicks through presets, each replaying the word's entrance, and lands on Gigi Ease |
| 38–91 | the phone layer with Effect Controls and pills. Motion blur plays an iridescent bloom, then the layer drifts with a trail |
| 92–129 | the graph editor. The curve picker swaps easing curves and a value dot runs each one |
| 130–145 | the whole After Effects window, slow push, playhead running |
| 146–208 | a prompt is typed over "Which" and sent |
| 209–238 | the word morphs to "respectfully" and the comp scrolls away |
| 239–275 | the dark preview: "Which respectfully" morphs to "is a terrible database" |
| 276–332 | the window again: Export → Render → progress → "Render complete", then it whips off left |

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-ae.mp4`)
