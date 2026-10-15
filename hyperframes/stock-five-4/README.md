# hold, sell, repeat — part 4 (HyperFrames)

A 24.2 s, 1920x1080 / 30 fps edit of the fourth part of the same Chinese talking-head video, in the system of
`../stock-five` … `../stock-five-3`. The source is 1280x720 at 25 fps; `assets/aroll.mp4` is converted to 30 fps,
Lanczos-upscaled with light sharpening, and has the source's "InShot" corner mark removed (`delogo`).

Voice: 你就按照這5點去篩選股票。對了，就拿住，而且是死拿，拿到基本面不行的、大家都在喊跌喊空了、沒有更高的預期
空間的，再去把它賣掉。那錯了的話呢，直接一刀砍掉，不要留戀，不要跟股票談戀愛，直接去找下一檔，周而復始。只要根據這
5點，你絕對可以買到一個飆股，大部分都是時間問題而已。

| frames  | beat (reference move) |
|---------|------|
| 0–82    | wall: 你就按照, five chips 1–5 pop on 這5點 (part 3's list), huge **篩選股票** flashes in behind him (DRAFTKINGS) |
| 83–147  | chest: 對了 就拿住 而且是 / **死拿**, which squeezes as the second 拿 lands |
| 148–196 | name-tag lower third: ■ **基本面不行**, a rule, mono 賣出訊號 01 (Piers F. / COMMERCIAL DIRECTOR) |
| 197–247 | dark dashed grid, pink circle: the arrow swings from up to **down** on 喊跌, pixels burst; 大家都在 / 喊跌喊空 (with ↑ AI) |
| 248–305 | wall: thin 沒有更高的, huge **預期空間** behind his hair, green washing to ink (agent) |
| 306–340 | chest: 再去把它 / **賣掉** |
| 341–417 | chest: 那錯了的話呢 → 直接一刀 / **砍掉**; a red slash cuts the word and the halves slide apart |
| 418–487 | wall: 不要留戀 / 不要跟股票 / huge **談戀愛** behind him; a gold hand-drawn heart, then a red scrawl (2 years) |
| 488–525 | dark: chart cards slide, pill 直接去找下一檔, the next card lands centre-stage with a green edge |
| 526–548 | dark: **周而復始** inside a turning dot ring and arrow |
| 549–589 | wall: 只要根據, the five chips light up green one by one on 這5點 |
| 590–660 | chest: 你 絕對可以 買到一個 / **飆股**, shooting up into place |
| 661–725 | dark: a clock draws on, hands race and slow; 大部分都是 / **時間問題** / 而已 (the clock) |

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
- On-screen text is Traditional Chinese, set in Noto Sans TC (OFL, Taiwan glyph forms), subset to the glyphs used.
- `scripts/build_audio.py` mixes `assets/voice.wav` with synthesized sound design cued to the beats (-15 LUFS).
  No music bed.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final, motion-blurred
```
