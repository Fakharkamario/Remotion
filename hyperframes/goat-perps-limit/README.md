# GOAT Funded Perps: daily loss limit (HyperFrames)

A 6.93 s, 1920x1080 / 30 fps clip (208 frames) with the supplied voiceover, built on the supplied reference
(a tilted trading terminal that dollies while a panel's outline traces gold, a rolling word wheel over slanted copy,
hard cuts between them) in the Perps brand.

VO: "Your daily loss limit is based on your balance, not your open profits, so the winning trades you hold
overnight won't tighten your limit."

| frames  | beat |
|---------|------|
| 0–74    | the terminal, leaning back with ghost layers stacked behind, swings in; panels float forward joined by a gold connector; the orange limit line draws on "loss limit" and the loss room fills; on "balance" the Balance row selects, a gold trace runs round it and the card lights |
| 74–140  | the word wheel over slanted, out-of-focus product UI: Balance → Open profits (struck out on "profits") → Winning trades |
| 140–208 | the stack from the other side: the long prints through an overnight session, P&L climbing on the chart and on a floating YOUR LIMIT card; on "won't tighten" the limit row traces gold, the lock glints and "Unchanged by open profit" appears |

Every camera move uses a glide whose speed builds then bleeds off on a long tail (measured on the reference),
and moves overlap so nothing snaps or sits dead.

```bash
npx --yes hyperframes@0.8.114 render -f 30 -q high -o renders/goat-perps-limit.mp4
```
