# Tallo — promo

A 14.7 s, 30 fps, 1920×1080 promo for Tallo, a personal-money app. It follows the shot list and timing of a reference After Effects edit, with a new brand and story:

| frames | beat |
| --- | --- |
| 0–36 | "We've all been there..." lands word by word (blue, italic, swish), then smears off right |
| 36–70 | phone spins in, money chips (Rent, Groceries, Savings…) burst out, phone tips back, chips fly up |
| 70–106 | vertical streak wipe; a small Bills checklist builds, then a whip zoom into it |
| 106–138 | the second check turns red and becomes a calendar dot; dates slide under it to the 21st |
| 138–214 | scanline glitch; "Late fees again" → "What if your money just" → "sorted itself?" |
| 214–300 | dark: magenta blades, Budget / Bills / Savings cards slide in on a panning strip |
| 300–384 | "All in one place", then Smart / Simple / Secure |
| 384–440 | the frame shrinks into the app icon, then the glowing tallo.app wordmark shrinks away |

Everything is drawn in `assets/scene.js` as a pure function of the frame (no media assets besides Inter). No audio track.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur: `scripts/render-mb.sh` (outputs `renders/tallo-promo.mp4`)
