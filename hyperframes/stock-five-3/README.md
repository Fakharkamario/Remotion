# five companies not to buy — part 3 (HyperFrames)

A 21.63 s, 1920x1080 / 30 fps edit of the third part of the same Chinese talking-head video, in the system of
`../stock-five` and `../stock-five-2`. The source is 1280x720; `assets/aroll.mp4` is a Lanczos upscale with light
sharpening.

Voice: 你一定要看到最后。第一，亏损的公司不买。第二，本月成长率低于40%的公司不买。第三，股价没有创近一年新高的公司
不买。第四，没有新产品、新服务、新市场的公司不买。第五点最重要：产品没有供不应求的公司不买。

The list gets one rhythm, repeated five times:

- **number** — a huge green numeral lands behind him (purple → gold flash) as he counts on his fingers, 第N above;
- **rule** — each rule in a different move from the animation reference;
- **verdict** — on 不买 the talking-head reference's red strike wipes through the rule and 不买 pops in red.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–49    | 0.00–1.66   | chest stack: 你一定要 / **看到最后** |
| 50–73   | 1.67–2.46   | **1** behind him |
| 74–125  | 2.47–4.19   | dark: 亏损的公司 typed huge chasing the caret, cut wide, struck, 不买, smear out |
| 126–148 | 4.20–4.96   | **2** |
| 149–249 | 4.97–8.33   | dark: 本月成长率 pill; ten cells build, fill white and stall short of the green 40% mark; 低于40% 的公司, struck |
| 250–274 | 8.33–9.16   | **3** |
| 275–375 | 9.17–12.53  | white: a price line creeps up under the dashed 一年新高 line and stalls there; black box 股价没有创近一年新高, struck |
| 376–398 | 12.53–13.29 | **4** (flashing in from white) |
| 399–514 | 13.30–17.16 | wall: 没有 / boxes open from a line — 新产品 新服务 新市场 / 的公司, each struck |
| 515–557 | 17.17–18.59 | **5**, larger, pill 第五点 最重要 |
| 558–648 | 18.60–21.63 | tight: 产品没有 / **供不应求** / 的公司, struck, 不买 |

- `assets/cut/` holds his cutout for the number beats (BiRefNet-portrait mattes on even frames, odd frames
  averaged). Rebuild with `CUT_FRAMES=<frames> python3 scripts/build_cutouts.py assets/aroll.mp4 <mattes>`.
- `scripts/build_audio.py` mixes `assets/voice.wav` with synthesized sound design: a hit on every numeral, a
  strike swish and thud on every 不买. No music bed.

```bash
npx hyperframes preview
npx --yes hyperframes@0.8.114 render -q high -o renders/stock-five-3.mp4
```
