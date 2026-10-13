# hold, sell, repeat — part 4 (HyperFrames)

A 24.2 s, 1920x1080 / 30 fps edit of the fourth part of the same Chinese talking-head video, in the system of
`../stock-five` … `../stock-five-3`. The source is 1280x720 at 25 fps; `assets/aroll.mp4` is converted to 30 fps,
Lanczos-upscaled with light sharpening, and has the source's "InShot" corner mark removed (`delogo`).

Voice: 你就按照这5点去筛选股票。对了，就拿住，而且是死拿，拿到基本面不行的、大家都在喊跌喊空了、没有更高的预期
空间的，再去把它卖掉。那错了的话呢，直接一刀砍掉，不要留恋，不要跟股票谈恋爱，直接去找下一档，周而复始。只要根据这
5点，你绝对可以买到一个飙股，大部分都是时间问题而已。

| frames  | beat (reference move) |
|---------|------|
| 0–82    | wall: 你就按照, five chips 1–5 pop on 这5点 (part 3's list), huge **筛选股票** flashes in behind him (DRAFTKINGS) |
| 83–147  | chest: 对了 就拿住 而且是 / **死拿**, which squeezes as the second 拿 lands |
| 148–196 | name-tag lower third: ■ **基本面不行**, a rule, mono 卖出信号 01 (Piers F. / COMMERCIAL DIRECTOR) |
| 197–247 | dark dashed grid, pink circle: the arrow swings from up to **down** on 喊跌, pixels burst; 大家都在 / 喊跌喊空 (with ↑ AI) |
| 248–305 | wall: thin 没有更高的, huge **预期空间** behind his hair, green washing to ink (agent) |
| 306–340 | chest: 再去把它 / **卖掉** |
| 341–417 | chest: 那错了的话呢 → 直接一刀 / **砍掉**; a red slash cuts the word and the halves slide apart |
| 418–487 | wall: 不要留恋 / 不要跟股票 / huge **谈恋爱** behind him; a gold hand-drawn heart, then a red scrawl (2 years) |
| 488–525 | dark: chart cards slide, pill 直接去找下一档, the next card lands centre-stage with a green edge |
| 526–548 | dark: **周而复始** inside a turning dot ring and arrow |
| 549–589 | wall: 只要根据, the five chips light up green one by one on 这5点 |
| 590–660 | chest: 你 绝对可以 买到一个 / **飙股**, shooting up into place |
| 661–725 | dark: a clock draws on, hands race and slow; 大部分都是 / **时间问题** / 而已 (the clock) |

- `assets/cut/` holds his cutout where words stand behind him (BiRefNet-portrait mattes on even frames, odd
  frames averaged). Rebuild with `CUT_FRAMES=<frames> python3 scripts/build_cutouts.py assets/aroll.mp4 <mattes>`.
- Motion follows curves tracked frame by frame off the animation reference: things grow from nothing on a
  slow-in/slow-out S-curve on a log scale with no overshoot (its grid square: 7 → 13 → 24 → 41 → 68 → 103 → 128 →
  144 → 152 → 158 px) and dip slightly before a big move; key words land about a quarter too large out of a blur and
  decay toward rest exponentially, never parking (its AUTOPILOT: 130 → 122 → 117 → … → 89 px); dark scenes leave
  with a sideways smear.
- `scripts/render-mb.sh` is the final render: the timeline is sampled at 120 fps and each 30 fps frame averages the
  three samples around it (a 180-degree shutter), so fast moves blur like camera footage. Cutouts key off the video
  frame, words and cuts off whole frames, so nothing ghosts.
- `scripts/build_audio.py` mixes `assets/voice.wav` with synthesized sound design cued to the beats (-15 LUFS).
  No music bed.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final, motion-blurred
```
