# just ask (HyperFrames)

A 16.2 s, 1920x1080 / 30 fps HyperFrames clip in the same type and motion language as the earlier clips: "just ask",
then the AI flow on the acend desktop app, rebuilt from the supplied screenshots.

| frames  | time (s)    | beat |
|---------|-------------|------|
| 0–30    | 0.00–1.00   | "just" grows, "ask" joins and the line glides to centre; a dark pill grows behind "ask" as it turns white |
| 30–84   | 1.00–2.80   | the pill becomes the Account button while the camera pulls back in one smooth move and the Markets page opens out around it; the balance counts up to $1,350.00 |
| 84–113  | 2.80–3.77   | the cursor (a soft mint dot) clicks AI and the camera whips in on the tab |
| 113     | 3.77        | match cut onto the AI page, its title on the same spot |
| 113–309 | 3.77–10.30  | down to the message box, riding along as the prompt types; up with the message into the chat; the reply and three plan cards with pastel washes; click Coca-Cola, the camera pushes in on its logo |
| 309     | 10.30       | match cut on the logo: the same logo, same size and place, on Coca-Cola's page; the camera pulls back as the window floats up in 3D |
| 345–486 | 11.50–16.20 | in to the order panel: 375 typed, Buy, "Bought 4.00 KO"; back out to the floating window, a toast, the balance settles to $975.00 |

- `assets/desk.js` builds the desktop app at the screenshots' pixel size (a 1920 x 900 window): the top bar, the
  Markets page (Solana, and the same layout for Coca-Cola with a live amount field and a Buy button) and the AI
  chat page. `assets/logos.js` holds the crypto token art; stock logos and the suggestion icons are in `assets/icons`.
- Kinetic camera, as in the motion reference: quick moves between close-ups, a 3D float on a deep backdrop for the
  order, pastel washes and soft click blooms. Only two cuts, both match cuts on the clicked element (the AI tab onto
  the AI page title; the Coca-Cola logo on the card onto the same logo on its page). Between them the camera follows
  Gaussian-smoothed keyframes, so velocity and acceleration stay continuous.
- Mock data: $1,350.00 USDC; the AI keeps $100 as a buffer and splits $1,250 into US Treasury Bills $500,
  Johnson & Johnson $375 and Coca-Cola $375; the order buys $375 of KO (~4.00 KO at $93.76).
- The cursor is a soft mint dot; each click blooms and rings.

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 16 samples a frame (half-speed copy at 240 fps), 180-degree shutter
```
