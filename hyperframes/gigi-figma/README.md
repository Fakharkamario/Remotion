# Gigi storyboard — design tool cut

An 11.5 s, 30 fps, 1920×1080 clip that follows the Gigi launch video (`../gigi-launch`). It uses the same palette (white and light grey), Inter, the brand blue for selection and the cursor, and black accents. A design-tool window shows the Gigi storyboard, cut kinetically:

| frames | beat |
| --- | --- |
| 0–26 | the window rises from below, continuing the launch video's lift, and opens close on the first frame |
| 26–72 | the title text is selected. The font menu flicks through faces and lands on the brand's Inter Display |
| 72–160 | whip along the board to the database frame. Its line swaps word by word: inbox, calendar, messages, WhatsApp, "is a terrible database" |
| 160–214 | whip to Gigi's profile frame, which gets selected |
| 214–256 | pull back to the whole storyboard |
| 256–316 | Share → Copy link → "Link copied to clipboard" |
| 316–345 | the window slides off left for the match cut |

The storyboard frames in `assets/sb/` are cut from screenshots of the Gigi Storyboard file. The "Who knows" and database frames are drawn live so their text can change. Everything is drawn in `assets/scene.js` as a pure function of the frame. The bundled fonts in `assets/fonts/` are open-licensed copies of the system fonts used in the font menu.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/gigi-figma.mp4`)
