# The Man Who Taxed the Dead (56 s)

## Facts (sources: E. V. Anisimov, *The Reforms of Peter the Great* (1993); Britannica, "Poll tax (Russia)";
## N. Gogol, *Dead Souls* (1842) for the later practice of mortgaging dead serfs)
- Peter the Great's poll ("soul") tax replaced the household tax after the first revision census (1718-1724).
- Every male "soul" on the census roll was taxed until the next revision; revisions came every 15-20+ years
  (1719, 1744, 1762, 1782 ...), so families and landlords kept paying for men who had died in between.
- Landowners could mortgage serfs listed on the roll, including dead ones still counted, to the state banks
  (the scheme Gogol's Chichikov runs in *Dead Souls*).

## Voice
User-supplied ElevenLabs voiceover (`voice/original.mp3`, 63.5 s). `voice/cut_silence.py` cuts every pause to 0.11 s
and speeds up 4 % -> `voice/voice.wav` (55.1 s). `voice/align.py` (pocketsphinx forced alignment of `script.txt`)
-> `voice/words.json`; `voice/lips.py` -> narrator lip sync (`src/videos/deadtax/lips.ts`).
