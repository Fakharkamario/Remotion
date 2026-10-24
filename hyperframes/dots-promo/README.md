# dots — promo

A 23.3 s, 30 fps, 1920×1080 promo for "OpenAI Dots", cut to the supplied voiceover (`assets/voiceover.mp3`). The motion language follows a reference edit: everything lands on springs with overshoot and squash-and-stretch, the camera keeps moving, and shots hand over with whips, smash zooms, a circle wipe and a pixel dissolve. The shots are written for this script and dressed in the dots brand: black, the glowing blue/green/yellow/pink wordmark and the four felt characters.

| frames | VO | shot |
| --- | --- | --- |
| 0–56 | "What if your AI could do the work," | big coloured letters fly into "What", the line builds word by word |
| 56–103 | "not just talk about it?" | chatty AI replies stack up and scroll, then pop into four dots |
| 103–162 | "Meet your new AI teammate." | the dots become the glowing "dots" wordmark; the characters pop up |
| 162–214 | "Find what matters…" | prompt types with Mail / Calendar / Docs chips, smash zoom, send |
| 214–240 | "…in your inbox" | mail, "Finding what matters" |
| 240–280 | "Keep your day organized." | calendar, "Organizing your day" |
| 280–352 | "Research anything. Get the answers." | research, "Researching" → "Getting answers", answer writes on |
| 352–422 | "Turn ideas into actual work." | team chat, "Drafting plan", a doc lands, pixel dissolve |
| 404–466 | "Connect your tools." | six tool tiles fly in and wire up to the four-dot hub |
| 466–505 | "Keep everything moving" | close-up of the Daily brief while the days roll Mon → Fri |
| 505–570 | "One Dot. Less busywork." | the blue character pops up; busywork tags around it pop away |
| 570–700 | "You focus on what's next. OpenAI Dots." | the line types, bursts into coloured dots that rebuild the end card |

Everything is drawn in `assets/scene.js` as a pure function of the frame. The characters are SVG with a felt filter (defined in `index.html`). Inter and GSAP are stored locally.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render with motion blur (recommended): `scripts/render-mb.sh` → `renders/dots-promo.mp4`
- Quick render without blur: `npx --yes hyperframes@0.8.114 render -q high -o renders/dots-promo.mp4`

App UIs, avatars and tool icons are generic stand-ins drawn in code; no third-party logos are used.
