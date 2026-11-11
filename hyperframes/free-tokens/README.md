# Free AI tokens reel (HyperFrames)

A 46.5 s, 1080x1920 / 30 fps vertical edit of the "800 million free tokens" talking-head take. The edit uses the
same style system as `../fable-reel`, keyed to the same three style references. The elements video (an earlier
edit of the same script) supplied the GitHub repo and star-history screenshots and the four company logos
(`assets/img/`). Every other graphic is rebuilt in the references' style.

**The take.** It was shot square (1080x1080). Pauses are cut down to a short breath, which takes it from 53.0 s
to 46.5 s in 23 jump cuts. Each layout frames it differently:
- `full`: covers the 9:16 frame and jump-zooms on the face.
- `split`: native size under the wavy edge.
- `inset`: a rounded window under the card.
- Intro: a punch on the face, then the take settles under the hero panel.

The table lists each shot's start time, its layout and what is on screen.

| t (s) | layout | shot |
|---|---|---|
| 0.0 | intro | hero panel drops in (GitHub repo + 800,000,000 counter + green "somebody just figured it out" banner), STOP PAYING FOR AI / 800M FREE write on, light burn |
| 3.8 | split | 800,000,000 tokens counts up; "what you pay" $200 struck → $0.00 |
| 6.8 | full | jump zooms; "no extra zeros", 800,000,000 with the zeros in orange |
| 9.9 | full | "Here's how it works ↓" |
| 11.1 | split | free tiers: OpenAI / Google / Meta · Llama / Mistral light up as they're named |
| 17.0 | split | four small limit bars → stacked into one 800M / month bar |
| 20.2 | split | routing: request → repo → model; the model hits LIMIT, the packet reroutes to the next; "No wall. Ever." |
| 27.8 | full | "800,000,000" punch-in |
| 29.2 | split | 800M tokens ≈ 600M words; 2,000 words a day for 80 years ≈ 58M, a bar with 90% still left |
| 35.8 | inset | $200 and $300 a month bills, "just ONE model" |
| 41.5 | split | star-history screenshot, "Trending on GitHub" |
| 43.6 | full | the four logos grey out, "No comment… yet." |

## Rebuild

```bash
python3 scripts/build_media.py <raw_take.mp4> <words.json>   # aroll.mp4, voice.wav, words.js
python3 scripts/build_audio.py                               # audio.m4a (voice + synthesized SFX + music bed)
npx --yes hyperframes@0.8.114 render -q high -o renders/free-tokens.mp4
```
