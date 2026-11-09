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
| `js/hero3d.js` | three.js hero: procedural rocket, floating shapes, exhaust that grows on scroll |
| `js/site.js` | Nav, word reveal, work previews, video player, physics chips, services cycle, process timeline, estimator, "Laaaunch" arc |
| `vendor/` | three.js r180 and matter-js 0.20, served locally (no CDN dependency) |
| `assets/video/` | Full films (`*.mp4`), 8s hover previews (`*-preview.mp4`), showreel (`reel.mp4`) and hero loop (`reel-loop.mp4`) |
| `assets/logos/` | Client logos converted to single-colour masks, tinted by CSS |
| `assets/img/` | Logo mark, posters |

## Common edits

- **Pricing:** `PRICES` at the top of `js/site.js` (same numbers as the old site). The "from" prices on the four offer cards are in `index.html`.
- **Videos:** `VIDEOS` and `PREVIEWS` at the top of `js/site.js`.
- **Social links and email:** contact section at the bottom of `index.html`.
- **Brand colours and fonts:** `:root` in `css/style.css`.
- **Client logos:** add a PNG with transparency to `assets/logos/` and a `<span class="logo logo-img">` in the marquee (`--ar` is width ÷ height).

Reduced-motion users get a still rocket, static chips and no auto-cycling.
