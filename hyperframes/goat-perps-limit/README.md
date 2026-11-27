# GOAT Funded Perps: daily loss limit (HyperFrames)

A 6.93 s, 1920x1080 / 30 fps clip (208 frames) with the supplied voiceover, built on the supplied reference
(a tilted trading terminal that dollies while a panel's outline traces gold, a rolling word wheel over slanted copy,
hard cuts between them) in the Perps brand.

VO: "Your daily loss limit is based on your balance, not your open profits, so the winning trades you hold
overnight won't tighten your limit."

| frames  | beat |
|---------|------|
| 0–74    | the terminal swings in; the orange limit line draws on "loss limit"; "Balance" lights and a gold trace runs round it on "balance" |
| 74–140  | the word wheel: Balance → Open profits (struck out on "profits") → Winning trades |
| 140–208 | the long prints through an overnight session, P&L climbing, while the limit line holds; the lock glints and "unchanged" appears on "won't tighten" |

Every camera move uses a glide whose speed builds then bleeds off on a long tail (measured on the reference),
and moves overlap so nothing snaps or sits dead.

```bash
npx --yes hyperframes@0.8.114 render -f 30 -q high -o renders/goat-perps-limit.mp4
```
