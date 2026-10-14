# just ask (HyperFrames)

A 17.2 s, 1920x1080 / 30 fps HyperFrames clip that picks up on the last frame of `one-terminal` (Explore,
Pre-IPO selected) and continues in the same type and motion language: "just [ask]", then the AI flow on the
Home and AI screens rebuilt from the supplied screenshots.

| frames  | time (s)     | beat |
|---------|--------------|------|
| 0–37    | 0.00–1.23    | the camera pushes into the Pre-IPO button as the screen dissolves; the button eases down and fades |
| 31–74   | 1.03–2.47    | "just" rises in letter by letter, "ask" joins and the line re-centres; a pill grows behind "ask" |
| 66–130  | 2.20–4.33    | the letters lift away, the pill rounds into the "M" avatar, and the camera pulls back as Home is revealed |
| 95–150  | 3.17–5.00    | Home cascades in, Total assets counts up to $1,350.00, sparklines draw |
| 140–208 | 4.67–6.93    | the camera eases out to frame the screen; the cursor taps AI and the AI screen crossfades in |
| 208–262 | 6.93–8.73    | tap the input: the keyboard rises and the prompt types itself; tap send |
| 262–340 | 8.73–11.33   | the message drifts up into a bubble, a typing indicator, a streamed reply and three low-risk asset cards |
| 342–394 | 11.40–13.13  | the cursor taps Coca-Cola: the trade panel rises in; it taps 3, 7, 5 and the amount builds |
| 394–444 | 13.13–14.80  | the camera pushes in gently on "Slide to buy" and the cursor drags the knob across |
| 444–515 | 14.80–17.20  | the camera eases back to the phone; a live-activity pill drops in, "Buying 4.00 KO", then "Bought" |

- Frame 0 is a live rebuild of `one-terminal`'s last frame (`assets/explore.js` is its Explore builder; the
  camera matches its final transform exactly), so the two clips cut together seamlessly.
- Both transitions drive the camera from one spline (centre + diameter) of the shape that carries across, as in
  `one-terminal`; reveals are feathered radial masks.
- Mock data: $1,350.00 in the account; the rule chips read "Keep $100 USDC / Max $500 a trade", and the AI reply
  respects them: $100 kept aside, $1,250 split into US Treasury Bills $500, Johnson & Johnson $375 and
  Coca-Cola $375. The trade panel (from the supplied screenshots) shows $1,350.00 available; $375 buys ~4.00 KO
  at $93.7601 with a 0.5% fee.
- The trade flow follows the motion reference: keypad entry, a close push-in on "Slide to buy", and a
  live-activity pill confirming the order.
- The camera after the reveal is one keyframed path, Gaussian-smoothed (sigma 7 frames) so its velocity and
  acceleration are continuous; its peak on-screen speed is ~34 px/frame. UI motion uses smooth ease-in-out
  (no expo/spring curves, which start at several times their average speed).
- Logos, the acend wordmark and the suggestion icon clusters are cropped from the screenshots (`assets/icons`).

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
