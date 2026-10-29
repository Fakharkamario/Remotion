# grovr — promo

A 35.4 s, 30 fps, 1920×1080 HyperFrames promo. The motion follows a reference edit shot for shot: type that types huge and then shrinks, slams with a squash and rebound, glyph cuts on alternating grounds, outline letters drawn with their bezier nodes, a mockup cascade, spinning coins that chain into a ring inside spiral text, app UI, 3D cards, an arched word and a sliding end card. The content is new:

- **Brand:** *grovr*, a made-up app that rounds up card purchases and invests the spare change in climate projects.
- **Logo:** an original sprout mark (a stem with two leaves) and an Inter wordmark.
- **Palette:** lime `#BFF24A`, forest `#0F2B21`, cream `#F2EEE3`, lilac `#D8CFF2`, stone `#D8D0BD`, coral `#FF7A59`; jade coins carry the sprout as their emblem.
- **Copy:** every line is new.
- **Mockups and UI:** drawn in code. No third-party logos or card networks.
- **Soundtrack:** a 120 BPM bed plus hits, whooshes and ticks on the cuts, synthesized in `scripts/make_audio.py`.

| frames | shot |
| --- | --- |
| 0–78 | "Every" types huge, shrinks into "Every coin can", "MATTER" rises sheared and wobbles |
| 78–122 | `$` `%` `↗` and the sprout slam on alternating grounds, then a scatter of symbols on lilac |
| 116–168 | "Put your → / spare (sprout) change / to work." lights up word by word; push in, whip |
| 168–248 | outline letters of "grovr" pan past with their nodes and handles; the ground switches lime / forest / lilac |
| 248–290 | the wordmark slams in; the ground cuts to lime |
| 290–392 | "Say hello to" / "GREEN GAINS" slam / "FOR ↗ EVERYONE" rises letter by letter |
| 392–478 | eight brand mockups cut on the beat, cascade past "Meet the sprout", collapse to the lime card |
| 478–540 | "GROW / WHAT (sprout) / MATTERS." rises, then shrinks into a ring of words around a spinning coin |
| 540–650 | coins rush in, chain into an arc, close into a ring inside spiral text; "watch it grow →" over a big coin |
| 650–700 | "MAKE EVERY / CENT COUNT" with three flipping coins |
| 700–728 | "Round up. / Invest. / Plant." with the lime pill stepping down |
| 728–762 | the feature list scrolls with a highlighted row |
| 762–816 | the portfolio screen grows in, the balance counts up, the chart draws |
| 816–866 | two poster cards |
| 866–916 | "Spend it. / Plant it." over 3D cards, then a close pass across the card |
| 916–972 | "INVEST FOR" / arched "GOOD" |
| 972–1062 | end card: the sprout rolls in, the wordmark slides out from behind it, disclaimer |

Everything is drawn in `assets/scene.js` as a pure function of the frame. Inter and GSAP are stored locally.

- Preview: `npx --yes hyperframes@0.8.114 preview`
- Render: `npx --yes hyperframes@0.8.114 render -q high -o renders/grovr-promo.mp4`
- Render with motion blur: `scripts/render-mb.sh` → `renders/grovr-promo-mb.mp4`
- Rebuild the soundtrack: `python3 scripts/make_audio.py` (needs numpy and ffmpeg)
