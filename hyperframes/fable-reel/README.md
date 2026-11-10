# Fable 5.2 reel (HyperFrames)

A 57.5 s, 1080x1920 / 30 fps vertical edit of the "Claude Fable 5.2" talking-head take. The edit's
layouts, captions, labels, cards and colour follow the three talking-head style references. Its B-roll is cut
out of the elements video (the earlier edit of the same script).

**Pacing.** Every pause in the take is cut down to a short breath (60.6 s down to 57.5 s, 15 jump cuts). The
shot changes every 1–3 s. Full-frame shots jump-zoom on key words.

**Layouts** (`assets/scene.js`):
- `full`: the take full-frame, with a short shake when a zoom slams in.
- `split`: a cream/peach ground with a white label tab at the top and a card in the top half. The take sits
  below a moving wavy edge.
- `inset`: a big card with the take shrunk to a rounded inset; the captions sit between them.
- `broll`: the Tokyo clip big on a dark ground.

**Captions.** A white pill showing 1–3 words. A word turns dark when it is spoken, and the words still to come
stay faded. The hook and the two stamps (ZERO EDITS, MASTERPIECE) replace the captions while they are on screen.

**Colour.** The take gets a warm grade with a little contrast, bite and fine grain. The graphics use cream,
peach and orange (#ee6a3a) with green checks, as in the references.

**Beats.** Each beat is timed to the ASR word onsets and listed in `assets/plan.js`. The audio build reads the
same file, so every sound effect lands on its visual.

The table lists each beat's start time, its layout and what is on screen.

| t (s) | layout | beat |
|---|---|---|
| 0.0 | intro | the references' opener: tight punch on the face whips out as a hero panel drops in from the top (wavy edge, glowing orange outline). The panel is a release card whose score counts 0 → 65, stat rows and a red "just released" banner tick in. ANTHROPIC JUST DROPPED (Montserrat Black) then FABLE 5.2 (Anton, orange gradient + glow) write on letter by letter with a sideways smear; light burn into the next shot |
| 4.3 | split | reactions pop in: "The internet is losing it" |
| 7.1 | split | intelligence-index chart → serif quote, highlighter on "human evolution" |
| 10.3 | full | jump zooms, "Time?" / "Money?" tags |
| 12.9 | split | prompt bubble types "a dot.", a red ball drops and bounces |
| 16.2 | inset | the dot film + night sky clip, tags Hand-coded / Pixar-style / Short film |
| 19.5 | full | "Original music" tag with an animated EQ |
| 22.2 | split | history clip + 3.3M counter |
| 25.3 | split | prediction clip + 2026 → 2056 counter |
| 27.6 | split | Deep thinking toggle flips on, 24/7 slams in |
| 31.4 | split | 5.1 vs 5.2 speed bars, +30% |
| 33.0 | full | "And the biggest surprise" punch-in |
| 34.4 | split | price card: $10/$50 struck → $8/$40, ↓20% badge |
| 36.5 | full | "1 line. that's it." |
| 39.3 | split | prompt box types the Tokyo prompt word by word, cursor hits send |
| 42.8 | split | Tokyo clip |
| 45.0 | split → full | Tokyo clip with Lighting / Sound / Camera motion checks, then full bleed "AN ABSOLUTE MASTERPIECE" |
| 49.6 | full | ZERO EDITS stamp |
| 50.6 | inset | skill card: steps tick, cursor clicks "Run in one click" |
| 54.2 | full | COMMENT THE WORD "FABLE" call to action, "Straight to your DMs" |

## Rebuild

The raw take and the elements video are not in the repo. Put them anywhere and run:

```bash
# words.json: faster-whisper (medium, word_timestamps=True) on the raw take, as [{"w","s","e"}, ...]
python3 scripts/build_media.py <raw_take.mp4> <elements_video.mp4> <words.json>   # aroll.mp4, voice.wav, words.js, broll/*.mp4
python3 scripts/build_audio.py                                                     # audio.m4a (voice + SFX + music bed)
npx --yes hyperframes@0.8.114 render -q high -o renders/fable-reel.mp4
```

All sound design and the music bed are synthesized in `scripts/build_audio.py`, so no samples are used. The
fonts are Plus Jakarta Sans, Montserrat, Anton, Archivo, Source Serif 4 and JetBrains Mono, all from Fontsource under the OFL.
