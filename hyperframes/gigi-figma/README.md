# Gigi storyboard — design tool cut

An 11.07 s, 30 fps, 1920×1080 clip that follows the Gigi launch video (`../gigi-launch`). It uses the same palette (white and light grey), Inter, the brand blue for selection and the cursor, and black accents. The motion copies the reference edit's grammar beat for beat: hard cuts on its exact frames and instant swaps stepped on its 25 fps cadence. UI pills stagger in, and content changes through an iridescent blur. The page scrolls are driven by the reference's measured per-frame scroll speeds: a jolt, a cut at peak speed, and the next shot carrying the momentum.

| frames | beat |
| --- | --- |
| 0–37 | the window rises in close on the title. The font menu flicks through faces and lands on Inter Display |
| 38–91 | a storyboard image with an adjust panel and pills. Enhance plays an iridescent regenerate |
| 92–129 | the "Who knows / Who is" section. The layout picker swaps arrangements |
| 130–145 | the whole design tool, slow push |
| 146–208 | a prompt is typed over "Your inbox." and sent |
| 209–238 | the line morphs to "Your calendar." and the page scrolls away |
| 239–275 | a dark section scrolls by. "Your WhatsApp." morphs to "is a terrible database" |
| 276–332 | the design tool again: Share → Copy link → "Link copied", then it whips off left for the match cut |

The storyboard frames in `assets/sb/` are cut from screenshots of the Gigi Storyboard file. The "Who knows" and database frames are drawn live so their text can change. Everything is drawn in `assets/scene.js` as a pure function of the frame. The bundled fonts in `assets/fonts/` are open-licensed copies of the system fonts used in the font menu.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-figma.mp4`)
