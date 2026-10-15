# just ask (HyperFrames)

A 16.7 s, 1920x1080 / 30 fps HyperFrames clip in the same type and motion language as the earlier clips: "just ask",
then the AI flow on the acend desktop app, rebuilt from the supplied screenshots.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–30    | 0.00–1.00   | "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white |
| 30–90   | 1.00–3.00   | the pill becomes the Account button while the camera pulls back in one slow move and the Markets page opens out around it; the balance counts up to $1,350.00 |
| 90–132  | 3.00–4.40   | click AI: the tab grows into the AI page, which settles in |
| 143–298 | 4.77–9.93   | it rides along the input as the prompt types, then follows the message up: typing dots, a streamed reply, three plan cards with pastel washes |
| 296–336 | 9.87–11.20  | click Coca-Cola: the card expands into its page and the logo glides onto the page's header logo, as the window floats up in 3D |
| 356–500 | 11.87–16.67 | in to the order panel: 375 typed, Buy, "Bought 4.00 KO"; back out to the floating window, a toast, the balance settles to $975.00 |

- `assets/desk.js` builds the desktop app at the screenshots' pixel size (a 1920 x 900 window): the top bar, the
  Markets page (Solana, and the same layout for Coca-Cola with a live amount field and a Buy button) and the AI
  chat page. `assets/logos.js` holds the crypto token art; stock logos and the suggestion icons are in `assets/icons`.
- One continuous camera on Gaussian-smoothed keyframes (velocity and acceleration continuous), no cuts. The two
  screen changes are match moves on the clicked element: the AI tab grows into the AI page; the Coca-Cola card
  expands into its page while its logo glides onto the page's header logo. The window floats in 3D on a deep backdrop for the
  order; pastel washes and soft click blooms carry the interactions.
- Mock data: $1,350.00 USDC; the AI keeps $100 as a buffer and splits $1,250 into US Treasury Bills $500,
  Johnson & Johnson $375 and Coca-Cola $375; the order buys $375 of KO (~4.00 KO at $93.76).
- The cursor is a soft mint dot; each click blooms and rings.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 360-degree shutter
```
