# avoid these 5 companies (HyperFrames)

A 7.0 s, 1920x1080 / 30 fps HyperFrames edit of a Chinese talking-head clip. Captions and pacing follow the
style reference (small sentence line, one huge condensed key line, accent colours, red strike, punch-in zooms).
Where that reference cuts to B-roll, this edit cuts to motion graphics in the language of the animation reference
(charcoal ground, white type, signal green, lime highlighter, dot ring, grid, pill label, typing caret).

Voice: 做股票投資呢，你只要能避開這5種公司，你的投資績效絕對會高於90%的人。
("In stock investing, if you just avoid these 5 kinds of companies, your returns will beat 90% of people.")

| frames  | time (s)    | shot | beat (reference it copies) |
|---------|-------------|------|------|
| 0–47    | 0.00–1.60   | A-roll framed left, pushing in | 做 / **股票投資** / 呢 on the wall **behind him**; the key word rises out of a blur, purple → gold → ink (talking-head ref: CLARITY, DRAFTKINGS) |
| 48–69   | 1.60–2.33   | charcoal | 你只要 typed huge with the camera chasing the caret; grey panel cut wide; 能避開 typed, yellow → lime highlighter grows under 避开; smears out (animation ref: "why would you get rid of reps") |
| 70–101  | 2.33–3.40   | A-roll punch-in on the open hand | 避開這 pops word by word on his chest, **5種公司** flashes in, red strike wipes it (talking-head ref: DRAFTKINGS) |
| 102–138 | 3.40–4.63   | A-roll | thin 你的 writes on green → ink; a green box opens from a line around 投資績效 on the wall; the picture washes to white (animation ref: "labor replacement") |
| 139–172 | 4.63–5.77   | A-roll, flashing in from white | thin 絕對 會 write on; huge **高於** lands green **behind his hair** and washes to ink, drifting smaller (animation ref: "agent") |
| 173–209 | 5.77–7.00   | charcoal | dot → square → particles gather to a ring → splits 2×2 → 4×4 → 10×10; green caret opens the grey pill 90%的人; 90 cells dim, the top row lights green (animation ref: "10X more productive") |

- No text sits over his face. Words that share the frame with his head stand behind him: `assets/cut/` holds
  his cutout for frames 0–47 and 139–172 (source frame + BiRefNet-portrait matte as alpha, WebP), layered over
  the `#behind` text. `scripts/build_cutouts.py` builds them; a missing matte is averaged from its neighbours.
- His wall is light cream, so words standing on it settle to ink rather than the references' white.
- The take (`assets/aroll.mp4`) runs unbroken under the whole timeline; dark scenes cover it on hard cuts.
- `assets/scene.js` draws everything as a pure function of the frame. Word frames are ASR (SenseVoice) onsets
  checked against the voice's loudness envelope.
- On-screen text is Traditional Chinese, set in Noto Sans TC (OFL, Taiwan glyph forms), subset to the glyphs used;
  the key words use the Black weight squeezed to 80%.
- `scripts/build_audio.py` mixes `assets/voice.wav` with synthesized sound design cued to the beats and
  normalizes to -15 LUFS. There is no music bed.

```bash
python3 scripts/build_audio.py                          # rebuild assets/audio.m4a (numpy + ffmpeg)
python3 scripts/build_cutouts.py <source.mov> <mattes>   # rebuild assets/cut + assets/cutouts.js (opencv)
npx hyperframes preview
npx --yes hyperframes@0.8.114 render -q high -o renders/stock-five.mp4
```
