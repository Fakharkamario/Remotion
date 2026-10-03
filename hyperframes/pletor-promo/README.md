# Pletor promo (HyperFrames)

A HyperFrames recreation of the 9.3 s Pletor teaser: "Scale Up" card field → rotating card ring with "While staying on your brand" → `pletor` logo lockup → typed `Pletor.ai` URL pill with cursor click.

```
index.html                  root (1920x1080, 9.3s): mounts the scenes + soundtrack
compositions/scale-up.html     0.00–2.15s  3D card field fly-in / dolly / rush-through
compositions/brand-ring.html   1.85–4.45s  elliptical ring of two-sided cards
compositions/logo.html         3.70–6.30s  wordmark colour sweep + tagline wipe
compositions/url-pill.html     6.20–9.30s  typed URL, cursor click, pill flash
compositions/speed-lines.html  1.60–4.70s  radial line bursts on both transitions
assets/cards.js             SVG stand-ins for the campaign photos + shared helpers
assets/audio.m4a            soundtrack taken from the reference video
assets/vendor, assets/fonts GSAP and Inter, stored locally (no CDN needed)
```

## Commands

```bash
npx hyperframes preview --background   # Studio preview
npx hyperframes check                  # lint + runtime + layout + contrast
npx hyperframes render -q high -o renders/pletor-promo.mp4
```

If Chrome isn't installed, either run `npx hyperframes browser ensure` or point
`HYPERFRAMES_BROWSER_PATH` at an existing headless Chrome.

## Using real photos

The card artwork is drawn in `assets/cards.js` (`ARTS`). To use real images, change
`cardArt()` to return `<img src="assets/photos/....jpg">` for a key; card layouts in
`scale-up.html` (`field`) and `brand-ring.html` (`rings`) reference arts by key.
