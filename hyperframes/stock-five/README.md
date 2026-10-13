# avoid these 5 companies (HyperFrames)

A 7.0 s, 1920x1080 / 30 fps HyperFrames edit of a Chinese talking-head clip. Captions and pacing follow the
style reference (small sentence line, one huge condensed key line, accent colours, red strike, punch-in zooms).
Where that reference cuts to B-roll, this edit cuts to motion graphics in the language of the animation reference
(charcoal ground, white type, signal green, lime highlighter, dot ring, grid, pill label, typing caret).

Voice: 做股票投资呢，你只要能避开这5种公司，你的投资绩效绝对会高于90%的人。
("In stock investing, if you just avoid these 5 kinds of companies, your returns will beat 90% of people.")

| frames  | time (s)    | shot | beat |
|---------|-------------|------|------|
| 0–47    | 0.00–1.60   | A-roll, slow push | 做 **股票投资** 呢: each big character lands green and settles to white |
| 48–69   | 1.60–2.33   | animation | 你只要能避开 typed huge behind a caret, the line slides left, lime highlighter wipes 避开 |
| 70–101  | 2.33–3.40   | A-roll, punch-in on the open hand | 避开这 / green **5** 种公司 in ink on the wall, then a red strike |
| 102–138 | 3.40–4.63   | animation | a dot pops, turns square, opens into a chart card in a dot ring; the line rises; 你的投资绩效 pill grows word by word |
| 139–172 | 4.63–5.77   | A-roll, tight, easing out | 绝对会 / **高于** |
| 173–209 | 5.77–7.00   | animation | a 10x10 grid fills from the centre, the counter runs to **90%**, 90 cells dim, the top row lights green: 你 / 的人 |

- The A-roll (`assets/aroll.mp4`) is one continuous take under the whole timeline, so the voice never jumps;
  animated scenes are opaque and cover it on hard cuts. The camera moves are a transform on `#cam`.
- `assets/scene.js` draws everything as a pure function of the frame. Character landing frames are word onsets
  from ASR (SenseVoice), checked against the voice's loudness envelope.
- Fonts are subset to the glyphs used: ZCOOL QingKe HuangYou (condensed key words), Noto Sans SC (captions,
  typed line, pill), Anton (numerals). All OFL.
- `scripts/build_audio.py` mixes `assets/voice.wav` (the clip's original audio) with synthesized sound design
  (whooshes on the cuts, typing clicks, pops, a hit on the 5, a riser on the chart, counter ticks, dings) and
  loudness-normalizes to -15 LUFS. `SFX_GAIN` sets the effects level. There is no music bed.

```bash
python3 scripts/build_audio.py          # rebuild assets/audio.m4a (numpy + ffmpeg)
npx hyperframes preview
npx --yes hyperframes@0.8.114 render -q high -o renders/stock-five.mp4
```
