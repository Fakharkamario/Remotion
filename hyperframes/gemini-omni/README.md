# gemini omni (HyperFrames)

A 54.8 s, 1080x1920 / 30 fps edit of a talking-head AI-news short ("Google just made AI video three times longer
and 30% cheaper…"), cut in the language of the supplied reference reel: a black canvas, clean dark product cards on
top with the speaker cropped into the bottom of the frame, short word-timed captions sitting on the seam, white
highlighter sweeps over the key words, full-frame punch-ins between, and big words standing behind his head.

The source is 1080x1920 at 25 fps; `assets/aroll.mp4` is the same take converted to 30 fps (no audio).

| frames    | beat |
|-----------|------|
| 0–44      | full frame: "AI NEWS" tag, slow push out of an opening punch |
| 44–150    | split: **3×** *longer* / **30%** *cheaper* (green, down arrow) |
| 150–270   | full: punch-in on "Wait", a scrambled price chip; **CREATORS** lands behind his head |
| 270–470   | split: NOV 5 calendar tile, *just announced*; the model card types "Gemini Omni 1.2 Flash", preview plays, "AI video model" highlighted |
| 470–612   | split: max clip length counts up to 15 s, the 10 s "Before" bar beneath, +5 sec |
| 612–760   | graphics only: a receipt slides up and prints line by line: rate ≈ $0.07 / sec, 720p |
| 760–935   | split: the receipt rides up top: 15 sec clip, TOTAL rolls to **$1.04**, ding |
| 935–1050  | split: an output frame ("consistent character"), six reference images land and wire into it |
| 1050–1200 | split: native audio (a waveform driven by his real voice level), a voice prompt edits, then extends the clip |
| 1200–1230 | full: **BEST PART?** behind his head |
| 1230–1380 | split: Google Vids card: 15 s clip, $1.04 struck through to **$0.00**, no extra cost, Google account |
| 1380–1490 | split: Gemini app, rolling out: Ultra first, then the other tiers |
| 1490–1586 | full: **$1** behind his head |
| 1586–1644 | full: follow card, a cursor taps Follow → Following; fade to black |

- Captions come from a Whisper transcript (`assets/words.js`, word onsets in frames). Each caption chunk is up to
  three words; key words get a white highlighter box timed to the word.
- The camera is one keyed state (`CAM` in `assets/scene.js`): the take's clip edge and offset move together, so the
  full ↔ split ↔ graphics changes read as the frame sliding, not a wipe.
- `assets/cut/` holds his cutout for the behind-the-head words (BiRefNet-portrait mattes on even frames, odd frames
  averaged). Rebuild with `python3 scripts/build_cutouts.py assets/aroll.mp4 <matte dir>`.
- `scripts/build_assets.py` makes the face stills (reference images, output frame, avatar) and `assets/env.js`.
- `scripts/build_audio.py` mixes the voice with synthesized sound design (whooshes, pops, typing and receipt-print
  ticks, impact hits under the big words, a register ding) and a soft pad bed ducked under the voice, to -14 LUFS.
  Nothing is sampled, so there is nothing to license.
- Type: Inter, Instrument Serif and JetBrains Mono (all OFL), in `assets/fonts/`.
- The product cards are generic rebuilds (no third-party logos).

```bash
npx hyperframes preview
./scripts/render-mb.sh        # final, motion-blurred (120 fps sampled, 180-degree shutter)
```
