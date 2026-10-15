# just ask (HyperFrames)

A 15.7 s, 1920x1080 / 30 fps HyperFrames clip in the same type and motion language as the earlier clips: "just ask",
then the AI flow on the acend desktop app, rebuilt from the supplied screenshots.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–30    | 0.00–1.00   | "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white |
| 30–72   | 1.00–2.40   | the pill becomes the Account button while the camera pulls back and the Markets page opens out around it |
| 46–92   | 1.53–3.07   | the page cascades in, the candles draw, the USDC balance counts up to $1,350.00 |
| 72–470  | 2.40–15.67  | the edit cuts between shots (wide, close-ups, 3D): click AI; the prompt types in a macro that rides the message box; the reply streams and three plan cards arrive with pastel washes; click Coca-Cola; its page floats in, in 3D; 375 is typed, Buy lights up; "Bought 4.00 KO"; a toast drops in and the balance settles to $975.00 |

- `assets/desk.js` builds the desktop app at the screenshots' pixel size (a 1920 x 900 window): the top bar, the
  Markets page (Solana, and the same layout for Coca-Cola with a live amount field and a Buy button) and the AI
  chat page. `assets/logos.js` holds the crypto token art; stock logos and the suggestion icons are in `assets/icons`.
- After the opening pull-back (which carries the "ask" pill onto the Account button) the edit follows the motion
  reference: cuts between shots, each a slow continuous drift; close-ups on the detail that matters; the window
  floating in 3D on a deep backdrop; pastel washes and soft click blooms.
- Mock data: $1,350.00 USDC; the AI keeps $100 as a buffer and splits $1,250 into US Treasury Bills $500,
  Johnson & Johnson $375 and Coca-Cola $375; the order buys $375 of KO (~4.00 KO at $93.76).
- The cursor is a soft mint dot; each click blooms and rings.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
