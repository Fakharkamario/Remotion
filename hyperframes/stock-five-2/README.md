# reverse thinking — part 2 (HyperFrames)

A 14.73 s, 1920x1080 / 30 fps edit of the second part of the same Chinese talking-head video, in the same system
as `../stock-five`: talking-head reference for captions (word pops, one huge flashing key word, chest stacks),
animation reference for the graphics (green write-on, neon AUTOPILOT room with a card opening out of the word,
2X-style number with a label pill, white augmentation box, diagonal word cascade). No text sits on his face:
words that share the frame with his head stand behind him (his cutout is layered over them).

Voice: 多数人呢都是在思考哪家公司会涨、哪个公司赚钱，但是呢用逆向思维的方式会让事情变得更简单。尤其是第五点，
基本到不行的经济学常识。但是多数人在做股票的时候全部都会忘光光。

| frames  | time (s)     | shot | beat (reference move) |
|---------|--------------|------|------|
| 0–46    | 0.00–1.56    | A-roll framed left | 多数人呢 / 都是在 pop on the wall; huge **思考** flashes in behind him (DRAFTKINGS, CLARITY) |
| 47–107  | 1.57–3.59    | dark neon room | 哪家公司会涨 lands green and sweeps white; a chart card opens from inside it, 哪个公司赚钱 written across (AUTOPILOT → AUTONOMOUS AGENTS) |
| 108–170 | 3.60–5.69    | punch-in | 但是呢 用 / **逆向思维** / 的方式 on his chest; the key word flips in mirrored ("reverse") |
| 171–236 | 5.70–7.89    | tight | thin 会让事情变得 writes on; huge **更简单** lands green behind his hair, washes to ink (agent) |
| 237–275 | 7.90–9.19    | wide | grey pill 尤其是第五点 types in; a huge green **5** lands behind him as he holds up five fingers; wash to white (2X pipe line) |
| 276–336 | 9.20–11.23   | white | 基本到不行的 writes on; a box opens green, turns black, 经济学常识 typed inside (labor / augmentation) |
| 337–389 | 11.23–12.99  | A-roll framed left, flashing in | 但是 / 多数人 / 在**做股票** / 的时候 cascade diagonally down the wall (sales / is really / gonna / be) |
| 390–441 | 13.00–14.73  | tight punch-in | 全部都会 / **忘光光** flashes in, then the characters dissolve away one by one |

- `assets/cut/` holds his cutout for frames 0–46 and 171–275 (BiRefNet-portrait matte on even frames, odd frames
  averaged from their neighbours). Rebuild with
  `CUT_FRAMES=$(python3 -c "print(','.join(map(str,list(range(47))+list(range(171,276)))))") python3 scripts/build_cutouts.py <source.mov> <mattes>`.
- `scripts/build_audio.py` mixes `assets/voice.wav` with synthesized sound design cued to the beats (-15 LUFS).
  There is no music bed.

```bash
npx hyperframes preview
npx --yes hyperframes@0.8.114 render -q high -o renders/stock-five-2.mp4
```
