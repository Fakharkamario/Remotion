# Wayfold — type shift

A 20.07 s, 30 fps, 1920×1080 promo for "Wayfold", a made-up AI travel planner. It follows the shot lengths, cuts, camera moves and cursor timing of a reference "type shift" edit, with a new story, original art, new copy and a new brand. The 9 s loop plays twice: the first pass plans a Lisbon trip and the second finds an Alpine cabin. Then the end card plays.

| frames (per loop) | shot |
| --- | --- |
| 0–15 | postcard collage pops in on a swinging camera; confetti squares blink on the paper |
| 15–17 | "type shift": the postcards jump into the phone layout at large scale |
| 17–63 | the Wayfold phone settles and its grid reshuffles twice |
| 63–97 | the prompt card types the request |
| 97–138 | close-up on send: the cursor rises and presses, and the button turns brown, then orange |
| 138–183 | a stay listing slides in, with a blue cursor and a UX note |
| 183–224 | a dark checkout pushes in from the left; orange cursor, and the fee line highlights |
| 224–270 | a white panel pushes in, with a pink cursor and a note |
| 539–602 | black end card: the glowing `wayfold` wordmark shrinks away |

Everything is drawn in `assets/scene.js` as a pure function of the frame. Postcards and room images are flat SVG illustrations drawn in code, and the icons are generic. Copy for both passes lives in `SETS` at the top of the file. Inter and GSAP are stored locally. No audio track.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (writes `renders/wayfold-type-shift.mp4`)
- Quick render: `npx --yes hyperframes@0.8.114 render -q high -o renders/quick.mp4`
