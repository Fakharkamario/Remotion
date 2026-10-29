# Wayfold — type shift

A 20 s, 30 fps (600 frames), 1920×1080 promo for "Wayfold", a made-up AI travel planner. It follows the shot lengths and cut points of a reference "type shift" edit. Each move's timing and easing was measured frame by frame from the reference (card glides, typing speed, the zoom settle, the button heat and press, the ease-in/whip/settle panel pushes, cursor arrivals, note growth, the end-card shrink). Those curves are stored as normalised profiles and applied to this film's own layouts, art, copy and brand. The 9 s loop plays twice: the first pass plans a Lisbon trip and the second finds an Alpine cabin. Then the end card plays.

| frames (loop 1; loop 2 = +269) | shot |
| --- | --- |
| 0–17 | postcards pop on in type-shift steps (frames 0, 2, 4, 5), then a slow push-in; confetti blinks on the paper |
| 17–63 | the postcards re-flow into the Wayfold phone, the card settles, then scrolls out upwards |
| 63–97 | the prompt card types the request |
| 98–138 | close-up on send: the cursor rises, the button heats from black to orange, and the cursor presses |
| 138–167 | a stay listing slides in, with a blue cursor and a UX note |
| 167–207 | a dark checkout eases in from the left, whips across and settles; orange cursor, and the fee line highlights |
| 207–269 | a white panel pushes in, with a pink cursor and a note, then everything eases off right into the cut |
| 538–600 | black end card: the glowing `wayfold` wordmark shrinks away |

Everything is drawn in `assets/scene.js` as a pure function of the frame. Postcards and room images are flat SVG illustrations drawn in code, and the icons are generic. Copy for both passes lives in `SETS` at the top of the file. Inter and GSAP are stored locally. No audio track.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (writes `renders/wayfold-type-shift.mp4`)
- Quick render: `npx --yes hyperframes@0.8.114 render -q high -o renders/quick.mp4`
