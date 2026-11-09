# Launch Studio website

Static site in plain HTML, CSS and JavaScript. No build step.

## Run locally

```bash
cd website
python3 -m http.server 8000
```

Then open http://localhost:8000. A local server is needed because the 3D hero uses ES modules.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | All page content and copy |
| `css/style.css` | Design tokens (`:root`) and all styles |
| `js/objects3d.js` | Live 3D props in the hero (rocket, clapperboard, play key, countdown). One shared WebGL renderer; three.js loads after the page is idle |
| `js/site.js` | Hero physics (props drop when touched), Now Playing mini player, blur-in statement, services tabs and animated UI scenes, scroll-scrubbed editor timeline, estimator, rotating "Laaaunch" ring |
| `vendor/` | three.js r180 and matter-js 0.20, served locally (no CDN dependency) |
| `assets/video/` | Full films (`*.mp4`), 8s muted previews (`*-preview.mp4`) and the showreel (`reel.mp4`) |
| `assets/logos/` | Client logos converted to single-colour masks, tinted by CSS |
| `assets/img/` | Logo mark, video posters, and `obj-*.png` stills of the 3D props shown before three.js loads |

## Common edits

- **Pricing:** `PRICES` at the top of `js/site.js` (same numbers as the old site). The "from" prices in the rates list are in `index.html`.
- **Videos:** `FILMS` at the top of `js/site.js` (also feeds the Now Playing widget).
- **3D prop stills:** after changing a prop in `js/objects3d.js`, open the page with `?posters` and call `__posters()` in the console to get fresh PNGs.
- **Social links and email:** contact section at the bottom of `index.html`.
- **Brand colours and fonts:** `:root` in `css/style.css`.
- **Client logos:** add a PNG with transparency to `assets/logos/` and a `<span class="logo">` in the clients row (`--ar` is width ÷ height).

Reduced-motion users get still props, no physics and no auto-cycling.
