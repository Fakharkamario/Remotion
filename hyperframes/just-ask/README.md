# just ask (HyperFrames)

A 16.9 s, 1920x1080 / 30 fps HyperFrames clip that picks up on the last frame of `one-terminal` (Explore,
Pre-IPO selected) and continues in the same type and motion language: "just [ask]", then the AI flow on the
Home and AI screens rebuilt from the supplied screenshots.

| frames  | time (s)     | beat |
|---------|--------------|------|
| 0–27    | 0.00–0.90    | the camera pushes into the Pre-IPO button while a feathered mask dissolves the screen; the button floats free |
| 25–80   | 0.83–2.67    | the circle stretches into a pill that shows "ask" in white; "just" joins in ink |
| 76–118  | 2.53–3.93    | the pill rounds back into a circle that becomes the "M" avatar while the camera pulls back and Home is revealed |
| 95–150  | 3.17–5.00    | Home cascades in, Total assets counts up to $1,350.00, sparklines draw |
| 150–200 | 5.00–6.67    | the camera eases out to the whole phone; the cursor taps AI; Home slides away, the AI screen builds in |
| 200–262 | 6.67–8.73    | tap the input: the keyboard slides up, the prompt types with key presses; tap send |
| 262–330 | 8.73–11.00   | the message flies up into a bubble, a typing indicator, a streamed reply and three low-risk asset cards |
| 342–392 | 11.40–13.07  | the cursor taps Coca-Cola: the trade panel slides up; it taps 3, 7, 5 and the amount builds |
| 392–432 | 13.07–14.40  | "Slide to buy": the camera pushes in on the slider and the cursor drags the knob across |
| 432–507 | 14.40–16.93  | the camera pulls back as a live-activity pill drops in: "Buying 4.00 KO", then "Bought" |

- Frame 0 is a live rebuild of `one-terminal`'s last frame (`assets/explore.js` is its Explore builder; the
  camera matches its final transform exactly), so the two clips cut together seamlessly.
- Both transitions drive the camera from one spline (centre + diameter) of the shape that carries across, as in
  `one-terminal`; reveals are feathered radial masks.
- Mock data: $1,350.00 in the account; the rule chips read "Keep $100 USDC / Max $500 a trade", and the AI reply
  respects them: $100 kept aside, $1,250 split into US Treasury Bills $500, Johnson & Johnson $375 and
  Coca-Cola $375. The trade panel (from the supplied screenshots) shows $1,350.00 available; $375 buys ~4.00 KO
  at $93.7601 with a 0.5% fee.
- The trade flow follows the motion reference: keypad entry, a close push-in on "Slide to buy", and a
  live-activity pill confirming the order. Camera holds are slow drifts, so nothing parks.
- Logos, the acend wordmark and the suggestion icon clusters are cropped from the screenshots (`assets/icons`).

There is no soundtrack.

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final: 240 fps samples blended to 30 fps with a 180-degree shutter
```
