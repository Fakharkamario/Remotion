# GOAT Funded Perps: 100+ perpetual markets (HyperFrames)

A 7.7 s, 1920x1080 / 30 fps clip (231 frames) with the supplied voiceover, rebuilt from the supplied reference
("Rules running in the background" -> Holding times / Exposure limits / News windows / Consistency checks) in the
Perps brand (near-black ground, Perps orange as light, Altform).

VO: "Access over 100 perpetual markets, including crypto, forex, indices, commodities, and stocks, all in one place."

| frames  | beat |
|---------|------|
| 9–48    | "100+ perpetual / markets in one place" builds word by word out of glowing pixels inside dashed selection boxes |
| 66–80   | the headline flares toward white as the camera starts to leave it |
| 77–88   | the camera glides down-right onto the first card; each later card arrives from the upper right and the last one slides out of focus to the lower left |
| 88/112/131/150/172 | Crypto, Forex, Indices, Commodities, Stocks land, each just before its word in the VO |
| 192–222 | "all in one place": the camera draws back over the whole set |

Everything is one three.js space (cards, headline plane, a sparse field of dimmer cards and dot grids). Each frame
averages up to 12 sub-frame renders over a 180-degree shutter (true motion blur), then a thin-lens depth of field
focused on the camera's subject.

```bash
npx --yes hyperframes@0.8.114 render -f 30 -q high -o renders/goat-perps-markets.mp4
```
