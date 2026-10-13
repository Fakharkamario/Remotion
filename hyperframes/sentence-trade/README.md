# your next trade starts with a sentence (HyperFrames)

A 5.1 s, 1920x1080 / 30 fps HyperFrames clip. It follows the reference cut beat for beat (same 153 frames),
with the copy "Your next trade starts with a sentence" and the Trade screen from the supplied screenshot.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–26    | 0.00–0.90   | "Your next" grows, "trade" joins, the line squeezes shut |
| 27–46   | 0.90–1.56   | "starts" punches in big and settles, "with a" joins |
| 47–74   | 1.56–2.50   | "sentence" in blue with a lavender sweep; Solana, Bitcoin, Ethereum and Zcash coins tumble in |
| 74–88   | 2.47–2.96   | the word dissolves letter by letter, the Solana coin flips toward the phone |
| 81–108  | 2.70–3.60   | the Trade screen rises; each coin flies down and becomes its row icon |
| 96–152  | 3.20–5.10   | prices tick, the screen scrolls to the AI input + keyboard and "Buy $100 of SOL" is typed |

- `assets/phone.js` rebuilds the Trade screen in DOM at iPhone point size (430 x 932 pt), measured off the
  1290 x 2512 screenshot, with the keyboard and an AI input bar below the list.
- `assets/logos.js` holds the token art; the same face is used for the row icon and the 3D coin.
- `assets/scene.js` draws every element as a pure function of the frame number. All motion runs on monotone
  cubic splines, so velocity is continuous and nothing parks between beats, matching the reference cadence. Coins are CSS 3D discs
  (stacked rim layers + two faces) that blend onto their row icon's live position as they land.

There is no soundtrack.

```bash
npx hyperframes preview
npx hyperframes render -f 30 -q high -o renders/sentence-trade.mp4
```
