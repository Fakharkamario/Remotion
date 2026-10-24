# Dots — promo

A 23.3 s, 30 fps, 1920×1080 promo for "OpenAI Dots", cut to the supplied voiceover (`assets/voiceover.mp3`). It follows the shot list and motion of a reference edit (dark letter intro → self-ticking list → dot-logo reveal → prompt with tool chips → app UIs with status pills → pixel dissolve → gradient brief cards → typed tagline → end card), with new copy, UI and mark.

| frames | VO | shot |
| --- | --- | --- |
| 0–58 | "What if your AI could do the work," | big serif letters fly into "What", the line builds word by word |
| 58–108 | "not just talk about it?" | a huge to-do list ticks itself off and scrolls; orange dots burst out |
| 108–160 | "Meet your new AI teammate." | the dots fly together into the Dots mark, "Dots" types |
| 160–214 | "Find what matters…" | prompt types with Mail / Calendar / Docs chips, smash zoom, send |
| 214–240 | "…in your inbox" | mail UI, "Finding what matters" |
| 240–280 | "Keep your day organized." | calendar UI, "Organizing your day" |
| 280–352 | "Research anything. Get the answers." | research UI, "Researching" → "Getting answers", answer writes on |
| 352–423 | "Turn ideas into actual work." | team chat UI, "Drafting plan", a doc lands, pixel dissolve |
| 404–570 | "Connect your tools… Less busywork." | gradient mosaic, Daily brief card, close-up as the days roll Mon → Fri |
| 570–700 | "You focus on what's next. OpenAI Dots." | tagline types, breaks into squares that rebuild the end card |

Everything is drawn in `assets/scene.js` as a pure function of the frame. Fonts (Source Serif 4, DM Sans, Inter) and GSAP are stored locally.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render: `npx --yes hyperframes@0.8.114 render -q high -o renders/dots-promo.mp4`

App UIs, avatars and tool icons are generic stand-ins drawn in code; no third-party logos are used.
