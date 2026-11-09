# The Canary — production notes

- Voice: the user's ElevenLabs voiceover (`voice/voice.mp3` -> `voice/voice.wav`, 61.0 s). Word timings `voice/words.json`
  from faster-whisper small.en (`voice/transcribe.py`); every shot and reaction is timed to them in
  `src/videos/canary/story.ts`.
- Picture: composition `CanaryShort` (1080x1920, 30 fps, 1845 frames) in `src/videos/canary/`, built on the cartoon-3d-short
  engine. The Narrator (user's character sheet) is drawn in `narrator.ts` (curls, round eyes, hoodie, jeans; poses
  stand/pockets/point/explain/shrug/think/wave/walk; lip-sync from the voice words). Miners: `outfits.ts` + toon.ts helmet.
  Canary, cage, pick, gas swirls, pocket watch: `fxcanary.ts`. Mine + pithead world: `world.ts`. Acting per shot: `cast.ts`.
- 2D check sheet of the drawings: composition `CanarySheet`.
- Sound: `audio/make_audio.py` -> mix.wav (-14 LUFS, -1 dBTP), stems/, cues.md. Whistle motif G5-E5-C6.
- Render: `npx remotion render src/index.ts CanaryShort out/canary/video.mp4 --codec h264 --crf 17 --gl=swangle
  --concurrency=3 --timeout=600000 --browser-executable=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, then mux
  `shorts/canary/audio/mix.wav` with `-map 0:v:0 -map 1:a:0`. Software WebGL here: ~8 s per frame effective.
