# just ask (HyperFrames)

A 15.7 s, 1920x1080 / 30 fps HyperFrames clip in the same type and motion language as the earlier clips: "just ask",
then the AI flow on the acend desktop app, rebuilt from the supplied screenshots.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–30    | 0.00–1.00   | "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white |
| 30–72   | 1.00–2.40   | the pill becomes the Account button while the camera pulls back and the Markets page opens out around it |
| 46–92   | 1.53–3.07   | the page cascades in, the candles draw, the USDC balance counts up to $1,350.00 |
| 92–140  | 3.07–4.67   | the cursor clicks AI: the tab pill glides over and the AI page rises in |
| 140–196 | 4.67–6.53   | click the message box: the camera eases in, the prompt types itself, click send |
| 196–290 | 6.53–9.67   | the message flies up into a bubble, a typing indicator, a streamed reply and three low-risk asset cards |
| 300–392 | 10.0–13.07  | click Coca-Cola: its Markets page cascades in, the camera pushes in on the order panel, 375 is typed, click Buy |
| 392–470 | 13.07–15.67 | the camera eases back to the whole window; a toast drops in, "Buying", then "Bought 4.00 KO"; the balance settles to $975.00 |

- `assets/desk.js` builds the desktop app at the screenshots' pixel size (a 1920 x 900 window): the top bar, the
  Markets page (Solana, and the same layout for Coca-Cola with a live amount field and a Buy button) and the AI
  chat page. `assets/logos.js` holds the crypto token art; stock logos and the suggestion icons are in `assets/icons`.
- The camera is one keyframed path (focus point + zoom), Gaussian-smoothed (sigma 6 frames), so velocity and
  acceleration are continuous; the opening pull-back carries the "ask" pill onto the Account button.
- Mock data: $1,350.00 USDC; the AI keeps $100 as a buffer and splits $1,250 into US Treasury Bills $500,
  Johnson & Johnson $375 and Coca-Cola $375; the order buys $375 of KO (~4.00 KO at $93.76).
- The cursor is the brush-stroke comet with a mint tap halo from the earlier clips.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
