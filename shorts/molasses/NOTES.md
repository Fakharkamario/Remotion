# The Sweetest Disaster — production notes

- Final: `out/molasses/molasses_flood_short.mp4` (1440x2560, 30 fps, 930 frames, 31.0 s, h264 crf 16 + AAC 256k).
  Not committed (out/ is git-ignored, ~60 MB). Rebuild: render `MolassesShort` with
  `--scale=1.3333333333333333 --gl=swangle --concurrency=2 --timeout=600000` (a `--scale 1.3333` gives a non-integer
  height and fails), then mux `shorts/molasses/audio/mix.wav` with `-map 0:v:0 -map 1:a:0`.
- Code: `src/videos/molasses/` (story.ts = shots/cameras/wave physics, world.ts = Boston + tank + wave, cast.ts = people).
- Voice: stand-in espeak-ng + MBROLA us2 (`shorts/molasses/voice/make_voice.py`). To use a real voice, replace
  voice.wav + words.json, re-time story.ts frames to the new words, then re-run `audio/make_audio.py`.
- Sound: `shorts/molasses/audio/make_audio.py` -> mix.wav (-14 LUFS, -1.1 dBTP), stems/, cues.md.
- QA (scripts/short_qa.py): no black/white/frozen frames; remaining flagged pops are planned cuts (252, 313, 544,
  770, 864), the rivet kick (323-327) and the sniff expression swap (866).
- Render cost here (software WebGL, 4 CPUs): ~7-8 s per 2K frame, ~2 h for the whole short.
- Not done: the skill's Opus-max look verification against the private reference frames (style references were
  used via the template's tuned values only).
